import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, StyleSheet, Image, Platform, Dimensions } from 'react-native';
import { getCar } from '../src/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { addFavorite, removeFavorite, listenToFavorites } from '../services/firestore';

const { width } = Dimensions.get('window');

export default function CarDetails({ route, navigation }) {
  const { theme } = useTheme();
  const carId = route?.params?.carId;
  const [car, setCar] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    loadCarAndFavorite();
    
    // Set up real-time favorites listener
    let unsubscribe = null;
    const setupFavoritesListener = async () => {
      try {
        const userJson = await AsyncStorage.getItem('user');
        if (userJson) {
          const user = JSON.parse(userJson);
          unsubscribe = listenToFavorites(user.id, (favorites) => {
            setIsFavorite(favorites.includes(carId));
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
  }, [carId]);

  const loadCarAndFavorite = async () => {
    const c = await getCar(carId);
    setCar(c);
    
    const userJson = await AsyncStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    if (!user) return;
    
    const favoritesData = await AsyncStorage.getItem(`favorites_${user.email}`);
    const favorites = favoritesData ? JSON.parse(favoritesData) : [];
    setIsFavorite(favorites.includes(carId));
  };

  const toggleFavorite = async () => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : null;
      if (!user) return;
      
      if (isFavorite) {
        await removeFavorite(user.id, carId);
      } else {
        await addFavorite(user.id, carId);
      }
      // State will be updated automatically by the real-time listener
    } catch (error) {
      console.log('Error toggling favorite:', error);
    }
  };

  if (!car) return <View style={styles.center}><ActivityIndicator size="large" color="#FF6B35" /></View>;

  const features = [
    { icon: 'car-sport-outline', label: 'Type', value: car.type },
    { icon: 'settings-outline', label: 'Transmission', value: car.transmission },
    { icon: 'speedometer-outline', label: 'Fuel', value: car.fuelType },
    { icon: 'people-outline', label: 'Seats', value: `${car.seats} Passengers` },
    { icon: 'calendar-outline', label: 'Year', value: car.year },
    { icon: 'color-palette-outline', label: 'Color', value: car.color || 'Multiple' },
  ];

  const specifications = [
    { label: 'Engine', value: car.engine || '2.0L Turbo' },
    { label: 'Horsepower', value: car.horsepower || '250 HP' },
    { label: 'Top Speed', value: car.topSpeed || '220 km/h' },
    { label: '0-100 km/h', value: car.acceleration || '6.5 sec' },
    { label: 'Fuel Tank', value: car.fuelTank || '60L' },
    { label: 'Mileage', value: car.mileage || '12 km/L' },
  ];

  const included = [
    'Air Conditioning',
    'Bluetooth Audio',
    'GPS Navigation',
    'Parking Sensors',
    'Backup Camera',
    'USB Charging Ports',
    'Cruise Control',
    'Emergency Kit',
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={[styles.imageContainer, { backgroundColor: theme.cardBackground }]}>
          <Image 
            source={car.image} 
            style={styles.carImage}
            resizeMode="contain"
          />
          
          {/* Back Button */}
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: theme.cardBackground }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>

          {/* Favorite Button */}
          <TouchableOpacity 
            style={[styles.favoriteButton, { backgroundColor: theme.cardBackground }]}
            onPress={toggleFavorite}
          >
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={28} 
              color={isFavorite ? "#FF3B30" : theme.text} 
            />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={[styles.content, { backgroundColor: theme.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={[styles.brand, { color: theme.text }]}>{car.brand}</Text>
              <Text style={styles.model}>{car.model}</Text>
            </View>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={20} color="#FFD700" />
              <Text style={styles.rating}>{car.rating || '4.8'}</Text>
              <Text style={styles.reviews}>({car.reviews || '124'} reviews)</Text>
            </View>
          </View>

          {/* Features Grid */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Features</Text>
            <View style={styles.featuresGrid}>
              {features.map((feature, index) => (
                <View key={index} style={styles.featureCard}>
                  <View style={styles.featureIconContainer}>
                    <Ionicons name={feature.icon} size={24} color="#FF6B35" />
                  </View>
                  <Text style={styles.featureLabel}>{feature.label}</Text>
                  <Text style={styles.featureValue}>{feature.value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Specifications */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specifications</Text>
            <View style={styles.specsContainer}>
              {specifications.map((spec, index) => (
                <View key={index} style={styles.specRow}>
                  <Text style={styles.specLabel}>{spec.label}</Text>
                  <View style={styles.specDivider} />
                  <Text style={styles.specValue}>{spec.value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* What's Included */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What's Included</Text>
            <View style={styles.includedContainer}>
              {included.map((item, index) => (
                <View key={index} style={styles.includedItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                  <Text style={styles.includedText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this car</Text>
            <Text style={styles.description}>
              Experience luxury and performance in this {car.brand} {car.model}. 
              Perfect for both city driving and long trips, this {car.type.toLowerCase()} 
              offers exceptional comfort and reliability. With {car.transmission.toLowerCase()} transmission 
              and {car.fuelType.toLowerCase()} engine, it provides smooth driving experience 
              for up to {car.seats} passengers.
            </Text>
          </View>

          {/* Rental Terms */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rental Terms</Text>
            <View style={styles.termsContainer}>
              <View style={styles.termItem}>
                <Ionicons name="card-outline" size={20} color="#666" />
                <Text style={styles.termText}>Minimum age: 21 years</Text>
              </View>
              <View style={styles.termItem}>
                <Ionicons name="document-text-outline" size={20} color="#666" />
                <Text style={styles.termText}>Valid driver's license required</Text>
              </View>
              <View style={styles.termItem}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#666" />
                <Text style={styles.termText}>Insurance included</Text>
              </View>
              <View style={styles.termItem}>
                <Ionicons name="location-outline" size={20} color="#666" />
                <Text style={styles.termText}>Free pickup & delivery</Text>
              </View>
            </View>
          </View>

          {/* Spacing for bottom bar */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom Booking Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceSection}>
          <Text style={styles.priceLabel}>Price per day</Text>
          <Text style={styles.price}>${car.pricePerDay}</Text>
        </View>
        <TouchableOpacity 
          style={styles.bookButton}
          onPress={() => navigation.navigate('CreateBooking', { carId: car.id })}
        >
          <Text style={styles.bookButtonText}>Book Now</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#f5f5f5',
    position: 'relative',
  },
  carImage: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  favoriteButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    marginBottom: 24,
  },
  titleContainer: {
    marginBottom: 8,
  },
  brand: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  model: {
    fontSize: 20,
    fontWeight: '400',
    color: '#666',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  reviews: {
    fontSize: 14,
    color: '#999',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: (width - 52) / 3,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
    textAlign: 'center',
  },
  featureValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  specsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  specLabel: {
    fontSize: 15,
    color: '#666',
    width: 100,
  },
  specDivider: {
    flex: 1,
    height: 1,
    backgroundColor: 'transparent',
  },
  specValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  includedContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  includedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  includedText: {
    fontSize: 15,
    color: '#333',
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
  },
  termsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  termItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  termText: {
    fontSize: 15,
    color: '#333',
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
  priceSection: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 2,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FF6B35',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  bookButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
});
