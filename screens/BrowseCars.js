import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet, Image, TextInput, ScrollView, Platform, Modal, TouchableWithoutFeedback } from 'react-native';
import { getCars } from '../src/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../contexts/ThemeContext';
import { addFavorite, removeFavorite, listenToFavorites } from '../services/firestore';

function BrowseCars({ navigation, route }) {
  const { theme } = useTheme();
  const [allCars, setAllCars] = useState([]);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [bookings, setBookings] = useState([]);
  
  // Date range filter states
  const [filterByDate, setFilterByDate] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 86400000)); // +1 day
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(new Date());
  const [tempEndDate, setTempEndDate] = useState(new Date(Date.now() + 86400000));
  const [tempFilterByDate, setTempFilterByDate] = useState(false);
  
  // Temporary filter states (for modal)
  const [tempSelectedType, setTempSelectedType] = useState('All');
  const [tempSelectedTransmission, setTempSelectedTransmission] = useState('All');
  const [tempPriceRange, setTempPriceRange] = useState('All');
  const [tempSortBy, setTempSortBy] = useState('name');
  
  // Applied filter states
  const [selectedType, setSelectedType] = useState('All');
  const [selectedTransmission, setSelectedTransmission] = useState('All');
  const [priceRange, setPriceRange] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const showFavoritesOnly = route?.params?.favorites;

  const carTypes = ['All', 'SUV', 'Sedan', 'Sports', 'Luxury', 'Electric'];
  const transmissions = ['All', 'Automatic', 'Manual'];
  const priceRanges = ['All', 'Under $50', '$50-$100', '$100-$200', 'Over $200'];
  const sortOptions = [
    { label: 'Name (A-Z)', value: 'name' },
    { label: 'Price (Low to High)', value: 'price-asc' },
    { label: 'Price (High to Low)', value: 'price-desc' },
    { label: 'Year (Newest)', value: 'year' }
  ];

  useEffect(() => {
    loadData();
    
    // Set up real-time favorites listener
    let unsubscribe = null;
    const setupFavoritesListener = async () => {
      try {
        const userJson = await AsyncStorage.getItem('user');
        if (userJson) {
          const user = JSON.parse(userJson);
          unsubscribe = listenToFavorites(user.id, (favorites) => {
            setFavorites(favorites);
          });
        }
      } catch (error) {
        console.log('Error setting up favorites listener:', error);
      }
    };
    
    setupFavoritesListener();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedType, selectedTransmission, priceRange, sortBy, allCars, favorites, showFavoritesOnly, filterByDate, startDate, endDate, bookings]);

  const loadData = async () => {
    const data = await getCars();
    
    const userJson = await AsyncStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    
    if (user) {
      const favs = await AsyncStorage.getItem(`favorites_${user.email}`);
      const favoriteIds = favs ? JSON.parse(favs) : [];
      setFavorites(favoriteIds);
      
      const bookingsData = await AsyncStorage.getItem(`bookings_${user.email}`);
      const allBookings = bookingsData ? JSON.parse(bookingsData) : [];
      setBookings(allBookings);
    }
    
    setAllCars(data);
    setLoading(false);
  };

  // Check if a car is available for the given date range
  const isCarAvailable = (carId, requestedStart, requestedEnd) => {
    const carBookings = bookings.filter(b => b.carId === carId && b.status !== 'cancelled');
    
    for (let booking of carBookings) {
      // Extract date parts from ISO string
      const pickupDateStr = booking.pickupDate.split('T')[0];
      const returnDateStr = booking.returnDate.split('T')[0];
      
      // Convert 12-hour time to 24-hour format for proper parsing
      const bookingStart = new Date(`${pickupDateStr}T${convertTo24Hour(booking.pickupTime)}`);
      const bookingEnd = new Date(`${returnDateStr}T${convertTo24Hour(booking.returnTime)}`);
      
      // Check for overlap: booking overlaps if it starts before requestedEnd and ends after requestedStart
      if (bookingStart < requestedEnd && bookingEnd > requestedStart) {
        return false; // Overlap found, car not available
      }
    }
    
    return true; // No overlap, car is available
  };

  // Convert 12-hour time format to 24-hour format
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

  const applyFilters = () => {
    let filtered = [...allCars];

    // Filter by favorites
    if (showFavoritesOnly) {
      filtered = filtered.filter(car => favorites.includes(car.id));
    }

    // Date range availability filter
    if (filterByDate) {
      // Set time to start of day (00:00:00) for start date
      const requestedStart = new Date(startDate);
      requestedStart.setHours(0, 0, 0, 0);
      
      // Set time to end of day (23:59:59) for end date
      const requestedEnd = new Date(endDate);
      requestedEnd.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter(car => isCarAvailable(car.id, requestedStart, requestedEnd));
    }

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(car =>
        car.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        car.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        car.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (selectedType !== 'All') {
      filtered = filtered.filter(car => car.type === selectedType);
    }

    // Transmission filter
    if (selectedTransmission !== 'All') {
      filtered = filtered.filter(car => car.transmission === selectedTransmission);
    }

    // Price range filter
    if (priceRange !== 'All') {
      filtered = filtered.filter(car => {
        const price = car.pricePerDay;
        if (priceRange === 'Under $50') return price < 50;
        if (priceRange === '$50-$100') return price >= 50 && price <= 100;
        if (priceRange === '$100-$200') return price > 100 && price <= 200;
        if (priceRange === 'Over $200') return price > 200;
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'name') return a.brand.localeCompare(b.brand);
      if (sortBy === 'price-asc') return a.pricePerDay - b.pricePerDay;
      if (sortBy === 'price-desc') return b.pricePerDay - a.pricePerDay;
      if (sortBy === 'year') return b.year - a.year;
      return 0;
    });

    setCars(filtered);
  };

  const toggleFavorite = async (carId) => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      if (!userJson) return;
      
      const user = JSON.parse(userJson);
      const isFavorite = favorites.includes(carId);
      
      if (isFavorite) {
        await removeFavorite(user.id, carId);
      } else {
        await addFavorite(user.id, carId);
      }
    } catch (error) {
      console.log('Error toggling favorite:', error);
    }
  };

  const openFilterModal = () => {
    // Set temp values to current applied filters
    setTempSelectedType(selectedType);
    setTempSelectedTransmission(selectedTransmission);
    setTempPriceRange(priceRange);
    setTempSortBy(sortBy);
    setTempFilterByDate(filterByDate);
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setShowFilterModal(true);
  };

  const applyFiltersFromModal = () => {
    // Apply temp filters to actual filters
    setSelectedType(tempSelectedType);
    setSelectedTransmission(tempSelectedTransmission);
    setPriceRange(tempPriceRange);
    setSortBy(tempSortBy);
    setFilterByDate(tempFilterByDate);
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    setShowFilterModal(false);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedType('All');
    setSelectedTransmission('All');
    setPriceRange('All');
    setSortBy('name');
    setFilterByDate(false);
    setStartDate(new Date());
    setEndDate(new Date(Date.now() + 86400000));
    setTempSelectedType('All');
    setTempSelectedTransmission('All');
    setTempPriceRange('All');
    setTempSortBy('name');
    setTempFilterByDate(false);
    setTempStartDate(new Date());
    setTempEndDate(new Date(Date.now() + 86400000));
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#FF6B35" /></View>;

  if (showFavoritesOnly && cars.length === 0 && !searchQuery && selectedType === 'All') {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="heart-outline" size={80} color="#ccc" />
        <Text style={styles.emptyTitle}>No Favorites Yet</Text>
        <Text style={styles.emptyText}>Start adding cars to your favorites!</Text>
        <TouchableOpacity 
          style={styles.browseButton}
          onPress={() => navigation.replace('Browse')}
        >
          <Text style={styles.browseButtonText}>Browse Cars</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: theme.cardBackground }]}>
          <Ionicons name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search brand, model, or type..."
            placeholderTextColor={theme.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Button and Active Filters */}
      <View style={styles.filterHeaderContainer}>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={openFilterModal}
        >
          <Ionicons name="options-outline" size={20} color="#FF6B35" />
          <Text style={styles.filterButtonText}>Filters</Text>
          {(selectedType !== 'All' || selectedTransmission !== 'All' || priceRange !== 'All' || sortBy !== 'name' || filterByDate) && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>•</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={[styles.resultsCount, { color: theme.textSecondary }]}>
          {cars.length} vehicle{cars.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Active Filters Bar */}
      {(selectedType !== 'All' || selectedTransmission !== 'All' || priceRange !== 'All' || sortBy !== 'name' || filterByDate) && (
        <View style={styles.activeFiltersBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activeFiltersScroll}>
            {filterByDate && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>
                  {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
                <TouchableOpacity onPress={() => setFilterByDate(false)}>
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
            {selectedType !== 'All' && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>{selectedType}</Text>
                <TouchableOpacity onPress={() => setSelectedType('All')}>
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
            {selectedTransmission !== 'All' && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>{selectedTransmission}</Text>
                <TouchableOpacity onPress={() => setSelectedTransmission('All')}>
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
            {priceRange !== 'All' && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>{priceRange}</Text>
                <TouchableOpacity onPress={() => setPriceRange('All')}>
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
            {sortBy !== 'name' && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>
                  {sortOptions.find(opt => opt.value === sortBy)?.label}
                </Text>
                <TouchableOpacity onPress={() => setSortBy('name')}>
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
          <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
            <Text style={styles.clearFiltersText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Car List */}
      {cars.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="car-outline" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>No Vehicles Found</Text>
          <Text style={styles.emptyText}>Try adjusting your filters</Text>
          <TouchableOpacity style={styles.browseButton} onPress={clearFilters}>
            <Text style={styles.browseButtonText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={cars}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.item} 
              onPress={() => navigation.navigate('CarDetails', { carId: item.id })}
            >
              <Image 
                source={item.image} 
                style={styles.carImage}
                resizeMode="contain"
              />
              <View style={styles.carInfo}>
                <View style={styles.carHeader}>
                  <View style={styles.carTitleContainer}>
                    <Text style={styles.carBrand}>{item.brand}</Text>
                    <Text style={styles.carModel}>{item.model}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleFavorite(item.id);
                    }}
                  >
                    <Ionicons
                      name={favorites.includes(item.id) ? "heart" : "heart-outline"}
                      size={24}
                      color={favorites.includes(item.id) ? "#FF3B30" : "#666"}
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.carDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="car-sport-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>{item.type}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="settings-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>{item.transmission}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="people-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>{item.seats} seats</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="speedometer-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>{item.fuelType}</Text>
                  </View>
                </View>
                <View style={styles.carFooter}>
                  <View>
                    <Text style={styles.priceLabel}>Price per day</Text>
                    <Text style={styles.price}>${item.pricePerDay}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.bookButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      navigation.navigate('CreateBooking', { carId: item.id });
                    }}
                  >
                    <Text style={styles.bookButtonText}>Book Now</Text>
                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowFilterModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalContent}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Filters & Sorting</Text>
                  <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  {/* Sort By */}
                  <View style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>Sort By</Text>
                    {sortOptions.map(option => (
                      <TouchableOpacity
                        key={option.value}
                        style={styles.filterOption}
                        onPress={() => setTempSortBy(option.value)}
                      >
                        <Text style={[styles.filterOptionText, tempSortBy === option.value && styles.filterOptionTextActive]}>
                          {option.label}
                        </Text>
                        {tempSortBy === option.value && (
                          <Ionicons name="checkmark" size={20} color="#34D399" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Type */}
                  <View style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>Car Type</Text>
                    {carTypes.map(type => (
                      <TouchableOpacity
                        key={type}
                        style={styles.filterOption}
                        onPress={() => setTempSelectedType(type)}
                      >
                        <Text style={[styles.filterOptionText, tempSelectedType === type && styles.filterOptionTextActive]}>
                          {type}
                        </Text>
                        {tempSelectedType === type && (
                          <Ionicons name="checkmark" size={20} color="#34D399" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Transmission */}
                  <View style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>Transmission</Text>
                    {transmissions.map(trans => (
                      <TouchableOpacity
                        key={trans}
                        style={styles.filterOption}
                        onPress={() => setTempSelectedTransmission(trans)}
                      >
                        <Text style={[styles.filterOptionText, tempSelectedTransmission === trans && styles.filterOptionTextActive]}>
                          {trans}
                        </Text>
                        {tempSelectedTransmission === trans && (
                          <Ionicons name="checkmark" size={20} color="#34D399" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Price Range */}
                  <View style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>Price Range (per day)</Text>
                    {priceRanges.map(range => (
                      <TouchableOpacity
                        key={range}
                        style={styles.filterOption}
                        onPress={() => setTempPriceRange(range)}
                      >
                        <Text style={[styles.filterOptionText, tempPriceRange === range && styles.filterOptionTextActive]}>
                          {range}
                        </Text>
                        {tempPriceRange === range && (
                          <Ionicons name="checkmark" size={20} color="#34D399" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Date Range Filter */}
                  <View style={styles.filterSection}>
                    <View style={styles.dateFilterHeader}>
                      <Text style={styles.filterSectionTitle}>Filter by Availability</Text>
                      <TouchableOpacity
                        style={[styles.toggleSwitch, tempFilterByDate && styles.toggleSwitchActive]}
                        onPress={() => setTempFilterByDate(!tempFilterByDate)}
                      >
                        <View style={[styles.toggleCircle, tempFilterByDate && styles.toggleCircleActive]} />
                      </TouchableOpacity>
                    </View>
                    
                    {tempFilterByDate && (
                      <View style={styles.dateRangeContainer}>
                        <Text style={styles.dateRangeLabel}>Show only available cars for:</Text>
                        
                        <TouchableOpacity
                          style={styles.datePickerButton}
                          onPress={() => setShowStartDatePicker(true)}
                        >
                          <Ionicons name="calendar-outline" size={20} color="#FF6B35" />
                          <View style={styles.datePickerTextContainer}>
                            <Text style={styles.datePickerLabel}>From</Text>
                            <Text style={styles.datePickerValue}>
                              {tempStartDate.toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </Text>
                          </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.datePickerButton}
                          onPress={() => setShowEndDatePicker(true)}
                        >
                          <Ionicons name="calendar-outline" size={20} color="#FF6B35" />
                          <View style={styles.datePickerTextContainer}>
                            <Text style={styles.datePickerLabel}>To</Text>
                            <Text style={styles.datePickerValue}>
                              {tempEndDate.toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </Text>
                          </View>
                        </TouchableOpacity>

                        <View style={styles.dateInfoBox}>
                          <Ionicons name="information-circle" size={16} color="#666" />
                          <Text style={styles.dateInfoText}>
                            Only shows cars available for the entire selected period
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </ScrollView>

                {/* Modal Footer */}
                <View style={styles.modalFooter}>
                  <TouchableOpacity 
                    style={styles.clearButton}
                    onPress={() => {
                      setTempSelectedType('All');
                      setTempSelectedTransmission('All');
                      setTempPriceRange('All');
                      setTempSortBy('name');
                      setTempFilterByDate(false);
                      setTempStartDate(new Date());
                      setTempEndDate(new Date(Date.now() + 86400000));
                    }}
                  >
                    <Text style={styles.clearButtonText}>Reset</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.applyButton}
                    onPress={applyFiltersFromModal}
                  >
                    <Text style={styles.applyButtonText}>Apply Filters</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={tempStartDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(Platform.OS === 'ios');
            if (selectedDate) {
              setTempStartDate(selectedDate);
              if (selectedDate >= tempEndDate) {
                setTempEndDate(new Date(selectedDate.getTime() + 86400000));
              }
            }
          }}
          minimumDate={new Date()}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={tempEndDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(Platform.OS === 'ios');
            if (selectedDate && selectedDate > tempStartDate) {
              setTempEndDate(selectedDate);
            }
          }}
          minimumDate={new Date(tempStartDate.getTime() + 86400000)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },
  filterHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  filterButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF6B35',
  },
  filterBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    marginLeft: 4,
  },
  filterBadgeText: {
    fontSize: 8,
    color: '#FF3B30',
  },
  resultsCount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  activeFiltersBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  activeFiltersScroll: {
    flex: 1,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    marginRight: 8,
  },
  activeFilterText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '500',
  },
  clearFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearFiltersText: {
    fontSize: 13,
    color: '#FF3B30',
    fontWeight: '600',
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
    maxHeight: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
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
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  filterOptionText: {
    fontSize: 15,
    color: '#666',
  },
  filterOptionTextActive: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6B35',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  item: {
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
  carImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f5f5f5',
  },
  carInfo: {
    padding: 16,
  },
  carHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  carTitleContainer: {
    flex: 1,
  },
  carBrand: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 2,
  },
  carModel: {
    fontSize: 16,
    fontWeight: '400',
    color: '#666',
  },
  favoriteButton: {
    padding: 4,
  },
  carDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
  },
  carFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  priceLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF6B35',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
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
  dateFilterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e0e0e0',
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: '#FF6B35',
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  toggleCircleActive: {
    alignSelf: 'flex-end',
  },
  dateRangeContainer: {
    gap: 12,
  },
  dateRangeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  datePickerTextContainer: {
    flex: 1,
  },
  datePickerLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  datePickerValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  dateInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 4,
  },
  dateInfoText: {
    flex: 1,
    fontSize: 12,
    color: '#856404',
    lineHeight: 16,
  },
});

export default BrowseCars;