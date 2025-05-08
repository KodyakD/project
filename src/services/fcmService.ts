import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
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
 * Firebase Cloud Messaging Service
 * Combines React Native Firebase Messaging with Expo Notifications for better UX
 */
class FCMService {
  private initialized = false;
  
  /**
   * Initialize notification service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Configure notification handler for Expo Notifications
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
      
      // Request permissions for both Firebase Messaging and Expo Notifications
      if (Platform.OS === 'ios') {
        // iOS needs explicit permission request
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
        
        // Also request permission for Firebase Messaging
        await messaging().requestPermission();
      } else {
        // Android permissions for Firebase Messaging
        await messaging().requestPermission();
      }
      
      // Set foreground notification presentation options
      await messaging().setAutoInitEnabled(true);
      
      // Register handlers for Firebase Messaging events
      messaging().onMessage(async remoteMessage => {
        console.log('FCM message received in foreground:', remoteMessage);
        
        // Show notification using Expo Notifications when app is in foreground
        if (remoteMessage.notification) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: remoteMessage.notification.title || 'New Notification',
              body: remoteMessage.notification.body || '',
              data: remoteMessage.data || {},
            },
            trigger: null, // null means show immediately
          });
        }
      });
      
      // Handle background/quit state notifications
      messaging().setBackgroundMessageHandler(async remoteMessage => {
        console.log('FCM message received in background:', remoteMessage);
        return Promise.resolve();
      });
      
      // Get initial notification if app was opened from a quit state
      messaging()
        .getInitialNotification()
        .then(remoteMessage => {
          if (remoteMessage) {
            console.log('App opened from quit state by notification:', remoteMessage);
          }
        });
      
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
      
      let token: string | null = null;
      
      // Try to get Firebase Cloud Messaging token first
      try {
        // Ensure iOS devices are registered for remote notifications
        if (Platform.OS === 'ios') {
          await messaging().registerDeviceForRemoteMessages();
        }
        
        // Get FCM token
        token = await messaging().getToken();
      } catch (fcmError) {
        console.warn('Could not get FCM token, falling back to Expo Push Token', fcmError);
        
        // Fallback to Expo Push Token if FCM fails
        const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });
        
        token = expoPushToken;
      }
      
      if (token) {
        // Store token locally
        await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
        return token;
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
      const userRef = firestore().collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (userDoc.exists) {
        // Get existing tokens
        const userData = userDoc.data();
        const tokens = userData?.notificationTokens || [];
        
        // Only add if not already present
        if (!tokens.includes(token)) {
          await userRef.update({
            notificationTokens: firestore.FieldValue.arrayUnion(token),
            updatedAt: firestore.FieldValue.serverTimestamp(),
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
      const userRef = firestore().collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (userDoc.exists) {
        await userRef.update({
          notificationTokens: firestore.FieldValue.arrayRemove(token),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error removing notification token from user profile:', error);
    }
  }
  
  /**
   * Update token in Firestore for the current user
   */
  private async updateTokenInFirestore(token: string): Promise<void> {
    try {
      // Store the token for later reference
      await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
      console.log('Token updated:', token);
    } catch (error) {
      console.error('Error updating token in storage:', error);
    }
  }
  
  /**
   * Subscribe to a topic
   */
  async subscribeToTopic(topic: string): Promise<void> {
    try {
      // Actually subscribe to the FCM topic
      await messaging().subscribeToTopic(topic);
      
      // Also store in AsyncStorage for reference
      const topicsJson = await AsyncStorage.getItem('notification_topics');
      const topics = topicsJson ? JSON.parse(topicsJson) : [];
      
      if (!topics.includes(topic)) {
        topics.push(topic);
        await AsyncStorage.setItem('notification_topics', JSON.stringify(topics));
      }
      
      console.log(`Subscribed to topic: ${topic}`);
    } catch (error) {
      console.error(`Error subscribing to topic ${topic}:`, error);
    }
  }
  
  /**
   * Unsubscribe from a topic
   */
  async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      // Actually unsubscribe from the FCM topic
      await messaging().unsubscribeFromTopic(topic);
      
      // Also update in AsyncStorage for reference
      const topicsJson = await AsyncStorage.getItem('notification_topics');
      const topics = topicsJson ? JSON.parse(topicsJson) : [];
      
      const updatedTopics = topics.filter((t: string) => t !== topic);
      await AsyncStorage.setItem('notification_topics', JSON.stringify(updatedTopics));
      
      console.log(`Unsubscribed from topic: ${topic}`);
    } catch (error) {
      console.error(`Error unsubscribing from topic ${topic}:`, error);
    }
  }
  
  /**
   * Get subscribed topics
   */
  async getSubscribedTopics(): Promise<string[]> {
    try {
      const topicsJson = await AsyncStorage.getItem('notification_topics');
      return topicsJson ? JSON.parse(topicsJson) : [];
    } catch (error) {
      console.error('Error getting subscribed topics:', error);
      return [];
    }
  }
  
  /**
   * Check if subscribed to a topic
   */
  async isSubscribedToTopic(topic: string): Promise<boolean> {
    try {
      const topics = await this.getSubscribedTopics();
      return topics.includes(topic);
    } catch (error) {
      console.error(`Error checking subscription to topic ${topic}:`, error);
      return false;
    }
  }
  
  /**
   * Send a local notification for testing
   */
  async sendLocalNotification(
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
        },
        trigger: null, // null means show immediately
      });
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  }
  
  /**
   * Clean up service - remove token and unsubscribe from topics
   */
  async cleanup(): Promise<void> {
    try {
      // Get the current FCM token
      const token = await AsyncStorage.getItem(FCM_TOKEN_KEY);
      
      if (token) {
        // Attempt to delete the token from FCM
        await messaging().deleteToken();
      }
      
      // Get subscribed topics and unsubscribe
      const topics = await this.getSubscribedTopics();
      for (const topic of topics) {
        await messaging().unsubscribeFromTopic(topic);
      }
      
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