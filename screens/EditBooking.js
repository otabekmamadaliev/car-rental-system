import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Platform, Alert, Modal, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function EditBooking({ route, navigation }) {
  const bookingId = route?.params?.bookingId;
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form fields
  const [pickupDate, setPickupDate] = useState(new Date());
  const [returnDate, setReturnDate] = useState(new Date());
  const [pickupTime, setPickupTime] = useState(new Date());
  const [returnTime, setReturnTime] = useState(new Date());
  const [pickupLocation, setPickupLocation] = useState('');
  const [returnLocation, setReturnLocation] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // UI states
  const [showPickupDatePicker, setShowPickupDatePicker] = useState(false);
  const [showReturnDatePicker, setShowReturnDatePicker] = useState(false);
  const [showPickupTimePicker, setShowPickupTimePicker] = useState(false);
  const [showReturnTimePicker, setShowReturnTimePicker] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationSelectionType, setLocationSelectionType] = useState('pickup');

  const locations = [
    'Main Office - Downtown',
    'Airport Terminal',
    'North Branch',
    'South Branch',
    'Hotel Delivery',
  ];

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : null;
      if (!user) {
        Alert.alert('Error', 'Please log in to view booking.');
        navigation.goBack();
        return;
      }
      
      const bookingsData = await AsyncStorage.getItem(`bookings_${user.email}`);
      const bookings = bookingsData ? JSON.parse(bookingsData) : [];
      const currentBooking = bookings.find(b => b.id === bookingId);
      
      if (currentBooking) {
        setBooking(currentBooking);
        setPickupDate(new Date(currentBooking.pickupDate));
        setReturnDate(new Date(currentBooking.returnDate));
        
        // Parse time strings
        const [pickupHour, pickupMin] = currentBooking.pickupTime.split(':').map(s => parseInt(s.replace(/[^0-9]/g, '')));
        const [returnHour, returnMin] = currentBooking.returnTime.split(':').map(s => parseInt(s.replace(/[^0-9]/g, '')));
        
        const pickupTimeDate = new Date();
        pickupTimeDate.setHours(pickupHour || 9, pickupMin || 0);
        setPickupTime(pickupTimeDate);
        
        const returnTimeDate = new Date();
        returnTimeDate.setHours(returnHour || 9, returnMin || 0);
        setReturnTime(returnTimeDate);
        
        setPickupLocation(currentBooking.pickupLocation);
        setReturnLocation(currentBooking.returnLocation);
        setAdditionalNotes(currentBooking.additionalNotes || '');
      }
    } catch (error) {
      console.error('Error loading booking:', error);
      Alert.alert('Error', 'Could not load booking details');
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = () => {
    const diffTime = Math.abs(returnDate - pickupDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };

  const calculateTotal = () => {
    if (!booking) return { days: 1, basePrice: 0, insurance: 0, tax: 0, total: 0 };
    
    const days = calculateDays();
    const basePrice = booking.pricePerDay * days;
    const insurance = 15 * days;
    const tax = (basePrice + insurance) * 0.1;
    return {
      days,
      basePrice,
      insurance,
      tax,
      total: basePrice + insurance + tax,
    };
  };

  const handleUpdateBooking = async () => {
    try {
      // Helper function to convert 12-hour time to 24-hour format
      const convertTo24Hour = (time12h) => {
        if (!time12h) return '00:00:00';
        
        const trimmed = time12h.trim();
        
        // Match pattern like "5:59 PM" or "05:59 PM"
        const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
        if (!match) {
          console.error('Invalid time format:', time12h);
          return '00:00:00';
        }
        
        let hours = parseInt(match[1], 10);
        const minutes = match[2];
        const modifier = match[3].toUpperCase();
        
        if (isNaN(hours)) return '00:00:00';
        
        if (modifier === 'AM') {
          if (hours === 12) {
            hours = 0;
          }
        } else if (modifier === 'PM') {
          if (hours !== 12) {
            hours = hours + 12;
          }
        }
        
        return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
      };

      // Check car availability for new dates/times (excluding current booking)
      const pickupTimeStr = pickupTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const returnTimeStr = returnTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      
      const requestedStart = new Date(`${pickupDate.toISOString().split('T')[0]}T${convertTo24Hour(pickupTimeStr)}`);
      const requestedEnd = new Date(`${returnDate.toISOString().split('T')[0]}T${convertTo24Hour(returnTimeStr)}`);
      
      const userJson = await AsyncStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : null;
      if (!user) {
        Alert.alert('Error', 'Please log in to update booking.');
        return;
      }
      
      const bookingsData = await AsyncStorage.getItem(`bookings_${user.email}`);
      const allBookings = bookingsData ? JSON.parse(bookingsData) : [];
      
      // Check for conflicts with other bookings (excluding this one)
      const hasConflict = allBookings.some(b => {
        if (b.id === bookingId || b.carId !== booking.carId || b.status === 'cancelled') {
          return false;
        }
        
        const bookingStart = new Date(`${b.pickupDate.split('T')[0]}T${convertTo24Hour(b.pickupTime)}`);
        const bookingEnd = new Date(`${b.returnDate.split('T')[0]}T${convertTo24Hour(b.returnTime)}`);
        
        // Check for overlap
        return bookingStart < requestedEnd && bookingEnd > requestedStart;
      });

      if (hasConflict) {
        Alert.alert(
          'Car Not Available',
          'This car is already booked by another customer for the selected dates and times. Please choose different dates.',
          [{ text: 'OK' }]
        );
        return;
      }

      const costs = calculateTotal();
      const updatedBooking = {
        ...booking,
        pickupDate: pickupDate.toISOString(),
        returnDate: returnDate.toISOString(),
        pickupTime: pickupTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        returnTime: returnTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        pickupLocation,
        returnLocation,
        additionalNotes,
        days: costs.days,
        totalCost: costs.total,
      };

      const updatedBookings = allBookings.map(b => b.id === bookingId ? updatedBooking : b);
      await AsyncStorage.setItem(`bookings_${user.email}`, JSON.stringify(updatedBookings));

      Alert.alert(
        'Booking Updated!',
        `Your booking has been updated. New total: $${costs.total.toFixed(2)}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('MyBookings'),
          },
        ]
      );
    } catch (error) {
      console.error('Error updating booking:', error);
      Alert.alert('Error', 'Could not update booking');
    }
  };

  const handleCancelBooking = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const userJson = await AsyncStorage.getItem('user');
              const user = userJson ? JSON.parse(userJson) : null;
              if (!user) {
                Alert.alert('Error', 'Please log in to cancel booking.');
                return;
              }
              
              const bookingsData = await AsyncStorage.getItem(`bookings_${user.email}`);
              const bookings = bookingsData ? JSON.parse(bookingsData) : [];
              const updatedBookings = bookings.map(b =>
                b.id === bookingId ? { ...b, status: 'cancelled' } : b
              );
              await AsyncStorage.setItem(`bookings_${user.email}`, JSON.stringify(updatedBookings));
              
              Alert.alert('Cancelled', 'Your booking has been cancelled.', [
                { text: 'OK', onPress: () => navigation.navigate('MyBookings') }
              ]);
            } catch (error) {
              Alert.alert('Error', 'Could not cancel booking');
            }
          },
        },
      ]
    );
  };

  if (loading || !booking) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const costs = calculateTotal();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Car Info Header */}
        <View style={styles.carHeader}>
          <Image source={booking.carImage} style={styles.carImage} resizeMode="contain" />
          <View style={styles.carHeaderContent}>
            <Text style={styles.carBrand}>{booking.carBrand}</Text>
            <Text style={styles.carModel}>{booking.carModel}</Text>
            <View style={styles.statusBadge}>
              <Ionicons name="time-outline" size={14} color="#00D9FF" />
              <Text style={styles.statusText}>{booking.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={24} color="#00D9FF" />
            <Text style={styles.infoText}>
              Modify your booking details below. Changes will update the total price.
            </Text>
          </View>

          {/* Rental Period */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rental Period</Text>
            
            <View style={styles.dateTimeRow}>
              <View style={styles.dateTimeItem}>
                <Text style={styles.inputLabel}>Pickup Date</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => setShowPickupDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#FF6B35" />
                  <Text style={styles.dateText}>
                    {pickupDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.dateTimeItem}>
                <Text style={styles.inputLabel}>Pickup Time</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => setShowPickupTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={20} color="#FF6B35" />
                  <Text style={styles.dateText}>
                    {pickupTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.dateTimeRow}>
              <View style={styles.dateTimeItem}>
                <Text style={styles.inputLabel}>Return Date</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => setShowReturnDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#FF6B35" />
                  <Text style={styles.dateText}>
                    {returnDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.dateTimeItem}>
                <Text style={styles.inputLabel}>Return Time</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => setShowReturnTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={20} color="#FF6B35" />
                  <Text style={styles.dateText}>
                    {returnTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.durationBanner}>
              <Ionicons name="time" size={24} color="#00D9FF" />
              <Text style={styles.durationText}>
                Rental Duration: <Text style={styles.durationDays}>{costs.days} day{costs.days > 1 ? 's' : ''}</Text>
              </Text>
            </View>
          </View>

          {/* Locations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pick-up & Return</Text>
            
            <Text style={styles.inputLabel}>Pickup Location</Text>
            <TouchableOpacity 
              style={styles.locationInput}
              onPress={() => {
                setLocationSelectionType('pickup');
                setShowLocationModal(true);
              }}
            >
              <Ionicons name="location" size={20} color="#FF6B35" />
              <Text style={styles.locationText}>{pickupLocation}</Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Return Location</Text>
            <TouchableOpacity 
              style={styles.locationInput}
              onPress={() => {
                setLocationSelectionType('return');
                setShowLocationModal(true);
              }}
            >
              <Ionicons name="location" size={20} color="#FF6B35" />
              <Text style={styles.locationText}>{returnLocation}</Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Additional Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={additionalNotes}
              onChangeText={setAdditionalNotes}
              placeholder="Any special requests or requirements?"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Updated Price Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Updated Price Summary</Text>
            <View style={styles.priceBreakdown}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Base Price ({costs.days} day{costs.days > 1 ? 's' : ''})</Text>
                <Text style={styles.priceValue}>${costs.basePrice.toFixed(2)}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Insurance</Text>
                <Text style={styles.priceValue}>${costs.insurance.toFixed(2)}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Tax (10%)</Text>
                <Text style={styles.priceValue}>${costs.tax.toFixed(2)}</Text>
              </View>
              {booking.totalCost !== costs.total && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Original Total</Text>
                  <Text style={[styles.priceValue, styles.oldPrice]}>${booking.totalCost.toFixed(2)}</Text>
                </View>
              )}
              <View style={[styles.priceRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>New Total</Text>
                <Text style={styles.totalValue}>${costs.total.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={handleCancelBooking}
        >
          <Ionicons name="close-circle-outline" size={20} color="#FF3B30" />
          <Text style={styles.cancelButtonText}>Cancel Booking</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.updateButton}
          onPress={handleUpdateBooking}
        >
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.updateButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>

      {/* Date/Time Pickers */}
      {showPickupDatePicker && (
        <DateTimePicker
          value={pickupDate}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowPickupDatePicker(Platform.OS === 'ios');
            if (selectedDate) {
              setPickupDate(selectedDate);
              if (selectedDate > returnDate) {
                setReturnDate(new Date(selectedDate.getTime() + 86400000));
              }
            }
          }}
        />
      )}

      {showReturnDatePicker && (
        <DateTimePicker
          value={returnDate}
          mode="date"
          display="default"
          minimumDate={pickupDate}
          onChange={(event, selectedDate) => {
            setShowReturnDatePicker(Platform.OS === 'ios');
            if (selectedDate) setReturnDate(selectedDate);
          }}
        />
      )}

      {showPickupTimePicker && (
        <DateTimePicker
          value={pickupTime}
          mode="time"
          display="default"
          onChange={(event, selectedTime) => {
            setShowPickupTimePicker(Platform.OS === 'ios');
            if (selectedTime) setPickupTime(selectedTime);
          }}
        />
      )}

      {showReturnTimePicker && (
        <DateTimePicker
          value={returnTime}
          mode="time"
          display="default"
          onChange={(event, selectedTime) => {
            setShowReturnTimePicker(Platform.OS === 'ios');
            if (selectedTime) setReturnTime(selectedTime);
          }}
        />
      )}

      {/* Location Modal */}
      <Modal
        visible={showLocationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select {locationSelectionType === 'pickup' ? 'Pickup' : 'Return'} Location
              </Text>
              <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {locations.map((location, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.locationOption}
                  onPress={() => {
                    if (locationSelectionType === 'pickup') {
                      setPickupLocation(location);
                    } else {
                      setReturnLocation(location);
                    }
                    setShowLocationModal(false);
                  }}
                >
                  <Ionicons name="location" size={20} color="#FF6B35" />
                  <Text style={styles.locationOptionText}>{location}</Text>
                  {((locationSelectionType === 'pickup' && pickupLocation === location) ||
                    (locationSelectionType === 'return' && returnLocation === location)) && (
                    <Ionicons name="checkmark" size={20} color="#FF6B35" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carHeader: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  carImage: {
    width: 100,
    height: 70,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  carHeaderContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  carBrand: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 2,
  },
  carModel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00D9FF',
  },
  content: {
    padding: 20,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#00D9FF',
    lineHeight: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  dateTimeItem: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 14,
  },
  dateText: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },
  durationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  durationText: {
    fontSize: 15,
    color: '#333',
  },
  durationDays: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00D9FF',
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  locationText: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    marginBottom: 16,
    color: '#000',
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  priceBreakdown: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  priceLabel: {
    fontSize: 15,
    color: '#666',
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  oldPrice: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  totalRow: {
    borderBottomWidth: 0,
    borderTopWidth: 2,
    borderTopColor: '#e0e0e0',
    paddingTop: 16,
    marginTop: 6,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF6B35',
  },
  bottomBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
    backgroundColor: '#fff',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  updateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FF6B35',
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  locationOptionText: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },
});
