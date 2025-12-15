import AsyncStorage from '@react-native-async-storage/async-storage';

async function clearAuth() {
  try {
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('isLoggedIn');
    console.log('Auth data cleared successfully');
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
}

clearAuth();
