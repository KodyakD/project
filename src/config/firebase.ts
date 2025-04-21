import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Firebase configuration with actual values
const firebaseConfig = {
  apiKey: "AIzaSyAqJkaSAV04ljQWsZ-Q7J5mU-O0KysAcgs",
  authDomain: "fire-rescue-expert-app.firebaseapp.com",
  projectId: "fire-rescue-expert-app",
  storageBucket: "fire-rescue-expert-app.firebasestorage.app",
  messagingSenderId: "381153036555",
  appId: "1:381153036555:web:79873a9a3f56e32201ba0e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);

export { app, auth, db };