import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SafeContainer from '../components/SafeContainer';
import { useTheme } from '../contexts/ThemeContext';
import { listenToDriverLicense, listenToUserProfile } from '../services/firestore';

export default function Profile({ navigation }) {
  const { theme } = useTheme();
  const [user, setUser] = useState(null);
  const [licenseData, setLicenseData] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserData();
    });
    return unsubscribe;
  }, [navigation]);

  const loadUserData = async () => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        const userData = JSON.parse(userJson);
        setUser(userData);

        // Set up real-time listener for user profile updates
        const profileUnsubscribe = listenToUserProfile(userData.id, (profileData) => {
          if (profileData) {
            // Merge with existing user data
            const updatedUser = { ...userData, ...profileData };
            setUser(updatedUser);
            // Update AsyncStorage
            AsyncStorage.setItem('user', JSON.stringify(updatedUser));
          }
        });

        // Set up real-time listener for driver license
        const licenseUnsubscribe = listenToDriverLicense(userData.id, (license) => {
          setLicenseData(license);
          // Update AsyncStorage
          const updatedUser = { ...userData, driverLicense: license };
          setUser(updatedUser);
          AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        });

        // Cleanup on unmount
        return () => {
          if (profileUnsubscribe) profileUnsubscribe();
          if (licenseUnsubscribe) licenseUnsubscribe();
        };
      }
    } catch (error) {
      console.log('Error loading user data:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('user');
              await AsyncStorage.removeItem('isLoggedIn');
              // Reset navigation stack to prevent going back
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              navigation.replace('Login');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account.');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeContainer style={{ backgroundColor: theme.background }}>
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Text>
            </View>
            <View style={[styles.verifiedBadge, licenseData?.verified && styles.verifiedBadgeActive]}>
              <Ionicons 
                name={licenseData?.verified ? "checkmark-circle" : "alert-circle"} 
                size={20} 
                color="#fff" 
              />
            </View>
          </View>
          <Text style={[styles.userName, { color: theme.text }]}>{user?.firstName} {user?.lastName}</Text>
          <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{user?.email}</Text>
          {licenseData?.verified && (
            <View style={styles.verifiedTag}>
              <Ionicons name="shield-checkmark" size={14} color="#28a745" />
              <Text style={styles.verifiedText}>Verified Driver</Text>
            </View>
          )}
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Account</Text>
          
          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: theme.cardBackground }]}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(0, 217, 255, 0.1)' }]}>
                <Ionicons name="person-outline" size={20} color="#00D9FF" />
              </View>
              <Text style={[styles.menuItemText, { color: theme.text }]}>Edit Account Details</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: theme.cardBackground }]}
            onPress={() => navigation.navigate('DriverLicense')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconCircle, { backgroundColor: licenseData?.verified ? '#d4edda' : '#fff3cd' }]}>
                <Ionicons 
                  name="card-outline" 
                  size={20} 
                  color={licenseData?.verified ? "#28a745" : "#ffc107"} 
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemText, { color: theme.text }]}>Driver License</Text>
                <Text style={[styles.menuItemSubtext, { color: theme.textSecondary }]}>
                  {licenseData?.verified ? 'Verified ✓' : licenseData ? 'Pending Verification' : 'Not Verified'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: theme.cardBackground }]}
            onPress={() => navigation.navigate('MyBookings')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#f3e5f5' }]}>
                <Ionicons name="calendar-outline" size={20} color="#9c27b0" />
              </View>
              <Text style={[styles.menuItemText, { color: theme.text }]}>Booking History</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Support</Text>
          
          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: theme.cardBackground }]}
            onPress={() => navigation.navigate('ContactSupport')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#e8f5e9' }]}>
                <Ionicons name="chatbubble-outline" size={20} color="#4caf50" />
              </View>
              <Text style={[styles.menuItemText, { color: theme.text }]}>Contact Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: theme.cardBackground }]}
            onPress={() => navigation.navigate('FAQ')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#fff3e0' }]}>
                <Ionicons name="help-circle-outline" size={20} color="#ff9800" />
              </View>
              <Text style={[styles.menuItemText, { color: theme.text }]}>FAQ</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: theme.cardBackground }]}
            onPress={() => Alert.alert('Terms & Conditions', 'Terms and conditions content here...')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#fce4ec' }]}>
                <Ionicons name="document-text-outline" size={20} color="#e91e63" />
              </View>
              <Text style={[styles.menuItemText, { color: theme.text }]}>Terms & Conditions</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: theme.cardBackground }]}
            onPress={() => Alert.alert('Privacy Policy', 'Privacy policy content here...')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#e0f2f1' }]}>
                <Ionicons name="shield-outline" size={20} color="#009688" />
              </View>
              <Text style={[styles.menuItemText, { color: theme.text }]}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Settings</Text>
          
          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: theme.cardBackground }]}
            onPress={() => navigation.navigate('Sensors')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#f3e5f5' }]}>
                <Ionicons name="speedometer-outline" size={20} color="#9c27b0" />
              </View>
              <Text style={[styles.menuItemText, { color: theme.text }]}>Sensors & Camera</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Account Actions</Text>
          
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#FF6B35" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={handleDeleteAccount}
          >
            <Ionicons name="trash-outline" size={20} color="#dc3545" />
            <Text style={styles.deleteText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  
  // Header
  header: { 
    alignItems: 'center', 
    paddingVertical: 30,
    backgroundColor: '#fff',
    marginBottom: 20
  },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatar: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5
  },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
  verifiedBadge: { 
    position: 'absolute', 
    bottom: 0, 
    right: 0, 
    width: 32, 
    height: 32, 
    borderRadius: 16,
    backgroundColor: '#999',
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center'
  },
  verifiedBadgeActive: { backgroundColor: '#28a745' },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#000', marginBottom: 5 },
  userEmail: { fontSize: 15, color: '#666', marginBottom: 10 },
  verifiedTag: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#d4edda', 
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },
  verifiedText: { fontSize: 13, color: '#28a745', fontWeight: '600', marginLeft: 5 },

  // Sections
  section: { 
    backgroundColor: '#fff', 
    marginBottom: 20,
    paddingVertical: 10
  },
  sectionTitle: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: '#666', 
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    paddingVertical: 10,
    letterSpacing: 0.5
  },

  // Menu Items
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconCircle: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 15
  },
  menuItemText: { fontSize: 16, color: '#000', fontWeight: '500' },
  menuItemSubtext: { fontSize: 13, color: '#666', marginTop: 2 },

  // Action Buttons
  logoutButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    paddingVertical: 15,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 12
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#00D9FF', marginLeft: 8 },
  
  deleteButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8d7da',
    paddingVertical: 15,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 12
  },
  deleteText: { fontSize: 16, fontWeight: '600', color: '#dc3545', marginLeft: 8 }
});
