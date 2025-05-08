import React, { createContext, useState, useContext, useEffect } from 'react';
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
import authService, { UserData, UserRole } from '../services/authService';

// Store keys
const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_DATA_KEY = 'auth_user_data';

// Define the shape of our context
interface AuthContextType {
  user: UserData | null;
  initialized: boolean;
  isAnonymous: boolean;
  isAuthenticated: boolean;
  tokenExpiryTime: string;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<UserData>;
  register: (email: string, password: string, displayName: string, role?: UserRole) => Promise<UserData>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<UserData>;
  loginWithQrCode: (qrCodeData: string) => Promise<UserData>;
  resetPassword: (email: string) => Promise<void>;
  confirmPasswordReset: (code: string, newPassword: string) => Promise<void>;
  refreshToken: () => Promise<string | null>;
  hasRole: (roles: UserRole | UserRole[]) => Promise<boolean>;
  updateTokenExpiryTime: () => Promise<void>;
  clearError: () => void;
}

// Create context with default values
const AuthContext = createContext<AuthContextType | null>(null);

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tokenExpiryTime, setTokenExpiryTime] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize authentication state
  useEffect(() => {
    const initAuth = async () => {
      try {
        setIsLoading(true);
        // Get current user data
        const userData = await authService.getCurrentUser();
        setUser(userData);
        setIsAuthenticated(!!userData);
        setIsAnonymous(userData?.isAnonymous || false);
        
        // Get token expiry time if authenticated
        if (userData) {
          const expiry = await authService.getTokenExpiryTime();
          setTokenExpiryTime(expiry);
        }
        
        setInitialized(true);
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Set up auth state listener
    const removeListener = authService.addAuthStateListener((state) => {
      setUser(state.user);
      setIsAuthenticated(state.isAuthenticated);
      setIsAnonymous(state.isAnonymous);
      setInitialized(state.initialized);
    });
    
    initAuth();
    
    // Cleanup listener on unmount
    return () => {
      removeListener();
    };
  }, []);

  // Login with email and password
  const login = async (email: string, password: string): Promise<UserData> => {
    try {
      setIsLoading(true);
      setError(null);
      const userData = await authService.signInWithEmailAndPassword(email, password);
      setUser(userData);
      setIsAuthenticated(true);
      setIsAnonymous(userData.isAnonymous || false);
      return userData;
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Register new user
  const register = async (email: string, password: string, displayName: string, role?: UserRole): Promise<UserData> => {
    try {
      setIsLoading(true);
      setError(null);
      const userData = await authService.register(email, password, displayName, role);
      setUser(userData);
      setIsAuthenticated(true);
      setIsAnonymous(false);
      return userData;
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.signOut();
      setUser(null);
      setIsAuthenticated(false);
      setIsAnonymous(false);
    } catch (err: any) {
      setError(err.message || 'Logout failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Login with Google
  const loginWithGoogle = async (): Promise<UserData> => {
    try {
      setIsLoading(true);
      setError(null);
      const userData = await authService.signInWithGoogle();
      setUser(userData);
      setIsAuthenticated(true);
      setIsAnonymous(false);
      return userData;
    } catch (err: any) {
      setError(err.message || 'Google login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Login with QR code
  const loginWithQrCode = async (qrCodeData: string): Promise<UserData> => {
    try {
      setIsLoading(true);
      setError(null);
      // Change this line to match the method name in authService
      const userData = await authService.loginWithQRCode(qrCodeData);
      setUser(userData);
      setIsAuthenticated(true);
      setIsAnonymous(userData.isAnonymous || false);
      return userData;
    } catch (err: any) {
      setError(err.message || 'QR code login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.sendPasswordResetEmail(email);
    } catch (err: any) {
      setError(err.message || 'Password reset failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm password reset
  const confirmPasswordReset = async (code: string, newPassword: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.confirmPasswordReset(code, newPassword);
    } catch (err: any) {
      setError(err.message || 'Password reset confirmation failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh token
  const refreshToken = async (): Promise<string | null> => {
    try {
      setError(null);
      return await authService.refreshToken();
    } catch (err: any) {
      setError(err.message || 'Token refresh failed');
      throw err;
    }
  };

  // Check if user has a role
  const hasRole = async (roles: UserRole | UserRole[]): Promise<boolean> => {
    try {
      return await authService.hasRole(roles);
    } catch (err) {
      return false;
    }
  };

  // Update token expiry time
  const updateTokenExpiryTime = async (): Promise<void> => {
    try {
      const expiry = await authService.getTokenExpiryTime();
      setTokenExpiryTime(expiry);
    } catch (err) {
      console.error('Failed to update token expiry time:', err);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Create context value object with all auth state and functions
  const authContextValue: AuthContextType = {
    user,
    initialized,
    isAnonymous,
    isAuthenticated,
    tokenExpiryTime,
    isLoading,
    error,
    login,
    register,
    logout,
    loginWithGoogle,
    loginWithQrCode,
    resetPassword,
    confirmPasswordReset,
    refreshToken,
    hasRole,
    updateTokenExpiryTime,
    clearError
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Optional: Include an auth state checker component for protected routes
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const { isAuthenticated, initialized } = useAuth();

  useEffect(() => {
    if (!initialized) return;

    const isProtectedRoute = segments[0] === '(tabs)' || 
                           segments[0] === 'settings';
    
    if (!isAuthenticated && isProtectedRoute) {
      router.replace('/login');
    }
  }, [isAuthenticated, initialized, segments]);

  return <>{children}</>;
}