import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCQ3UTQmo3JNGtjONHx6XfAw-TALLIXY8A",
  authDomain: "rent-cars-68409.firebaseapp.com",
  projectId: "rent-cars-68409",
  storageBucket: "rent-cars-68409.firebasestorage.app",
  messagingSenderId: "437361313722",
  appId: "1:437361313722:web:099c6d244c9f1d69b27f83"
};

// Initialize Firebase (only once)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Authentication with AsyncStorage persistence
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  // If already initialized, get the existing instance
  if (error.code === 'auth/already-initialized') {
    auth = getAuth(app);
  } else {
    throw error;
  }
}

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export { auth };
export default app;
