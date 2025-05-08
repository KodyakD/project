import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { UserRole } from '../constants/roles';
import tokenService from './tokenService';
import * as Linking from 'expo-linking';
import axios from 'axios';

// Register for AuthSession redirect
WebBrowser.maybeCompleteAuthSession();

// Re-export the UserRole type so it can be imported from this file
export { UserRole };

// User data storage key
const USER_DATA_KEY = 'auth_user_data';

// User data interface
export interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  role: UserRole;
  department?: string;
  studentId?: string;
  isEmailVerified: boolean;
  isAnonymous: boolean;
  createdAt: string;
  lastLoginAt: string;
  fcmTokens?: string[];
  customData?: Record<string, any>;
}

// Auth state type
export type AuthState = {
  user: UserData | null;
  initialized: boolean;
  isAnonymous: boolean;
  isAuthenticated: boolean;
};

/**
 * Authentication Service
 * Handles user authentication, token management, and user data
 */
class AuthService {
  // Current user state
  private user: FirebaseAuthTypes.User | null = null;
  private userData: UserData | null = null;
  private authStateListeners: ((state: AuthState) => void)[] = [];

  constructor() {
    // Initialize auth state listener
    this.initAuthStateListener();
  }

  /**
   * Initialize the authentication state listener
   */
  private initAuthStateListener(): void {
    auth().onAuthStateChanged(async (firebaseUser) => {
      this.user = firebaseUser;

      if (firebaseUser) {
        // User is signed in
        try {
          // Get Firebase ID token for API authentication
          const token = await firebaseUser.getIdToken();
          const refreshToken = firebaseUser.refreshToken || '';

          // Store tokens using tokenService
          await tokenService.setTokens(token, refreshToken);

          // Fetch user data from Firestore
          await this.fetchUserData(firebaseUser.uid);

          // Notify listeners
          this.notifyAuthStateListeners();
        } catch (error) {
          console.error('Error initializing auth state:', error);
        }
      } else {
        // User is signed out
        this.userData = null;
        await tokenService.clearTokens();

        // Notify listeners
        this.notifyAuthStateListeners();
      }
    });
  }

  /**
   * Notify all listeners of auth state change
   */
  private notifyAuthStateListeners(): void {
    const authState: AuthState = {
      user: this.userData,
      initialized: true,
      isAnonymous: this.user?.isAnonymous || false,
      isAuthenticated: !!this.user,
    };

    this.authStateListeners.forEach((listener) => {
      try {
        listener(authState);
      } catch (error) {
        console.error('Error in auth state listener:', error);
      }
    });
  }

  /**
   * Fetch user data from Firestore
   * @param userId User ID
   */
  private async fetchUserData(userId: string): Promise<void> {
    try {
      const userDoc = await firestore().collection('users').doc(userId).get();

      if (userDoc.exists) {
        const userData = userDoc.data() as UserData;
        this.userData = userData;

        // Store user data locally
        await this.storeUserData(userData);

        // Update last login time
        await firestore().collection('users').doc(userId).update({
          lastLoginAt: new Date().toISOString(),
        });
      } else {
        // If no user document exists but we have a Firebase user,
        // create a new user document with basic information
        if (this.user) {
          const newUserData = this.firebaseUserToUserData(this.user);
          await this.createUserData(newUserData);
          this.userData = newUserData;
        } else {
          throw new Error('User document not found');
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  }

  /**
   * Sign in with email and password
   * @param email User email
   * @param password User password
   */
  public async signInWithEmailAndPassword(
    email: string,
    password: string
  ): Promise<UserData> {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Get fresh ID token
      const idToken = await user.getIdToken(true);
      const refreshToken = user.refreshToken || '';

      // Store tokens using tokenService
      await tokenService.setTokens(idToken, refreshToken);

      // Get or create user data
      let userData = await this.getUserData(user.uid);
      if (!userData) {
        userData = this.firebaseUserToUserData(user);
        await this.createUserData(userData);
      }

      // Update last login time
      await firestore().collection('users').doc(user.uid).update({
        lastLoginAt: new Date().toISOString(),
      });

      // Store locally
      this.userData = userData;
      await this.storeUserData(userData);

      return userData;
    } catch (error: any) {
      console.error('Login error:', error);

      // Provide user-friendly error messages
      let errorMessage = 'Login failed. Please check your credentials and try again.';

      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled. Please contact support.';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Please sign in again to continue.';
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Register a new user
   * @param email User email
   * @param password User password
   * @param displayName User's display name
   * @param role User role (defaults to student)
   */
  public async register(
    email: string,
    password: string,
    displayName: string,
    role: UserRole = 'student'
  ): Promise<UserData> {
    try {
      // Create user in Firebase Auth
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Update profile
      await user.updateProfile({ displayName });

      // Get fresh ID token
      const idToken = await user.getIdToken(true);
      const refreshToken = user.refreshToken || '';

      // Store tokens using tokenService
      await tokenService.setTokens(idToken, refreshToken);

      // Create user data
      const userData: UserData = {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        photoURL: user.photoURL,
        phoneNumber: user.phoneNumber,
        role: role,
        isEmailVerified: user.emailVerified,
        isAnonymous: false,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      // Store in Firestore
      await this.createUserData(userData);

      // Store locally
      this.userData = userData;
      await this.storeUserData(userData);

      return userData;
    } catch (error: any) {
      console.error('Registration error:', error);

      // Provide user-friendly error messages
      let errorMessage = 'Registration failed. Please try again.';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please log in or use a different email.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Sign out the current user
   */
  public async signOut(): Promise<void> {
    try {
      // Sign out from Firebase Auth
      await auth().signOut();

      // Clear tokens using tokenService
      await tokenService.clearTokens();

      // Clear user data
      this.userData = null;
      await AsyncStorage.removeItem(USER_DATA_KEY);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   * @param email User email
   */
  public async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await auth().sendPasswordResetEmail(email);
    } catch (error: any) {
      console.error('Password reset error:', error);

      let errorMessage = 'Failed to send password reset email.';

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Confirm password reset
   * @param code Reset code from email
   * @param newPassword New password
   */
  public async confirmPasswordReset(code: string, newPassword: string): Promise<void> {
    try {
      await auth().confirmPasswordReset(code, newPassword);
    } catch (error: any) {
      console.error('Confirm password reset error:', error);

      let errorMessage = 'Failed to reset password.';

      if (error.code === 'auth/invalid-action-code') {
        errorMessage = 'Invalid or expired reset code.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Refresh the access token
   * @returns New access token or null if refresh failed
   */
  public async refreshToken(): Promise<string | null> {
    try {
      const isTokenExpired = await tokenService.isTokenExpired();
      if (!isTokenExpired) {
        return tokenService.getAccessToken();
      }

      // Get current user from Firebase Auth
      const user = auth().currentUser;
      if (!user) {
        console.error('No user found when refreshing token');
        return null;
      }

      // Force refresh the token
      const newToken = await user.getIdToken(true);
      const refreshToken = user.refreshToken || '';

      // Store the new tokens
      await tokenService.setTokens(newToken, refreshToken);

      return newToken;
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  }

  /**
   * Login with QR code
   * @param qrData QR code data
   * @returns UserData
   */
  public async loginWithQRCode(qrData: string): Promise<UserData> {
    try {
      // Parse QR code data
      // Format is expected to be something like: "GUEST:UNIVERSITY:timestamp:token"
      const parts = qrData.split(':');

      if (parts.length !== 4 || parts[0] !== 'GUEST') {
        throw new Error('Invalid QR code format');
      }

      const type = parts[1];
      const timestamp = parseInt(parts[2]);
      const token = parts[3];

      // Check if QR code is expired (valid for 5 minutes)
      const now = Date.now();
      if (now - timestamp > 5 * 60 * 1000) {
        throw new Error('QR code has expired');
      }

      // Sign in with custom token (token should be created by your backend)
      try {
        const userCredential = await auth().signInWithCustomToken(token);
        const user = userCredential.user;

        // Get fresh ID token
        const idToken = await user.getIdToken(true);
        const refreshToken = user.refreshToken || '';

        // Store tokens
        await tokenService.setTokens(idToken, refreshToken);

        // Get or create user data
        let userData = await this.getUserData(user.uid);
        if (!userData) {
          userData = {
            uid: user.uid,
            email: user.email,
            displayName: `Guest (${type})`,
            photoURL: user.photoURL,
            phoneNumber: user.phoneNumber,
            role: 'guest',
            isEmailVerified: false,
            isAnonymous: true,
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          };

          await this.createUserData(userData);
        } else {
          // Update last login time
          await this.updateUserData({
            uid: user.uid,
            lastLoginAt: new Date().toISOString(),
          });
        }

        // Store locally
        this.userData = userData;
        await this.storeUserData(userData);

        return userData;
      } catch (error) {
        console.error('Error signing in with custom token:', error);
        throw new Error('Failed to authenticate with QR code');
      }
    } catch (error: any) {
      console.error('QR code login error:', error);
      throw error;
    }
  }

  /**
   * Get the current user data
   * @returns Current user data or null if not signed in
   */
  public async getCurrentUser(): Promise<UserData | null> {
    // If we already have user data in memory, return it
    if (this.userData) {
      return this.userData;
    }

    // Try to get user data from local storage
    const storedData = await this.getStoredUserData();
    if (storedData) {
      this.userData = storedData;
      return storedData;
    }

    // If we have a Firebase user but no data, fetch from Firestore
    const user = auth().currentUser;
    if (user) {
      try {
        await this.fetchUserData(user.uid);
        return this.userData;
      } catch (error) {
        console.error('Error getting current user data:', error);
        return null;
      }
    }

    return null;
  }

  /**
   * Check if current user has specified role(s)
   * @param roles Single role or array of roles to check
   * @returns True if user has at least one of the specified roles
   */
  public async hasRole(roles: UserRole | UserRole[]): Promise<boolean> {
    const userData = await this.getCurrentUser();

    if (!userData) {
      return false;
    }

    const rolesToCheck = Array.isArray(roles) ? roles : [roles];
    return rolesToCheck.includes(userData.role);
  }

  /**
   * Get the current access token
   * @returns Access token or null if not authenticated
   */
  public async getAccessToken(): Promise<string | null> {
    const isTokenExpired = await tokenService.isTokenExpired();

    if (isTokenExpired) {
      return this.refreshToken();
    }

    return tokenService.getAccessToken();
  }

  /**
   * Sign in with Google
   * @returns UserData for the authenticated user
   */
  public async signInWithGoogle(): Promise<UserData> {
    try {
      // Configure Google authentication request
      const redirectUrl = AuthSession.makeRedirectUri({ useProxy: true });
      const clientId =
        Platform.OS === 'ios'
          ? 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com' // Replace with actual iOS client ID
          : 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com'; // Replace with actual Android client ID

      // Create an AuthRequest instance
      const request = new AuthSession.AuthRequest({
        clientId,
        scopes: ['profile', 'email'],
        redirectUri: redirectUrl,
      });

      // Create a discovery document for Google OAuth
      const discovery = {
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
        revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
      };

      // Start the authentication flow
      const result = await request.promptAsync(discovery);

      if (result.type !== 'success') {
        throw new Error('Google sign in was cancelled or failed');
      }

      // Get the access token from the result
      const { params } = result;
      const accessToken = params.access_token;

      // Create a credential from the access token
      const credential = auth.GoogleAuthProvider.credential(null, accessToken);

      // Sign in to Firebase with the credential
      const userCredential = await auth().signInWithCredential(credential);
      const user = userCredential.user;

      // Get fresh ID token
      const idToken = await user.getIdToken(true);
      const refreshToken = user.refreshToken || '';

      // Store tokens using tokenService
      await tokenService.setTokens(idToken, refreshToken);

      // Get or create user data
      let userData = await this.getUserData(user.uid);
      if (!userData) {
        userData = this.firebaseUserToUserData(user);
        await this.createUserData(userData);
      }

      // Update last login time
      await this.updateUserData({
        uid: user.uid,
        lastLoginAt: new Date().toISOString(),
      });

      // Store locally
      this.userData = userData;
      await this.storeUserData(userData);

      return userData;
    } catch (error: any) {
      console.error('Google sign in error:', error);
      throw new Error('Failed to sign in with Google. Please try again.');
    }
  }

  /**
   * Store user data to local storage
   * @param userData User data to store
   */
  private async storeUserData(userData: UserData): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Error storing user data:', error);
    }
  }

  /**
   * Get user data from local storage
   * @returns User data or null if not found
   */
  private async getStoredUserData(): Promise<UserData | null> {
    try {
      const data = await AsyncStorage.getItem(USER_DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting stored user data:', error);
      return null;
    }
  }

  /**
   * Get user data from Firestore
   * @param uid User ID
   * @returns User data or null if not found
   */
  private async getUserData(uid: string): Promise<UserData | null> {
    try {
      const userDoc = await firestore().collection('users').doc(uid).get();

      if (userDoc.exists) {
        return userDoc.data() as UserData;
      } else {
        console.warn(`User document not found for ID: ${uid}`);
        return null;
      }
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  /**
   * Create a new user document in Firestore
   * @param userData User data to create
   */
  private async createUserData(userData: UserData): Promise<void> {
    try {
      await firestore().collection('users').doc(userData.uid).set({
        ...userData,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Error creating user data:', error);
      throw error;
    }
  }

  /**
   * Update user data in Firestore
   * @param userData Partial user data with UID to update
   */
  private async updateUserData(userData: Partial<UserData> & { uid: string }): Promise<void> {
    try {
      await firestore().collection('users').doc(userData.uid).update({
        ...userData,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  }

  /**
   * Convert Firebase user to UserData object
   * @param user Firebase user
   * @returns UserData object
   */
  private firebaseUserToUserData(user: FirebaseAuthTypes.User): UserData {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      phoneNumber: user.phoneNumber,
      role: 'student', // Default role
      isEmailVerified: user.emailVerified,
      isAnonymous: user.isAnonymous,
      createdAt: user.metadata.creationTime || new Date().toISOString(),
      lastLoginAt: user.metadata.lastSignInTime || new Date().toISOString(),
    };
  }

  /**
   * Check if the user is authenticated
   */
  public async isAuthenticated(): Promise<boolean> {
    return tokenService.isAuthenticated();
  }

  /**
   * Get remaining time until token expiration
   */
  public async getTokenExpiryTime(): Promise<string> {
    return tokenService.getTokenExpiryTime();
  }

  /**
   * Add a listener for auth state changes
   * @param listener Function to call when auth state changes
   * @returns Function to remove the listener
   */
  public addAuthStateListener(listener: (state: AuthState) => void): () => void {
    this.authStateListeners.push(listener);

    // Call immediately with current state
    const currentState: AuthState = {
      user: this.userData,
      initialized: true,
      isAnonymous: this.user?.isAnonymous || false,
      isAuthenticated: !!this.user,
    };

    try {
      listener(currentState);
    } catch (error) {
      console.error('Error in auth state listener:', error);
    }

    // Return function to remove listener
    return () => {
      this.authStateListeners = this.authStateListeners.filter((l) => l !== listener);
    };
  }
}

// Create and export singleton instance
const authService = new AuthService();
export default authService;