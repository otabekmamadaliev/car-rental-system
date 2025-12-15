import { db } from '../config/firebase';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, deleteDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';

// User Profile Management
export const saveUserProfile = async (userId, profileData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...profileData,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('Error saving user profile:', error);
    return { success: false, error };
  }
};

export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { success: true, data: userSnap.data() };
    } else {
      return { success: false, error: 'User not found' };
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { success: false, error };
  }
};

export const updateUserProfile = async (userId, updates) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, error };
  }
};

// Real-time user profile listener
export const listenToUserProfile = (userId, callback) => {
  const userRef = doc(db, 'users', userId);
  
  const unsubscribe = onSnapshot(userRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error listening to user profile:', error);
    callback(null);
  });
  
  return unsubscribe;
};

// Bookings Management
export const saveBooking = async (userId, bookingData) => {
  try {
    const bookingRef = doc(collection(db, 'bookings'));
    await setDoc(bookingRef, {
      ...bookingData,
      userId,
      id: bookingRef.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { success: true, bookingId: bookingRef.id };
  } catch (error) {
    console.error('Error saving booking:', error);
    return { success: false, error };
  }
};

export const getUserBookings = async (userId) => {
  try {
    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const bookings = [];
    querySnapshot.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: bookings };
  } catch (error) {
    console.error('Error getting bookings:', error);
    return { success: false, error };
  }
};

export const updateBooking = async (bookingId, updates) => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating booking:', error);
    return { success: false, error };
  }
};

export const deleteBooking = async (bookingId) => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await deleteDoc(bookingRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting booking:', error);
    return { success: false, error };
  }
};

// Favorites Management
export const addFavorite = async (userId, carId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      // Create user document if it doesn't exist
      await setDoc(userRef, {
        id: userId,
        favorites: [carId],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else {
      await updateDoc(userRef, {
        favorites: arrayUnion(carId),
        updatedAt: new Date().toISOString()
      });
    }
    return { success: true };
  } catch (error) {
    console.error('Error adding favorite:', error);
    return { success: false, error };
  }
};

export const removeFavorite = async (userId, carId) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      favorites: arrayRemove(carId),
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error removing favorite:', error);
    return { success: false, error };
  }
};

export const getUserFavorites = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const favorites = userSnap.data().favorites || [];
      return { success: true, data: favorites };
    } else {
      return { success: true, data: [] };
    }
  } catch (error) {
    console.error('Error getting favorites:', error);
    return { success: false, error };
  }
};

// Real-time favorites listener
export const listenToFavorites = (userId, callback) => {
  const userRef = doc(db, 'users', userId);
  
  const unsubscribe = onSnapshot(userRef, (doc) => {
    if (doc.exists()) {
      const favorites = doc.data().favorites || [];
      callback(favorites);
    } else {
      callback([]);
    }
  }, (error) => {
    console.error('Error listening to favorites:', error);
  });
  
  return unsubscribe;
};

// Driver License Management
export const saveDriverLicense = async (userId, licenseData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      driverLicense: licenseData,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error saving driver license:', error);
    return { success: false, error };
  }
};

// Real-time driver license listener
export const listenToDriverLicense = (userId, callback) => {
  const userRef = doc(db, 'users', userId);
  
  const unsubscribe = onSnapshot(userRef, (doc) => {
    if (doc.exists()) {
      const driverLicense = doc.data().driverLicense || null;
      callback(driverLicense);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error listening to driver license:', error);
    callback(null);
  });
  
  return unsubscribe;
};

// Real-time bookings listener
export const listenToBookings = (userId, callback) => {
  const bookingsRef = collection(db, 'bookings');
  const q = query(bookingsRef, where('userId', '==', userId));
  
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const bookings = [];
    querySnapshot.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data() });
    });
    callback(bookings);
  }, (error) => {
    console.error('Error listening to bookings:', error);
    callback([]);
  });
  
  return unsubscribe;
};
