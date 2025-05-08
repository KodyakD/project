import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import Constants from 'expo-constants';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAqJkaSAV04ljQWsZ-Q7J5mU-O0KysAcgs',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'fire-rescue-expert-app.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'fire-rescue-expert-app',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'fire-rescue-expert-app.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '381153036555',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_APP_ID || '1:381153036555:web:79873a9a3f56e32201ba0e'
};

// Initialize Firebase if it hasn't been initialized yet
let app;
if (!firebase.apps.length) {
  app = firebase.initializeApp(firebaseConfig);
} else {
  app = firebase.app();
}

// Get Firebase services
const db = firestore();
const authInstance = auth();
const storageInstance = storage();

// Enable Firestore offline persistence for better offline experience
db.settings({
  persistence: true,  // Enable offline persistence
  cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED  // Use unlimited cache size
});

// Export the Firebase services
export { 
  app, 
  authInstance as auth, 
  db, 
  storageInstance as storage 
};

// Export the Firebase modules to allow for advanced operation
export { 
  firebase,
  auth as authModule,
  firestore as firestoreModule,
  storage as storageModule
};