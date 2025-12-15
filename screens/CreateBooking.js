import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Platform, Alert, Modal } from 'react-native';
import { getCar } from '../src/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { saveBooking } from '../services/firestore';

export default function CreateBooking({ route, navigation }) {
  const carId = route?.params?.carId;
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Form fields
  const [pickupDate, setPickupDate] = useState(new Date());
  const [returnDate, setReturnDate] = useState(new Date(Date.now() + 86400000)); // +1 day
  const [pickupTime, setPickupTime] = useState(new Date());
  const [returnTime, setReturnTime] = useState(new Date());
  const [pickupLocation, setPickupLocation] = useState('Main Office - Downtown');
  const [returnLocation, setReturnLocation] = useState('Main Office - Downtown');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [driverEmail, setDriverEmail] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  
  // UI states
  const [showPickupDatePicker, setShowPickupDatePicker] = useState(false);
  const [showReturnDatePicker, setShowReturnDatePicker] = useState(false);
  const [showPickupTimePicker, setShowPickupTimePicker] = useState(false);
  const [showReturnTimePicker, setShowReturnTimePicker] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationSelectionType, setLocationSelectionType] = useState('pickup'); // 'pickup' or 'return'

  const locations = [
    'Main Office - Downtown',
    'Airport Terminal',
    'North Branch',
    'South Branch',
    'Hotel Delivery',
  ];

  useEffect(() => {
    loadCarAndUserData();
  }, [carId]);

  const loadCarAndUserData = async () => {
    const carData = await getCar(carId);
    setCar(carData);
    
    // Load user data
    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setDriverName(`${user.firstName} ${user.lastName}`);
      setDriverEmail(user.email);
      setDriverPhone(user.phone || '');
    }
    
    setLoading(false);
  };

  const calculateDays = () => {
    const diffTime = Math.abs(returnDate - pickupDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };

  const calculateTotal = () => {
    const days = calculateDays();
    const basePrice = car ? car.pricePerDay * days : 0;
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

  const handleCreateBooking = async () => {
    if (!driverName || !driverPhone || !driverEmail) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

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

    // Check car availability for selected dates/times
    const pickupTimeStr = pickupTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const returnTimeStr = returnTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    console.log('Pickup time string:', pickupTimeStr);
    console.log('Return time string:', returnTimeStr);
    console.log('Converted pickup:', convertTo24Hour(pickupTimeStr));
    console.log('Converted return:', convertTo24Hour(returnTimeStr));
    
    const pickupDateStr = pickupDate.toISOString().split('T')[0];
    const returnDateStr = returnDate.toISOString().split('T')[0];
    
    const requestedStart = new Date(`${pickupDateStr}T${convertTo24Hour(pickupTimeStr)}`);
    const requestedEnd = new Date(`${returnDateStr}T${convertTo24Hour(returnTimeStr)}`);
    
    console.log('=== Checking Availability ===');
    console.log('Car ID:', car.id);
    console.log('Requested Start:', requestedStart.toString());
    console.log('Requested End:', requestedEnd.toString());
    
    const userJson = await AsyncStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    if (!user) {
      Alert.alert('Error', 'Please log in to create a booking.');
      return;
    }
    
    const bookingsData = await AsyncStorage.getItem(`bookings_${user.email}`);
    const existingBookings = bookingsData ? JSON.parse(bookingsData) : [];
    
    console.log('Total existing bookings:', existingBookings.length);
    console.log('Bookings for this car:', existingBookings.filter(b => b.carId === car.id && b.status !== 'cancelled').length);
    
    // Check for conflicts
    let hasConflict = false;
    
    for (const booking of existingBookings) {
      if (booking.carId !== car.id || booking.status === 'cancelled') {
        continue;
      }
      
      try {
        console.log('Checking booking:', booking.id);
        console.log('  Pickup time string:', booking.pickupTime);
        console.log('  Return time string:', booking.returnTime);
        console.log('  Pickup date:', booking.pickupDate);
        console.log('  Return date:', booking.returnDate);
        
        const bookingPickupDate = booking.pickupDate.split('T')[0];
        const bookingReturnDate = booking.returnDate.split('T')[0];
        
        const bookingStart = new Date(`${bookingPickupDate}T${convertTo24Hour(booking.pickupTime)}`);
        const bookingEnd = new Date(`${bookingReturnDate}T${convertTo24Hour(booking.returnTime)}`);
        
        console.log('  Converted start:', bookingStart.toString());
        console.log('  Converted end:', bookingEnd.toString());
        
        const overlap = bookingStart < requestedEnd && bookingEnd > requestedStart;
        console.log('  Overlap:', overlap);
        
        if (overlap) {
          hasConflict = true;
          break;
        }
      } catch (error) {
        console.error('Error checking booking:', error);
      }
    }
    
    console.log('Has conflict:', hasConflict);

    if (hasConflict) {
      Alert.alert(
        'Car Not Available',
        'This car is already booked for the selected dates and times. Please choose different dates or select another vehicle.',
        [{ text: 'OK' }]
      );
      return;
    }

    const costs = calculateTotal();
    const booking = {
      carId: car.id,
      carBrand: car.brand,
      carModel: car.model,
      carImage: car.image,
      pickupDate: pickupDate.toISOString(),
      returnDate: returnDate.toISOString(),
      pickupTime: pickupTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      returnTime: returnTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      pickupLocation,
      returnLocation,
      driverName,
      driverPhone,
      driverEmail,
      additionalNotes,
      days: costs.days,
      pricePerDay: car.pricePerDay,
      totalCost: costs.total,
      status: 'upcoming',
    };

    // Save booking to Firestore (real-time listener will update UI)
    const result = await saveBooking(user.id, booking);
    
    if (!result.success) {
      Alert.alert('Error', 'Failed to create booking. Please try again.');
      return;
    }

    // Also save to AsyncStorage for offline access
    existingBookings.unshift({ ...booking, id: result.bookingId });
    await AsyncStorage.setItem(`bookings_${user.email}`, JSON.stringify(existingBookings));

    Alert.alert(
      'Booking Confirmed!',
      `Your booking has been confirmed. Total: $${costs.total.toFixed(2)}`,
      [
        {
          text: 'View Bookings',
          onPress: () => navigation.navigate('MyBookings'),
        },
        {
          text: 'OK',
          onPress: () => navigation.navigate('Home'),
        },
      ]
    );
  };

  if (loading || !car) {
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
          <View style={styles.carHeaderContent}>
            <Text style={styles.carBrand}>{car.brand}</Text>
            <Text style={styles.carModel}>{car.model}</Text>
          </View>
          <View style={styles.carPriceContainer}>
            <Text style={styles.carPriceLabel}>Per day</Text>
            <Text style={styles.carPrice}>${car.pricePerDay}</Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Rental Period */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rental Period</Text>
            
            {/* Pickup Date & Time */}
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

            {/* Return Date & Time */}
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

            {/* Duration Display */}
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

          {/* Driver Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Driver Information</Text>
            
            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={driverName}
              onChangeText={setDriverName}
              placeholder="Enter full name"
            />

            <Text style={styles.inputLabel}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              value={driverPhone}
              onChangeText={setDriverPhone}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />

            <Text style={styles.inputLabel}>Email Address *</Text>
            <TextInput
              style={styles.input}
              value={driverEmail}
              onChangeText={setDriverEmail}
              placeholder="Enter email address"
              keyboardType="email-address"
              autoCapitalize="none"
            />
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

          {/* Price Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price Summary</Text>
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
              <View style={[styles.priceRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>${costs.total.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceSection}>
          <Text style={styles.bottomPriceLabel}>Total</Text>
          <Text style={styles.bottomPrice}>${costs.total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity 
          style={styles.confirmButton}
          onPress={handleCreateBooking}
        >
          <Text style={styles.confirmButtonText}>Confirm Booking</Text>
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
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

      {/* Location Selection Modal */}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  carHeaderContent: {
    flex: 1,
  },
  carBrand: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  carModel: {
    fontSize: 18,
    color: '#666',
  },
  carPriceContainer: {
    alignItems: 'flex-end',
  },
  carPriceLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  carPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF6B35',
  },
  content: {
    padding: 20,
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
    alignItems: 'center',
    justifyContent: 'space-between',
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
  bottomPriceSection: {
    flex: 1,
  },
  bottomPriceLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 2,
  },
  bottomPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF6B35',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  confirmButtonText: {
    fontSize: 17,
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
