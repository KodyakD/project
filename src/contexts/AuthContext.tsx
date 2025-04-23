import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useSegments, useRootNavigationState } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import jwtDecode from 'jwt-decode';

import { auth, firestore } from '../config/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
  UserCredential,
  getIdToken,
  signInWithCredential,
  GoogleAuthProvider,
  AuthError,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { USER_ROLES } from '../constants/roles';

// Store keys
const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_DATA_KEY = 'auth_user_data';

// JWT token type
interface JwtToken {
  exp: number;
  sub: string;
  email: string;
  role: string;
  [key: string]: any;
}

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  photoURL?: string;
  role: string;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  phoneNumber?: string;
  department?: string;
  isEmailVerified: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithSSO: (clientId: string, discoveryUrl: string) => Promise<void>;
  register: (email: string, password: string, userData: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshToken: () => Promise<string | null>;
  clearError: () => void;
  guestLogin: (qrToken: string) => Promise<void>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  login: async () => {},
  loginWithGoogle: async () => {},
  loginWithSSO: async () => {},
  register: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
  updateUserProfile: async () => {},
  refreshToken: async () => null,
  clearError: () => {},
  guestLogin: async () => {},
});

// Expose the auth context hook
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  // Load stored user data on initial mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Load user data from storage
        const userData = await AsyncStorage.getItem(USER_DATA_KEY);
        if (userData) {
          setUser(JSON.parse(userData));
        }
        
        // Set up firebase auth state listener
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            // User is signed in
            const userProfile = await fetchOrCreateUserProfile(firebaseUser);
            setUser(userProfile);
            await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userProfile));
            
            // Store tokens
            const token = await firebaseUser.getIdToken();
            await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
            
            // Also store refresh token if available
            const refreshToken = firebaseUser.refreshToken;
            if (refreshToken) {
              await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
            }
          } else {
            // User is signed out
            setUser(null);
            await AsyncStorage.removeItem(USER_DATA_KEY);
            await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
            await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
          }
          
          setIsLoading(false);
        });
        
        return unsubscribe;
      } catch (error) {
        console.error('Error initializing auth:', error);
        setIsLoading(false);
        return () => {};
      }
    };
    
    initializeAuth();
  }, []);
  
  // Handle protected routes
  useEffect(() => {
    if (!navigationState?.key || isLoading) return;
    
    const inProtectedRoute = segments[0] === '(tabs)' || 
                            segments[0] === 'profile' || 
                            segments[0] === 'incident';
    const inAuthRoute = segments[0] === 'login' || 
                        segments[0] === 'register' || 
                        segments[0] === 'reset-password';
    
    if (!user && inProtectedRoute) {
      // Redirect to login if trying to access protected route while not authenticated
      router.replace('/login');
    } else if (user && inAuthRoute) {
      // Redirect to home if trying to access auth routes while authenticated
      router.replace('/');
    }
  }, [segments, user, isLoading, navigationState?.key]);
  
  // Fetch or create user profile in Firestore
  const fetchOrCreateUserProfile = async (firebaseUser: FirebaseUser): Promise<UserProfile> => {
    try {
      const userRef = doc(firestore, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        // Update last login time
        await updateDoc(userRef, {
          lastLogin: serverTimestamp(),
        });
        
        return {
          id: firebaseUser.uid,
          ...userSnap.data() as Omit<UserProfile, 'id'>,
          isEmailVerified: firebaseUser.emailVerified,
        };
      } else {
        // Create new user profile
        const newUser: Omit<UserProfile, 'id'> = {
          email: firebaseUser.email || '',
          firstName: firebaseUser.displayName?.split(' ')[0] || '',
          lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
          displayName: firebaseUser.displayName || '',
          photoURL: firebaseUser.photoURL || '',
          role: USER_ROLES.FIRE_FIGHTER,
          lastLogin: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          isEmailVerified: firebaseUser.emailVerified,
        };
        
        await setDoc(userRef, {
          ...newUser,
          lastLogin: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        
        return {
          id: firebaseUser.uid,
          ...newUser,
        };
      }
    } catch (error) {
      console.error('Error fetching/creating user profile:', error);
      throw error;
    }
  };

  // Email/password login
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Auth state listener will handle setting user
      
      return userCredential;
    } catch (error: any) {
      handleAuthError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Google login
  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Configure Google sign-in
      const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
      const provider = new GoogleAuthProvider();
      
      // Start Google sign-in flow
      const result = await WebBrowser.openAuthSessionAsync(
        `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=token&scope=profile email`,
        redirectUri
      );
      
      if (result.type === 'success' && result.url) {
        // Extract access token from URL
        const params = new URLSearchParams(new URL(result.url).hash.substr(1));
        const accessToken = params.get('access_token');
        
        if (accessToken) {
          // Create credential and sign in with Firebase
          const credential = GoogleAuthProvider.credential(null, accessToken);
          const userCredential = await signInWithCredential(auth, credential);
          // Auth state listener will handle setting user
          
          return userCredential;
        }
      }
      
      throw new Error('Google sign in failed');
    } catch (error: any) {
      handleAuthError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // SSO login
  const loginWithSSO = async (clientId: string, discoveryUrl: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Configure SSO discovery
      const discovery = await AuthSession.fetchDiscoveryAsync(discoveryUrl);
      
      // Start SSO sign-in flow
      const request = new AuthSession.AuthRequest({
        clientId,
        scopes: ['openid', 'profile', 'email'],
        redirectUri: AuthSession.makeRedirectUri({ useProxy: true }),
      });
      
      const result = await request.promptAsync(discovery);
      
      if (result.type === 'success') {
        const { idToken } = result.params;
        
        if (idToken) {
          // Create credential and sign in with Firebase
          const credential = GoogleAuthProvider.credential(idToken);
          const userCredential = await signInWithCredential(auth, credential);
          // Auth state listener will handle setting user
          
          return userCredential;
        }
      }
      
      throw new Error('SSO sign in failed');
    } catch (error: any) {
      handleAuthError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Register new user
  const register = async (email: string, password: string, userData: Partial<UserProfile>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Set display name if provided
      if (userData.firstName || userData.lastName) {
        const displayName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
        await updateProfile(firebaseUser, { displayName });
      }
      
      // Create user profile in Firestore
      const userRef = doc(firestore, 'users', firebaseUser.uid);
      await setDoc(userRef, {
        email: firebaseUser.email,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        role: userData.role || USER_ROLES.FIRE_FIGHTER,
        lastLogin: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isEmailVerified: firebaseUser.emailVerified,
      });
      
      // Auth state listener will handle setting user
      
      return userCredential;
    } catch (error: any) {
      handleAuthError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Guest login with QR code
  const guestLogin = async (qrToken: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Validate the QR token format
      if (!qrToken || typeof qrToken !== 'string') {
        throw new Error('Invalid QR code format');
      }
      
      // Create a guest user profile
      const guestUser: UserProfile = {
        id: `guest_${Date.now()}`,
        email: 'guest@example.com',
        firstName: 'Guest',
        lastName: 'User',
        role: USER_ROLES.GUEST,
        isEmailVerified: false,
        createdAt: new Date(),
      };
      
      // Store guest user data
      setUser(guestUser);
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(guestUser));
      
      // Store guest token with expiration
      const guestToken = createGuestToken(guestUser);
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, guestToken);
      
      // Set a timer to auto-logout after token expiration (4 hours)
      setTimeout(() => {
        logout();
      }, 4 * 60 * 60 * 1000);
      
    } catch (error: any) {
      handleAuthError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create a simple guest token for temporary access
  const createGuestToken = (guestUser: UserProfile): string => {
    // Very simple token with expiration of 4 hours
    const payload = {
      sub: guestUser.id,
      email: guestUser.email,
      role: guestUser.role,
      exp: Math.floor(Date.now() / 1000) + (4 * 60 * 60), // 4 hours
      iat: Math.floor(Date.now() / 1000),
    };
    
    // In a real app, you would use a proper JWT library and sign this properly
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  };
  
  // Sign out
  const logout = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Sign out from Firebase
      await firebaseSignOut(auth);
      
      // Clear stored data
      setUser(null);
      await AsyncStorage.removeItem(USER_DATA_KEY);
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      
      // Navigate to login
      router.replace('/login');
    } catch (error: any) {
      console.error('Logout error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Password reset
  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      handleAuthError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update user profile
  const updateUserProfile = async (data: Partial<UserProfile>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!user || !auth.currentUser) {
        throw new Error('No authenticated user');
      }
      
      // Update display name and photo URL in Firebase Auth if provided
      const updateData: { displayName?: string; photoURL?: string } = {};
      
      if (data.firstName || data.lastName) {
        const firstName = data.firstName || user.firstName;
        const lastName = data.lastName || user.lastName;
        updateData.displayName = `${firstName} ${lastName}`.trim();
      }
      
      if (data.photoURL) {
        updateData.photoURL = data.photoURL;
      }
      
      if (Object.keys(updateData).length > 0) {
        await updateProfile(auth.currentUser, updateData);
      }
      
      // Update user profile in Firestore
      const userRef = doc(firestore, 'users', user.id);
      await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
      
      // Update local user state
      const updatedUser = {
        ...user,
        ...data,
        displayName: updateData.displayName || user.displayName,
        photoURL: updateData.photoURL || user.photoURL,
        updatedAt: new Date(),
      };
      
      setUser(updatedUser);
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedUser));
    } catch (error: any) {
      handleAuthError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get current auth token with automatic refresh if expired
  const refreshToken = async (): Promise<string | null> => {
    try {
      // Check if user is authenticated
      if (!auth.currentUser) {
        return null;
      }
      
      // Try to get the stored token
      let token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      
      // If token exists, check if it's expired
      if (token) {
        try {
          const decoded = jwtDecode<JwtToken>(token);
          const currentTime = Math.floor(Date.now() / 1000);
          
          // If token is expired or close to expiry (within 5 minutes), refresh it
          if (decoded.exp < currentTime + 300) {
            // Get a fresh token from Firebase
            token = await auth.currentUser.getIdToken(true);
            await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
          }
        } catch (e) {
          // If token can't be decoded, get a fresh one
          token = await auth.currentUser.getIdToken(true);
          await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
        }
      } else {
        // No token stored, get a fresh one
        token = await auth.currentUser.getIdToken();
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
      }
      
      return token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  };
  
  // Helper to handle auth errors consistently
  const handleAuthError = (error: any) => {
    let errorMessage = 'An unexpected error occurred';
    
    if (error instanceof Error) {
      const authError = error as AuthError;
      
      switch (authError.code) {
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address format';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'Email address is already in use';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error, please check your connection';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many unsuccessful attempts, please try again later';
          break;
        default:
          errorMessage = authError.message || 'Authentication failed';
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = error.message as string;
    }
    
    setError(errorMessage);
  };
  
  // Clear any error messages
  const clearError = () => {
    setError(null);
  };
  
  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    loginWithGoogle,
    loginWithSSO,
    register,
    logout,
    resetPassword,
    updateUserProfile,
    refreshToken,
    clearError,
    guestLogin,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 