import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Dimensions, Image, Modal, TextInput, Alert } from 'react-native';
import { getCars } from '../src/api';
import { Ionicons } from '@expo/vector-icons';
import SafeContainer from '../components/SafeContainer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { addFavorite, removeFavorite, listenToFavorites, listenToUserProfile } from '../services/firestore';
import { Accelerometer } from 'expo-sensors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;

export default function HomeScreen({ navigation }) {
  const { theme } = useTheme();
  const [cars, setCars] = useState([]);
  const [allCars, setAllCars] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userName, setUserName] = useState('Guest');
  const [userInitials, setUserInitials] = useState('G');
  const [showMenu, setShowMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [favorites, setFavorites] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const scrollViewRef = useRef(null);
  const [shakeDetected, setShakeDetected] = useState(false);

  const categories = ['All', 'SUV', 'Sedan', 'Sports', 'Luxury', 'Electric'];

  useEffect(() => {
    loadData();
    
    // Set up real-time listeners
    let favoritesUnsubscribe = null;
    let profileUnsubscribe = null;
    
    const setupListeners = async () => {
      try {
        const userJson = await AsyncStorage.getItem('user');
        if (userJson) {
          const user = JSON.parse(userJson);
          
          // Listen to favorites changes in real-time
          favoritesUnsubscribe = listenToFavorites(user.id, (favorites) => {
            setFavorites(favorites);
          });
          
          // Listen to profile changes in real-time
          profileUnsubscribe = listenToUserProfile(user.id, (profileData) => {
            if (profileData) {
              const updatedUser = { ...user, ...profileData };
              setUserName(updatedUser.firstName || updatedUser.name || 'Guest');
              const initials = updatedUser.firstName && updatedUser.lastName 
                ? `${updatedUser.firstName[0]}${updatedUser.lastName[0]}` 
                : (updatedUser.name ? updatedUser.name[0] : 'G');
              setUserInitials(initials);
              // Update AsyncStorage
              AsyncStorage.setItem('user', JSON.stringify(updatedUser));
            }
          });
        }
      } catch (error) {
        console.log('Error setting up listeners:', error);
      }
    };
    
    setupListeners();
    
    // Setup shake detection
    let accelerometerSubscription = null;
    let lastShakeTime = 0;
    const SHAKE_THRESHOLD = 2.5; // Sensitivity threshold
    const SHAKE_COOLDOWN = 1000; // 1 second cooldown between shakes
    
    Accelerometer.setUpdateInterval(100);
    accelerometerSubscription = Accelerometer.addListener(({ x, y, z }) => {
      const acceleration = Math.sqrt(x * x + y * y + z * z);
      const currentTime = Date.now();
      
      if (acceleration > SHAKE_THRESHOLD && (currentTime - lastShakeTime) > SHAKE_COOLDOWN) {
        lastShakeTime = currentTime;
        // Navigate to favorites on shake
        navigation.navigate('Browse', { favorites: true });
      }
    });
    
    // Cleanup listeners on unmount
    return () => {
      if (favoritesUnsubscribe) {
        favoritesUnsubscribe();
      }
      if (profileUnsubscribe) {
        profileUnsubscribe();
      }
      if (accelerometerSubscription) {
        accelerometerSubscription.remove();
      }
      Accelerometer.removeAllListeners();
    };
  }, []);

  const loadData = async () => {
    const carsData = await getCars();
    setAllCars(carsData);
    setCars(carsData);
    await loadUserData();
    await loadFavorites();
    await loadRecentBookings();
  };

  const loadUserData = async () => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        const user = JSON.parse(userJson);
        setUserName(user.firstName || user.name || 'Guest');
        const initials = user.firstName && user.lastName 
          ? `${user.firstName[0]}${user.lastName[0]}` 
          : (user.name ? user.name[0] : 'G');
        setUserInitials(initials);
      }
    } catch (error) {
      console.log('Error loading user data:', error);
    }
  };

  const loadFavorites = async () => {
    // This function is now handled by the real-time listener in useEffect
    // Keeping it for initial load compatibility
    try {
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        const user = JSON.parse(userJson);
        // Initial favorites will be loaded by the listener
      }
    } catch (error) {
      console.log('Error loading favorites:', error);
    }
  };

  const loadRecentBookings = async () => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        const user = JSON.parse(userJson);
        const bookings = await AsyncStorage.getItem(`bookings_${user.email}`);
        if (bookings) {
          const allBookings = JSON.parse(bookings);
          setRecentBookings(allBookings.slice(0, 3));
        }
      }
    } catch (error) {
      console.log('Error loading bookings:', error);
    }
  };

  const toggleFavorite = async (carId) => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      if (!userJson) return;
      
      const user = JSON.parse(userJson);
      const isFavorite = favorites.includes(carId);
      
      // Update Firestore
      if (isFavorite) {
        await removeFavorite(user.id, carId);
        setFavorites(favorites.filter(id => id !== carId));
      } else {
        await addFavorite(user.id, carId);
        setFavorites([...favorites, carId]);
      }
    } catch (error) {
      console.log('Error saving favorite:', error);
      Alert.alert('Error', 'Failed to update favorite. Please try again.');
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setCars(filterByCategory(allCars, selectedCategory));
      return;
    }
    const filtered = allCars.filter(car => 
      car.brand.toLowerCase().includes(text.toLowerCase()) ||
      car.model.toLowerCase().includes(text.toLowerCase()) ||
      car.type.toLowerCase().includes(text.toLowerCase())
    );
    setCars(filterByCategory(filtered, selectedCategory));
  };

  const filterByCategory = (carsList, category) => {
    if (category === 'All') return carsList;
    return carsList.filter(car => car.type === category);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    const filtered = filterByCategory(allCars, category);
    setCars(searchQuery ? filtered.filter(car => 
      car.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      car.model.toLowerCase().includes(searchQuery.toLowerCase())
    ) : filtered);
  };

  // Auto-scroll carousel every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (cars.length > 0) {
        const nextIndex = (currentIndex + 1) % Math.min(6, cars.length);
        setCurrentIndex(nextIndex);
        scrollViewRef.current?.scrollTo({
          x: nextIndex * (CARD_WIDTH + 20),
          animated: true
        });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [currentIndex, cars.length]);

  const topTrends = cars.slice(0, 6);
  const popularVehicles = cars.slice(6, 12);

  return (
    <SafeContainer style={{ backgroundColor: theme.background }}>
      {/* Top Header Bar */}
      <View style={[styles.header, { 
        backgroundColor: theme.surface, 
        shadowColor: theme.shadowColor,
        borderBottomColor: theme.border,
      }]}>
        <TouchableOpacity style={styles.menuButton} onPress={() => setShowMenu(true)}>
          <Ionicons name="menu" size={24} color={theme.iconDefault} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Rent Cars</Text>
        <View style={styles.headerRightSection}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <View style={[styles.headerAvatar, { 
              backgroundColor: theme.primary,
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }]}>
              <Text style={[styles.headerAvatarText, { color: theme.primaryForeground }]}>{userInitials}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={[styles.scrollContent, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
        {/* Greeting Section */}
        <View style={styles.greetingSection}>
          <Text style={[styles.greeting, { color: theme.textPrimary }]}>Hello, {userName} 👋</Text>
          <Text style={[styles.destination, { color: theme.textSecondary }]}>What's your next destination?</Text>
        </View>

        {/* Demo Notice */}
        <View style={styles.demoNotice}>
          <Ionicons name="flask" size={16} color="#856404" />
          <Text style={styles.demoNoticeText}>
            Beta Version - This app is under active development. Some features may be experimental or incomplete.
          </Text>
        </View>

        {/* Search Bar with Glass Morphism */}
        <View style={styles.searchContainer}>
          <TouchableOpacity style={[styles.searchBar, { 
            backgroundColor: theme.searchBackground,
            borderColor: theme.searchBorder,
            borderWidth: 1,
            shadowColor: theme.shadowColor,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 3,
          }]} onPress={() => navigation.navigate('Browse')}>
            <Ionicons name="search" size={20} color={theme.searchIcon} style={{ marginRight: 12 }} />
            <View style={styles.searchTextContainer}>
              <Text style={[styles.searchText, { color: theme.textPrimary }]}>Search for vehicles</Text>
              <Text style={[styles.searchSubtext, { color: theme.searchPlaceholder }]}>Anywhere • Anytime</Text>
            </View>
            <View style={[styles.filterButton, { 
              backgroundColor: theme.primary,
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
            }]}>
              <Ionicons name="options" size={20} color={theme.primaryForeground} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip, 
                { 
                  backgroundColor: theme.categoryBackground,
                  borderWidth: 1,
                  borderColor: theme.border,
                },
                selectedCategory === category && { 
                  backgroundColor: theme.categoryActiveBackground,
                  borderColor: theme.categoryActiveBackground,
                  shadowColor: theme.primary,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                  elevation: 4,
                }
              ]}
              onPress={() => handleCategorySelect(category)}
            >
              <Text style={[
                styles.categoryText, 
                { color: theme.categoryText },
                selectedCategory === category && { color: theme.categoryActiveText, fontWeight: '700' }
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Special Offers with Premium Gradient */}
        <View style={styles.offersSection}>
          <View style={[styles.offerCard, {
            backgroundColor: theme.secondary,
            shadowColor: theme.secondary,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 8,
          }]}>
            <View style={styles.offerContent}>
              <Text style={[styles.offerBadge, { color: theme.secondaryForeground }]}>🎉 SPECIAL OFFER</Text>
              <Text style={[styles.offerTitle, { color: theme.secondaryForeground }]}>Get 25% OFF</Text>
              <Text style={[styles.offerSubtitle, { color: theme.secondaryForeground, opacity: 0.9 }]}>On your first booking</Text>
              <TouchableOpacity style={[styles.offerButton, { 
                backgroundColor: theme.secondaryForeground,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
              }]}>
                <Text style={[styles.offerButtonText, { color: theme.secondary, fontWeight: '700' }]}>Book Now</Text>
              </TouchableOpacity>
            </View>
            <Ionicons name="car-sport" size={80} color="rgba(255,255,255,0.2)" style={styles.offerIcon} />
          </View>
        </View>

        {/* Recent Bookings */}
        {recentBookings.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Recent Bookings</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MyBookings')}>
                <Text style={[styles.seeAllText, { color: theme.primary, fontWeight: '600' }]}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
              {recentBookings.map((booking, index) => {
                const car = allCars.find(c => c.id === booking.carId);
                if (!car) return null;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.recentCard, { 
                      backgroundColor: theme.cardBackground,
                      borderWidth: 1,
                      borderColor: theme.border,
                      shadowColor: theme.shadowColor,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.08,
                      shadowRadius: 8,
                      elevation: 3,
                    }]}
                    onPress={() => navigation.navigate('CarDetails', { carId: car.id })}
                  >
                    <Image source={car.image} style={[styles.recentImage, { backgroundColor: theme.surfaceElevated }]} resizeMode="contain" />
                    <Text style={[styles.recentBrand, { color: theme.textPrimary, fontWeight: '700' }]}>{car.brand}</Text>
                    <Text style={[styles.recentModel, { color: theme.textSecondary }]}>{car.model}</Text>
                    <Text style={[styles.recentDate, { color: theme.textTertiary, fontSize: 12 }]}>{new Date(booking.startDate).toLocaleDateString()}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Top Trends Carousel */}
        <View style={styles.trendsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Top Trends</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Browse')}>
              <Text style={[styles.seeAllText, { color: theme.primary, fontWeight: '600' }]}>See all</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + 20}
            decelerationRate="fast"
            contentContainerStyle={styles.carouselContent}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / (CARD_WIDTH + 20));
              setCurrentIndex(index);
            }}
          >
            {topTrends.map((car) => (
              <TouchableOpacity
                key={car.id}
                style={[styles.trendCard, { 
                  backgroundColor: theme.cardBackground,
                  borderWidth: 1,
                  borderColor: theme.border,
                  shadowColor: theme.shadowColor,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.12,
                  shadowRadius: 16,
                  elevation: 6,
                }]}
                onPress={() => navigation.navigate('CarDetails', { carId: car.id })}
              >
                <TouchableOpacity 
                  style={[styles.favoriteButton, {
                    backgroundColor: favorites.includes(car.id) 
                      ? 'rgba(255, 255, 255, 0.95)'
                      : 'rgba(255, 255, 255, 0.9)',
                  }]}
                  onPress={(e) => {
                    e.stopPropagation();
                    toggleFavorite(car.id);
                  }}
                >
                  <Ionicons 
                    name={favorites.includes(car.id) ? "heart" : "heart-outline"} 
                    size={24} 
                    color={favorites.includes(car.id) ? theme.favoriteActive : theme.favoriteInactive} 
                  />
                </TouchableOpacity>
                <Image 
                  source={car.image} 
                  style={styles.cardImage}
                  resizeMode="contain"
                />
                <View style={styles.cardContent}>
                  <Text style={[styles.cardBrand, { color: theme.textPrimary, fontWeight: '700' }]}>{car.brand}</Text>
                  <Text style={[styles.cardModel, { color: theme.textSecondary }]}>{car.model}</Text>
                  <View style={styles.cardDetails}>
                    <View style={[styles.typeChip, { 
                      backgroundColor: theme.chipBackground,
                      borderWidth: 1,
                      borderColor: theme.chipBorder,
                    }]}>
                      <Text style={[styles.cardType, { color: theme.chipText, fontSize: 12, fontWeight: '600' }]}>{car.type}</Text>
                    </View>
                    <Text style={[styles.cardPrice, { 
                      color: theme.primary,
                      fontWeight: '700',
                      fontSize: 16,
                    }]}>${car.pricePerDay}/day</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.carouselDots}>
            {topTrends.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot, 
                  { backgroundColor: theme.border }, 
                  currentIndex === index && { 
                    backgroundColor: theme.primary,
                    width: 24,
                    shadowColor: theme.primary,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.5,
                    shadowRadius: 4,
                  }
                ]}
              />
            ))}
          </View>
        </View>

        {/* Popular Vehicles Section */}
        <View style={styles.popularSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Popular Vehicles</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Browse')}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.popularGrid}>
            {popularVehicles.map((car) => (
              <TouchableOpacity
                key={car.id}
                style={[styles.popularCard, { backgroundColor: theme.cardBackground, shadowColor: theme.shadowColor }]}
                onPress={() => navigation.navigate('CarDetails', { carId: car.id })}
              >
                <TouchableOpacity 
                  style={styles.popularFavoriteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    toggleFavorite(car.id);
                  }}
                >
                  <Ionicons 
                    name={favorites.includes(car.id) ? "heart" : "heart-outline"} 
                    size={20} 
                    color={favorites.includes(car.id) ? "#FF3B30" : theme.favoriteInactive} 
                  />
                </TouchableOpacity>
                <Image 
                  source={car.image} 
                  style={styles.popularImage}
                  resizeMode="contain"
                />
                <Text style={[styles.popularBrand, { color: theme.text }]}>{car.brand}</Text>
                <Text style={[styles.popularModel, { color: theme.textSecondary }]}>{car.model}</Text>
                <Text style={styles.popularPrice}>${car.pricePerDay}/day</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Bottom Menu Bar */}
      <View style={[styles.bottomMenu, { 
        backgroundColor: theme.navBackground,
        borderTopWidth: 1,
        borderTopColor: theme.navBorder,
        shadowColor: theme.shadowColor,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 8,
      }]}>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Browse')}>
          <Ionicons name="search-outline" size={24} color={theme.navInactive} />
          <Text style={[styles.menuItemText, { color: theme.navInactive }]}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('MyBookings')}>
          <Ionicons name="calendar-outline" size={24} color={theme.navInactive} />
          <Text style={[styles.menuItemText, { color: theme.navInactive }]}>Booking</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => {
            const favCars = allCars.filter(car => favorites.includes(car.id));
            if (favCars.length === 0) {
              Alert.alert('No Favorites', 'You haven\'t added any favorites yet.');
            } else {
              navigation.navigate('Browse', { favorites: true });
            }
          }}
        >
          <Ionicons name="heart-outline" size={24} color={theme.navInactive} />
          <Text style={[styles.menuItemText, { color: theme.navInactive }]}>Favorites</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="person-outline" size={24} color={theme.navInactive} />
          <Text style={[styles.menuItemText, { color: theme.navInactive }]}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Side Menu Modal */}
      <Modal
        visible={showMenu}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity 
          style={[styles.menuOverlay, { backgroundColor: theme.modalOverlay }]} 
          activeOpacity={1} 
          onPress={() => setShowMenu(false)}
        >
          <View style={[styles.menuPanel, { backgroundColor: theme.menuBackground }]}>
            <View style={styles.menuHeader}>
              <View style={styles.menuAvatar}>
                <Text style={styles.menuAvatarText}>{userInitials}</Text>
              </View>
              <Text style={[styles.menuUserName, { color: theme.text }]}>{userName}</Text>
              <TouchableOpacity 
                style={styles.menuCloseButton}
                onPress={() => setShowMenu(false)}
              >
                <Ionicons name="close" size={28} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.menuContent}>
              <TouchableOpacity 
                style={styles.menuListItem}
                onPress={() => {
                  setShowMenu(false);
                  navigation.navigate('Profile');
                }}
              >
                <Ionicons name="person-outline" size={24} color={theme.text} />
                <Text style={[styles.menuListText, { color: theme.text }]}>My Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuListItem}
                onPress={() => {
                  setShowMenu(false);
                  navigation.navigate('MyBookings');
                }}
              >
                <Ionicons name="calendar-outline" size={24} color={theme.text} />
                <Text style={[styles.menuListText, { color: theme.text }]}>My Bookings</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuListItem}
                onPress={() => {
                  setShowMenu(false);
                  const favCars = allCars.filter(car => favorites.includes(car.id));
                  if (favCars.length === 0) {
                    Alert.alert('No Favorites', 'You haven\'t added any favorites yet.');
                  } else {
                    navigation.navigate('Browse', { favorites: true });
                  }
                }}
              >
                <Ionicons name="heart-outline" size={24} color={theme.text} />
                <Text style={[styles.menuListText, { color: theme.text }]}>Favorites</Text>
                {favorites.length > 0 && (
                  <View style={styles.menuBadge}>
                    <Text style={styles.menuBadgeText}>{favorites.length}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuListItem}
                onPress={() => {
                  setShowMenu(false);
                  navigation.navigate('ContactSupport');
                }}
              >
                <Ionicons name="chatbubble-outline" size={24} color={theme.text} />
                <Text style={[styles.menuListText, { color: theme.text }]}>Contact Support</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuListItem}
                onPress={() => {
                  setShowMenu(false);
                  navigation.navigate('FAQ');
                }}
              >
                <Ionicons name="help-circle-outline" size={24} color={theme.text} />
                <Text style={[styles.menuListText, { color: theme.text }]}>FAQ</Text>
              </TouchableOpacity>

              <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

              <TouchableOpacity 
                style={styles.menuListItem}
                onPress={() => {
                  setShowMenu(false);
                  Alert.alert('Notifications', 'No new notifications');
                }}
              >
                <Ionicons name="notifications-outline" size={24} color={theme.text} />
                <Text style={[styles.menuListText, { color: theme.text }]}>Notifications</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuListItem}
                onPress={() => {
                  setShowMenu(false);
                  Alert.alert('Settings', 'Settings screen');
                }}
              >
                <Ionicons name="settings-outline" size={24} color={theme.text} />
                <Text style={[styles.menuListText, { color: theme.text }]}>Settings</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Search Modal */}
      <Modal
        visible={showSearch}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowSearch(false)}
      >
        <SafeContainer style={{ backgroundColor: theme.background }}>
          <View style={[styles.searchModal, { backgroundColor: theme.background }]}>
            <View style={styles.searchModalHeader}>
              <TouchableOpacity onPress={() => setShowSearch(false)}>
                <Ionicons name="arrow-back" size={24} color={theme.text} />
              </TouchableOpacity>
              <Text style={[styles.searchModalTitle, { color: theme.text }]}>Search Vehicles</Text>
              <View style={{ width: 24 }} />
            </View>

            <View style={[styles.searchInputContainer, { backgroundColor: theme.searchBackground }]}>
              <Ionicons name="search" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search by brand, model, or type..."
                placeholderTextColor={theme.textTertiary}
                value={searchQuery}
                onChangeText={handleSearch}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => handleSearch('')}>
                  <Ionicons name="close-circle" size={20} color={theme.textTertiary} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={styles.searchResults}>
              {cars.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="car-outline" size={60} color={theme.border} />
                  <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>No vehicles found</Text>
                </View>
              ) : (
                cars.map((car) => (
                  <TouchableOpacity
                    key={car.id}
                    style={[styles.searchResultItem, { backgroundColor: theme.cardBackground }]}
                    onPress={() => {
                      setShowSearch(false);
                      navigation.navigate('CarDetails', { carId: car.id });
                    }}
                  >
                    <Image source={car.image} style={styles.searchResultImage} resizeMode="contain" />
                    <View style={styles.searchResultInfo}>
                      <Text style={[styles.searchResultBrand, { color: theme.text }]}>{car.brand}</Text>
                      <Text style={[styles.searchResultModel, { color: theme.textSecondary }]}>{car.model}</Text>
                      <Text style={[styles.searchResultType, { color: theme.textTertiary }]}>{car.type}</Text>
                    </View>
                    <Text style={styles.searchResultPrice}>${car.pricePerDay}/day</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </SafeContainer>
      </Modal>
    </SafeContainer>
  );
}
const styles = StyleSheet.create({
  // Header
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 15,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  menuButton: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#000', flex: 1 },
  headerRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerAvatarText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },

  scrollContent: { flex: 1 },

  // Greeting
  greetingSection: { paddingHorizontal: 20, paddingTop: 25, paddingBottom: 15 },
  greeting: { fontSize: 28, fontWeight: 'bold', color: '#000', marginBottom: 8 },
  destination: { fontSize: 16, color: '#666' },

  // Search Bar
  searchContainer: { paddingHorizontal: 20, marginBottom: 20 },
  searchBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3
  },
  searchTextContainer: { flex: 1 },
  searchText: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 3 },
  searchSubtext: { fontSize: 13, color: '#999' },
  filterButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 10, 
    backgroundColor: '#FF6B35', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginLeft: 10
  },

  // Categories
  categoriesContainer: { marginBottom: 20 },
  categoriesContent: { paddingHorizontal: 20 },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10
  },
  categoryChipActive: { backgroundColor: '#FF6B35' },
  categoryText: { fontSize: 14, fontWeight: '600', color: '#666' },
  categoryTextActive: { color: '#fff' },

  // Special Offers
  offersSection: { paddingHorizontal: 20, marginBottom: 25 },
  offerCard: {
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backgroundColor: '#667eea',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden'
  },
  offerContent: { flex: 1 },
  offerBadge: { fontSize: 11, fontWeight: 'bold', color: '#fff', marginBottom: 8, opacity: 0.9 },
  offerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  offerSubtitle: { fontSize: 14, color: '#fff', opacity: 0.9, marginBottom: 15 },
  offerButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start'
  },
  offerButtonText: { fontSize: 14, fontWeight: 'bold', color: '#667eea' },
  offerIcon: { position: 'absolute', right: -20, bottom: -10 },

  // Recent Bookings
  recentSection: { marginBottom: 25 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15
  },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#000' },
  seeAllText: { fontSize: 14, color: '#FF6B35', fontWeight: '600' },
  recentCard: {
    width: 140,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3
  },
  recentImage: { width: '100%', height: 80, backgroundColor: '#f0f0f0', borderRadius: 8, marginBottom: 8 },
  recentBrand: { fontSize: 11, color: '#666', marginBottom: 2 },
  recentModel: { fontSize: 14, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  recentDate: { fontSize: 11, color: '#999' },

  // Top Trends Carousel
  trendsSection: { marginBottom: 30 },
  carouselContent: { paddingHorizontal: 20, paddingVertical: 5 },
  trendCard: { 
    width: CARD_WIDTH, 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    marginRight: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden'
  },
  favoriteButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  cardImage: { 
    width: '100%', 
    height: 180, 
    backgroundColor: '#e3f2fd',
    padding: 20
  },
  cardContent: { padding: 15 },
  cardBrand: { fontSize: 14, color: '#666', marginBottom: 4 },
  cardModel: { fontSize: 20, fontWeight: 'bold', color: '#000', marginBottom: 12 },
  cardDetails: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cardType: { fontSize: 14, color: '#FF6B35', fontWeight: '600' },
  cardPrice: { fontSize: 18, fontWeight: 'bold', color: '#28a745' },
  carouselDots: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginTop: 15 
  },
  dot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    backgroundColor: '#ddd', 
    marginHorizontal: 4,
    transition: 'all 0.3s ease',
  },
  activeDot: { backgroundColor: '#FF6B35', width: 24 },

  // Popular Vehicles
  popularSection: { paddingHorizontal: 20, marginBottom: 20 },
  popularGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  popularCard: { 
    width: (width - 60) / 2, 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3
  },
  popularFavoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  },
  popularImage: { 
    width: '100%', 
    height: 100, 
    backgroundColor: '#f0f0f0', 
    borderRadius: 8,
    marginBottom: 10,
    padding: 10
  },
  popularBrand: { fontSize: 12, color: '#666', marginBottom: 2 },
  popularModel: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 6 },
  popularPrice: { fontSize: 14, fontWeight: '600', color: '#28a745' },

  // Bottom Menu
  bottomMenu: { 
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10
  },
  menuItem: { alignItems: 'center', padding: 8 },
  menuItemText: { fontSize: 11, color: '#333', fontWeight: '500' },

  // Side Menu
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  menuPanel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 40
  },
  menuHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center'
  },
  menuAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },
  menuAvatarText: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  menuUserName: { fontSize: 20, fontWeight: 'bold', color: '#000', marginBottom: 5 },
  menuCloseButton: {
    position: 'absolute',
    top: 20,
    right: 20
  },
  menuContent: { padding: 10 },
  menuListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5'
  },
  menuListText: { fontSize: 16, color: '#333', marginLeft: 15, flex: 1 },
  menuBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center'
  },
  menuBadgeText: { fontSize: 12, fontWeight: 'bold', color: '#fff' },
  menuDivider: { height: 1, backgroundColor: '#e0e0e0', marginVertical: 10 },

  // Search Modal
  searchModal: { flex: 1, backgroundColor: '#fff' },
  searchModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  searchModalTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    margin: 20,
    marginBottom: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
    color: '#000'
  },
  searchResults: { flex: 1 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60
  },
  emptyStateText: { fontSize: 16, color: '#999', marginTop: 15 },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  searchResultImage: {
    width: 70,
    height: 50,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginRight: 15
  },
  searchResultInfo: { flex: 1 },
  searchResultBrand: { fontSize: 12, color: '#666', marginBottom: 2 },
  searchResultModel: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 2 },
  searchResultType: { fontSize: 13, color: '#FF6B35' },
  searchResultPrice: { fontSize: 16, fontWeight: 'bold', color: '#28a745' },

  // Demo Notice
  demoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  demoNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#856404',
    lineHeight: 16,
  },
});
