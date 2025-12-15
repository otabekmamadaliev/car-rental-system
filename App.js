import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';
import { ThemeProvider } from './contexts/ThemeContext';

import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import EmailVerificationScreen from './screens/EmailVerificationScreen';
import HomeScreen from './screens/HomeScreen';
import BrowseCars from './screens/BrowseCars';
import CreateBooking from './screens/CreateBooking';
import EditBooking from './screens/EditBooking';
import CarDetails from './screens/CarDetails';
import CameraUpload from './screens/CameraUpload';
import Sensors from './screens/Sensors';
import Profile from './screens/Profile';
import MyBookings from './screens/MyBookings';
import EditProfile from './screens/EditProfile';
import DriverLicense from './screens/DriverLicense';
import ContactSupport from './screens/ContactSupport';
import FAQ from './screens/FAQ';

const Stack = createStackNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const loginStatus = await AsyncStorage.getItem('isLoggedIn');
      setIsLoggedIn(loginStatus === 'true');
    } catch (error) {
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName={isLoggedIn ? "Home" : "Login"}>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ headerShown: false }} />
          <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
          <Stack.Screen 
            name="Browse" 
            component={BrowseCars} 
            options={({ route }) => ({ 
              title: route.params?.favorites ? 'My Favorites' : 'Browse Cars' 
            })} 
          />
          <Stack.Screen name="CreateBooking" component={CreateBooking} options={{ title: 'Create Booking' }} />
          <Stack.Screen name="EditBooking" component={EditBooking} options={{ title: 'Edit Booking' }} />
          <Stack.Screen name="CarDetails" component={CarDetails} options={{ title: 'Car Details' }} />
          <Stack.Screen name="Sensors" component={Sensors} />
          <Stack.Screen name="Profile" component={Profile} options={{ headerShown: false }} />
          <Stack.Screen name="MyBookings" component={MyBookings} />
          <Stack.Screen name="EditProfile" component={EditProfile} options={{ headerShown: false }} />
          <Stack.Screen name="DriverLicense" component={DriverLicense} options={{ headerShown: false }} />
          <Stack.Screen name="ContactSupport" component={ContactSupport} options={{ headerShown: false }} />
          <Stack.Screen name="FAQ" component={FAQ} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}

