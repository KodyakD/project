import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useSegments } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
// Add this Buffer polyfill for React Native
import { Buffer as BufferPolyfill } from 'buffer';
global.Buffer = global.Buffer || BufferPolyfill;

import { USER_ROLES } from '../constants/roles';

// Store keys
const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_DATA_KEY = 'auth_user_data';

// Create a simple context with no values
const AuthContext = React.createContext(null);

// Simple provider that just passes children through
export function AuthProvider({ children }) {
  // No hooks, just rendering children
  return (
    <AuthContext.Provider value={{}}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}