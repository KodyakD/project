import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { auth } from '../config/firebase';
import { Platform } from 'react-native';
import jwtDecode from 'jwt-decode';
import moment from 'moment';

// Storage keys
const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_ID_KEY = 'auth_user_id';
const USER_ROLE_KEY = 'auth_user_role';

// Token payload interface
interface TokenPayload {
  sub: string; // user ID
  role?: string;
  exp: number; // expiration timestamp
  iat: number; // issued at timestamp
}

/**
 * Token Service
 * Handles authentication token storage, retrieval, and refresh
 */
class TokenService {
  /**
   * Store a value securely based on platform
   */
  private async storeSecure(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Web platform uses localStorage
        localStorage.setItem(key, value);
      } else if (SecureStore.isAvailableAsync()) {
        // Use SecureStore on native if available
        await SecureStore.setItemAsync(key, value);
      } else {
        // Fallback to AsyncStorage
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error(`Error storing ${key}:`, error);
      // Fallback to AsyncStorage if SecureStore fails
      await AsyncStorage.setItem(key, value);
    }
  }

  /**
   * Get a value from secure storage based on platform
   */
  private async getSecure(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        // Web platform uses localStorage
        return localStorage.getItem(key);
      } else if (await SecureStore.isAvailableAsync()) {
        // Use SecureStore on native if available
        return await SecureStore.getItemAsync(key);
      } else {
        // Fallback to AsyncStorage
        return await AsyncStorage.getItem(key);
      }
    } catch (error) {
      console.error(`Error retrieving ${key}:`, error);
      // Fallback to AsyncStorage if SecureStore fails
      return await AsyncStorage.getItem(key);
    }
  }

  /**
   * Remove a value from secure storage based on platform
   */
  private async removeSecure(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Web platform uses localStorage
        localStorage.removeItem(key);
      } else if (await SecureStore.isAvailableAsync()) {
        // Use SecureStore on native if available
        await SecureStore.deleteItemAsync(key);
      } else {
        // Fallback to AsyncStorage
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      // Fallback to AsyncStorage if SecureStore fails
      await AsyncStorage.removeItem(key);
    }
  }

  /**
   * Set authentication tokens
   */
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      await this.storeSecure(ACCESS_TOKEN_KEY, accessToken);
      await this.storeSecure(REFRESH_TOKEN_KEY, refreshToken);

      // Decode and store user info from token
      const decodedToken = jwtDecode<TokenPayload>(accessToken);
      if (decodedToken.sub) {
        await this.storeSecure(USER_ID_KEY, decodedToken.sub);
      }
      if (decodedToken.role) {
        await this.storeSecure(USER_ROLE_KEY, decodedToken.role);
      }
    } catch (error) {
      console.error('Error setting tokens:', error);
      throw error;
    }
  }

  /**
   * Get access token
   */
  async getAccessToken(): Promise<string | null> {
    return this.getSecure(ACCESS_TOKEN_KEY);
  }

  /**
   * Get refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    return this.getSecure(REFRESH_TOKEN_KEY);
  }

  /**
   * Get user ID from stored token
   */
  async getUserId(): Promise<string | null> {
    return this.getSecure(USER_ID_KEY);
  }

  /**
   * Get user role from stored token
   */
  async getUserRole(): Promise<string | null> {
    return this.getSecure(USER_ROLE_KEY);
  }

  /**
   * Clear all tokens and related data
   */
  async clearTokens(): Promise<void> {
    try {
      await this.removeSecure(ACCESS_TOKEN_KEY);
      await this.removeSecure(REFRESH_TOKEN_KEY);
      await this.removeSecure(USER_ID_KEY);
      await this.removeSecure(USER_ROLE_KEY);
    } catch (error) {
      console.error('Error clearing tokens:', error);
      throw error;
    }
  }

  /**
   * Check if access token is expired
   * Adds a buffer of 30 seconds to account for network latency
   */
  async isTokenExpired(): Promise<boolean> {
    try {
      const token = await this.getAccessToken();
      if (!token) return true;

      const decodedToken = jwtDecode<TokenPayload>(token);
      // Add 30-second buffer to account for network delays
      const currentTime = Math.floor(Date.now() / 1000) + 30;
      
      return decodedToken.exp < currentTime;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true; // Assume expired on error
    }
  }

  /**
   * Get time until token expiration in a human-readable format
   */
  async getTokenExpiryTime(): Promise<string> {
    try {
      const token = await this.getAccessToken();
      if (!token) return 'Token not found';

      const decodedToken = jwtDecode<TokenPayload>(token);
      const expiryDate = moment.unix(decodedToken.exp);
      const now = moment();

      if (expiryDate.isBefore(now)) {
        return 'Token expired';
      }

      return expiryDate.from(now);
    } catch (error) {
      console.error('Error getting token expiry time:', error);
      return 'Unable to determine';
    }
  }

  /**
   * Check if user is authenticated based on token validity
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await this.getAccessToken();
      if (!token) return false;

      return !(await this.isTokenExpired());
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  /**
   * Get a valid access token, refreshing if necessary
   * @returns Valid access token or null if refresh fails
   */
  async getValidAccessToken(): Promise<string | null> {
    try {
      // Check if token is expired
      const isExpired = await this.isTokenExpired();
      
      if (isExpired) {
        // Token is expired, try to refresh
        const newToken = await this.refreshAccessToken();
        return newToken;
      }
      
      // Token is still valid
      return this.getAccessToken();
    } catch (error) {
      console.error('Error getting valid access token:', error);
      return null;
    }
  }

  /**
   * Refresh the access token using the refresh token
   * @returns New access token or null if refresh fails
   */
  async refreshAccessToken(): Promise<string | null> {
    try {
      const user = auth().currentUser;
      
      if (!user) {
        console.warn('No user found when refreshing token');
        return null;
      }
      
      // Force refresh the Firebase ID token
      const newToken = await user.getIdToken(true);
      
      if (newToken) {
        // Get token expiration info
        const idTokenResult = await user.getIdTokenResult();
        const expiresIn = new Date(idTokenResult.expirationTime).getTime() - Date.now();
        const expiryInSeconds = expiresIn > 0 ? expiresIn / 1000 : 3600; // Default to 1 hour if token already expired
        
        // Store the new token
        await this.setTokens(
          newToken,
          user.refreshToken || ''
        );
        
        return newToken;
      }
      
      return null;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      return null;
    }
  }

  // Decode JWT token
  decodeToken(token: string): TokenPayload | null {
    try {
      return jwtDecode<TokenPayload>(token);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  // Calculate expiry time from token
  getTokenExpiry(token: string): Date | null {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded) return null;
      
      return new Date(decoded.exp * 1000);
    } catch (error) {
      console.error('Error getting token expiry:', error);
      return null;
    }
  }

  // Get token remaining time in human-readable format
  async getTokenRemainingTime(): Promise<string> {
    try {
      const token = await this.getAccessToken();
      if (!token) return 'Token expired';
      
      const decoded = this.decodeToken(token);
      if (!decoded) return 'Invalid token';
      
      const expiryTime = decoded.exp * 1000;
      const currentTime = Date.now();
      
      if (currentTime >= expiryTime) {
        return 'Token expired';
      }
      
      // Format remaining time
      const duration = moment.duration(expiryTime - currentTime);
      if (duration.asHours() >= 1) {
        return `${Math.floor(duration.asHours())}h ${duration.minutes()}m remaining`;
      } else if (duration.asMinutes() >= 1) {
        return `${Math.floor(duration.asMinutes())}m ${duration.seconds()}s remaining`;
      } else {
        return `${Math.floor(duration.asSeconds())}s remaining`;
      }
    } catch (error) {
      console.error('Error calculating token remaining time:', error);
      return 'Error calculating time';
    }
  }
}

// Export a singleton instance
const tokenService = new TokenService();
export default tokenService;