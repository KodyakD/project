import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import * as Device from 'expo-device';

// Storage key for token
const FCM_TOKEN_KEY = 'notification_token';

// Topics for notifications - maintaining compatibility with the original API
export const FCM_TOPICS = {
  ALL_USERS: 'all_users',
  EMERGENCY_ALERTS: 'emergency_alerts',
  INCIDENT_UPDATES: 'incident_updates',
  MAINTENANCE_ALERTS: 'maintenance_alerts',
  SYSTEM_ANNOUNCEMENTS: 'system_announcements',
};

/**
 * Firebase Cloud Messaging Service (Using Expo Notifications)
 * This is a drop-in replacement for the FCM service that uses Expo Notifications instead
 */
class FCMService {
  private initialized = false;
  
  /**
   * Initialize notification service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Configure notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
      
      // Request permissions
      if (Platform.OS === 'ios') {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        
        if (existingStatus !== 'granted') {
          await Notifications.requestPermissionsAsync({
            ios: {
              allowAlert: true,
              allowBadge: true,
              allowSound: true,
            },
          });
        }
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing FCM service:', error);
    }
  }
  
  /**
   * Get current token
   */
  async getToken(): Promise<string | null> {
    try {
      // First try to get from storage
      let token = await AsyncStorage.getItem(FCM_TOKEN_KEY);
      
      // If not found, request new token
      if (!token) {
        token = await this.generateToken();
      }
      
      return token;
    } catch (error) {
      console.error('Error getting notification token:', error);
      return null;
    }
  }
  
  /**
   * Generate a new token
   */
  async generateToken(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.log('Push notifications not available on simulator/emulator');
        return null;
      }
      
      // Get Expo push token
      const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      
      if (expoPushToken) {
        // Store locally
        await AsyncStorage.setItem(FCM_TOKEN_KEY, expoPushToken);
        return expoPushToken;
      }
      
      return null;
    } catch (error) {
      console.error('Error generating notification token:', error);
      return null;
    }
  }
  
  /**
   * Save token to user's profile in Firestore
   */
  async saveTokenToUser(userId: string, token: string): Promise<void> {
    if (!userId || !token) return;
    
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        // Get existing tokens
        const userData = userDoc.data();
        const tokens = userData?.notificationTokens || [];
        
        // Only add if not already present
        if (!tokens.includes(token)) {
          await updateDoc(userRef, {
            notificationTokens: arrayUnion(token),
            updatedAt: serverTimestamp(),
          });
        }
      }
    } catch (error) {
      console.error('Error saving notification token to user profile:', error);
    }
  }
  
  /**
   * Remove token from user's profile in Firestore
   */
  async removeTokenFromUser(userId: string, token: string): Promise<void> {
    if (!userId || !token) return;
    
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        await updateDoc(userRef, {
          notificationTokens: arrayRemove(token),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error removing notification token from user profile:', error);
    }
  }
  
  /**
   * Update token in Firestore for the current user
   * This is a stub for API compatibility - actual token refresh is handled by Expo
   */
  private async updateTokenInFirestore(token: string): Promise<void> {
    // This method is kept for API compatibility
    console.log('Token updated:', token);
  }
  
  /**
   * Subscribe to a topic (stub for API compatibility)
   * Note: Topic subscription is not directly supported in Expo Notifications
   * but we maintain the API for compatibility
   */
  async subscribeToTopic(topic: string): Promise<void> {
    // Store subscribed topics in AsyncStorage for API compatibility
    try {
      const topicsJson = await AsyncStorage.getItem('notification_topics');
      const topics = topicsJson ? JSON.parse(topicsJson) : [];
      
      if (!topics.includes(topic)) {
        topics.push(topic);
        await AsyncStorage.setItem('notification_topics', JSON.stringify(topics));
      }
      
      console.log(`Subscribed to topic: ${topic} (simulated)`);
    } catch (error) {
      console.error(`Error subscribing to topic ${topic}:`, error);
    }
  }
  
  /**
   * Unsubscribe from a topic (stub for API compatibility)
   */
  async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      const topicsJson = await AsyncStorage.getItem('notification_topics');
      const topics = topicsJson ? JSON.parse(topicsJson) : [];
      
      const updatedTopics = topics.filter((t: string) => t !== topic);
      await AsyncStorage.setItem('notification_topics', JSON.stringify(updatedTopics));
      
      console.log(`Unsubscribed from topic: ${topic} (simulated)`);
    } catch (error) {
      console.error(`Error unsubscribing from topic ${topic}:`, error);
    }
  }
  
  /**
   * Clean up service - remove token and unsubscribe from topics
   */
  async cleanup(): Promise<void> {
    try {
      // Remove token from storage
      await AsyncStorage.removeItem(FCM_TOKEN_KEY);
      
      // Clear subscribed topics
      await AsyncStorage.removeItem('notification_topics');
    } catch (error) {
      console.error('Error cleaning up notification service:', error);
    }
  }
}

// Export a singleton instance
export const fcmService = new FCMService();
export default fcmService;