import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Image, Platform, Alert, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { listenToBookings, updateBooking, deleteBooking } from '../services/firestore';

export default function MyBookings({ navigation }) {
  const { theme } = useTheme();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming', 'completed', 'cancelled'

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadBookings();
    });
    return unsubscribe;
  }, [navigation]);

  const loadBookings = async () => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : null;
      if (!user) {
        setBookings([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      // Set up real-time listener for bookings
      const unsubscribe = listenToBookings(user.id, (bookingsData) => {
        setBookings(bookingsData);
        // Update AsyncStorage for offline access
        AsyncStorage.setItem(`bookings_${user.email}`, JSON.stringify(bookingsData));
        setLoading(false);
        setRefreshing(false);
      });

      // Cleanup listener
      return () => {
        if (unsubscribe) unsubscribe();
      };
    } catch (error) {
      console.error('Error loading bookings:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const getFilteredBookings = () => {
    const now = new Date();
    return bookings.filter(booking => {
      const returnDate = new Date(booking.returnDate);
      
      if (activeTab === 'upcoming') {
        return booking.status === 'upcoming' && returnDate >= now;
      } else if (activeTab === 'completed') {
        return booking.status === 'completed' || returnDate < now;
      } else if (activeTab === 'cancelled') {
        return booking.status === 'cancelled';
      }
      return false;
    });
  };

  const cancelBooking = (bookingId) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateBooking(bookingId, { status: 'cancelled' });
              Alert.alert('Cancelled', 'Your booking has been cancelled.');
            } catch (error) {
              console.error('Error cancelling booking:', error);
              Alert.alert('Error', 'Failed to cancel booking. Please try again.');
            }
          },
        },
      ]
    );
  };

  const deleteBookingItem = (bookingId) => {
    Alert.alert(
      'Delete Booking',
      'Are you sure you want to permanently delete this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBooking(bookingId);
              Alert.alert('Deleted', 'Booking has been deleted.');
            } catch (error) {
              console.error('Error deleting booking:', error);
              Alert.alert('Error', 'Failed to delete booking. Please try again.');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming':
        return '#FF6B35';
      case 'completed':
        return '#34C759';
      case 'cancelled':
        return '#FF3B30';
      default:
        return '#999';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'upcoming':
        return 'time-outline';
      case 'completed':
        return 'checkmark-circle-outline';
      case 'cancelled':
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const renderBookingCard = ({ item }) => {
    const pickupDate = new Date(item.pickupDate);
    const returnDate = new Date(item.returnDate);
    const isUpcoming = item.status === 'upcoming';
    const isCancelled = item.status === 'cancelled';

    return (
      <TouchableOpacity
        style={[styles.bookingCard, { backgroundColor: theme.cardBackground }]}
        onPress={() => {
          if (isUpcoming && !isCancelled) {
            navigation.navigate('EditBooking', { bookingId: item.id });
          }
        }}
        activeOpacity={isUpcoming && !isCancelled ? 0.7 : 1}
      >
        {/* Car Image & Info */}
        <View style={styles.cardHeader}>
          <Image source={item.carImage} style={styles.carImage} resizeMode="contain" />
          <View style={styles.carInfo}>
            <Text style={[styles.carBrand, { color: theme.text }]}>{item.carBrand}</Text>
            <Text style={[styles.carModel, { color: theme.textSecondary }]}>{item.carModel}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Ionicons name={getStatusIcon(item.status)} size={14} color="#fff" />
              <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Booking Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={18} color="#666" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Pickup</Text>
                <Text style={styles.detailValue}>
                  {pickupDate.toLocaleDateString()} {item.pickupTime}
                </Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={18} color="#666" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Return</Text>
                <Text style={styles.detailValue}>
                  {returnDate.toLocaleDateString()} {item.returnTime}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={18} color="#666" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Pickup Location</Text>
                <Text style={styles.detailValue} numberOfLines={1}>
                  {item.pickupLocation}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="person-outline" size={18} color="#666" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Driver</Text>
                <Text style={styles.detailValue}>{item.driverName}</Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={18} color="#666" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Duration</Text>
                <Text style={styles.detailValue}>{item.days} day{item.days > 1 ? 's' : ''}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Price & Actions */}
        <View style={styles.cardFooter}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Total Amount</Text>
            <Text style={styles.price}>${item.totalCost.toFixed(2)}</Text>
          </View>

          <View style={styles.actionsContainer}>
            {isUpcoming && !isCancelled && (
              <>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('EditBooking', { bookingId: item.id })}
                >
                  <Ionicons name="create-outline" size={20} color="#00D9FF" />
                  <Text style={styles.actionButtonText}>Modify</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => cancelBooking(item.id)}
                >
                  <Ionicons name="close-circle-outline" size={20} color="#FF3B30" />
                  <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
            {(isCancelled || item.status === 'completed') && (
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => deleteBookingItem(item.id)}
              >
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const filteredBookings = getFilteredBookings();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, { color: theme.textSecondary }, activeTab === 'upcoming' && styles.activeTabText]}>
            Upcoming
          </Text>
          {bookings.filter(b => b.status === 'upcoming').length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {bookings.filter(b => b.status === 'upcoming').length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, { color: theme.textSecondary }, activeTab === 'completed' && styles.activeTabText]}>
            Completed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cancelled' && styles.activeTab]}
          onPress={() => setActiveTab('cancelled')}
        >
          <Text style={[styles.tabText, { color: theme.textSecondary }, activeTab === 'cancelled' && styles.activeTabText]}>
            Cancelled
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bookings List */}
      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderBookingCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B35']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name={activeTab === 'upcoming' ? 'calendar-outline' : activeTab === 'completed' ? 'checkmark-circle-outline' : 'close-circle-outline'}
              size={80}
              color={theme.border}
            />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No {activeTab} bookings</Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              {activeTab === 'upcoming'
                ? 'Start exploring cars and make your first booking!'
                : activeTab === 'completed'
                ? 'Your completed bookings will appear here'
                : 'Your cancelled bookings will appear here'}
            </Text>
            {activeTab === 'upcoming' && (
              <TouchableOpacity
                style={styles.browseButton}
                onPress={() => navigation.navigate('Browse')}
              >
                <Text style={styles.browseButtonText}>Browse Cars</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#FF6B35',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#FF6B35',
    fontWeight: '700',
  },
  badge: {
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  carImage: {
    width: 100,
    height: 70,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  carInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  carBrand: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 2,
  },
  carModel: {
    fontSize: 15,
    color: '#666',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  detailsContainer: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#f8f9fa',
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  price: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FF6B35',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00D9FF',
  },
  cancelButton: {
    backgroundColor: '#FFE5E5',
  },
  cancelButtonText: {
    color: '#FF3B30',
  },
  deleteButton: {
    backgroundColor: '#FFE5E5',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  browseButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
