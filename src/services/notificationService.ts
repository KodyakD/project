import { Platform, PermissionsAndroid } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import authService from './authService';
import { Linking } from 'react-native';
import Constants from 'expo-constants';

// Notification token storage key
const NOTIFICATION_TOKEN_KEY = 'notification_token';

// Topic constants
export const NOTIFICATION_TOPICS = {
  EMERGENCY_ALERTS: 'emergency_alerts',
  GENERAL_ANNOUNCEMENTS: 'general_announcements',
  MAINTENANCE_UPDATES: 'maintenance_updates',
  INCIDENT_UPDATES: 'incident_updates',
};

// Notification types
export type NotificationType = 
  | 'emergency'
  | 'incident_assigned'
  | 'incident_updated'
  | 'incident_resolved'
  | 'system_announcement'
  | 'maintenance_alert'
  | 'user_mention';

// Notification data structure
export interface NotificationData {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  createdAt: string;
  read: boolean;
  data?: Record<string, any>;
}

/**
 * NotificationService
 * Manages push notifications, permissions, and token registration
 */
class NotificationService {
  private initialized = false;

  /**
   * Initialize the notification service
   * Sets up notification handlers and permissions
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Configure notification appearance for iOS
      await this.configureNotifications();

      // Request permissions on device
      await this.requestPermissions();

      // Get and store Expo Notifications token
      await this.getAndStoreToken();

      // Set up notification listeners
      this.setupNotificationListeners();

      this.initialized = true;
    } catch (error) {
      console.error('Error initializing notification service:', error);
    }
  }

  /**
   * Configure notifications appearance
   */
  private async configureNotifications(): Promise<void> {
    // Set notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Configure for iOS
    if (Platform.OS === 'ios') {
      await Notifications.setNotificationCategoryAsync('emergency', [
        {
          identifier: 'acknowledge',
          buttonTitle: 'Acknowledge',
          options: {
            isDestructive: false,
            isAuthenticationRequired: false,
          },
        },
        {
          identifier: 'view',
          buttonTitle: 'View Details',
          options: {
            isDestructive: false,
            isAuthenticationRequired: false,
          },
        },
      ]);
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      // For Android 13+ (API level 33)
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      
      // For older Android versions
      return true;
    } 
    
    // For iOS
    if (Platform.OS === 'ios') {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowCriticalAlerts: true,
          },
        });
        finalStatus = status;
      }
      
      return finalStatus === 'granted';
    }
    
    return false;
  }

  /**
   * Get and store Expo Push Notification token
   */
  async getAndStoreToken(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.log('Push notifications not available on simulator/emulator');
        return null;
      }
      
      let token = await AsyncStorage.getItem(NOTIFICATION_TOKEN_KEY);
      
      if (!token) {
        // Get Expo push token
        const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });
        
        if (expoPushToken) {
          // Store locally
          await AsyncStorage.setItem(NOTIFICATION_TOKEN_KEY, expoPushToken);
          token = expoPushToken;
          
          // Register token with user profile if authenticated
          const currentUser = await authService.getCurrentUser();
          if (currentUser) {
            await this.registerTokenWithUser(currentUser.uid, expoPushToken);
          }
        }
      }
      
      return token;
    } catch (error) {
      console.error('Error getting/storing notification token:', error);
      return null;
    }
  }

  /**
   * Register token with user in Firestore
   */
  async registerTokenWithUser(userId: string, token: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        // Get existing tokens
        const userData = userDoc.data();
        const tokens = userData?.notificationTokens || [];
        
        // Only add token if it's not already registered
        if (!tokens.includes(token)) {
          await updateDoc(userRef, {
            notificationTokens: arrayUnion(token),
            updatedAt: serverTimestamp(),
          });
        }
      }
    } catch (error) {
      console.error('Error registering notification token with user:', error);
    }
  }

  /**
   * Unregister token from user in Firestore
   */
  async unregisterTokenFromUser(userId: string, token: string): Promise<void> {
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
      console.error('Error unregistering token from user profile:', error);
    }
  }

  /**
   * Set up notification listeners
   */
  private setupNotificationListeners(): void {
    // Listen for notifications received while app is in foreground
    Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground:', notification);
      
      // Store notification in local history
      this.storeNotification({
        notification: {
          title: notification.request.content.title,
          body: notification.request.content.body,
        },
        data: notification.request.content.data,
      });
    });
    
    // Listen for notification interactions (user tapped notification)
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response received:', response);
      
      const { notification } = response;
      const data = notification.request.content.data;
      
      // Mark notification as read if it has an ID
      if (data.notificationId) {
        this.markNotificationAsRead(data.notificationId as string);
      }
      
      // Handle navigation
      this.handleNotificationNavigation({
        data,
        notification: {
          title: notification.request.content.title,
          body: notification.request.content.body,
        }
      });
    });
  }

  /**
   * Show a local notification
   */
  async showLocalNotification(
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error showing local notification:', error);
    }
  }

  /**
   * Store a notification in local history
   */
  private async storeNotification(remoteMessage: any): Promise<void> {
    try {
      const notificationId = remoteMessage.data?.notificationId || `notification_${Date.now()}`;
      
      const notification: NotificationData = {
        id: notificationId,
        title: remoteMessage.notification?.title || 'New Notification',
        body: remoteMessage.notification?.body || '',
        type: (remoteMessage.data?.type as NotificationType) || 'system_announcement',
        createdAt: new Date().toISOString(),
        read: false,
        data: remoteMessage.data || {},
      };
      
      // Get existing notifications
      const existingNotificationsJson = await AsyncStorage.getItem('notifications');
      const existingNotifications: NotificationData[] = existingNotificationsJson 
        ? JSON.parse(existingNotificationsJson) 
        : [];
      
      // Add new notification to the beginning of the array
      const updatedNotifications = [notification, ...existingNotifications];
      
      // Limit to 50 notifications to prevent storage overflow
      const limitedNotifications = updatedNotifications.slice(0, 50);
      
      await AsyncStorage.setItem('notifications', JSON.stringify(limitedNotifications));
    } catch (error) {
      console.error('Error storing notification:', error);
    }
  }

  /**
   * Mark a notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const existingNotificationsJson = await AsyncStorage.getItem('notifications');
      if (!existingNotificationsJson) return;
      
      const notifications: NotificationData[] = JSON.parse(existingNotificationsJson);
      
      const updatedNotifications = notifications.map(notification => {
        if (notification.id === notificationId) {
          return { ...notification, read: true };
        }
        return notification;
      });
      
      await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsAsRead(): Promise<void> {
    try {
      const existingNotificationsJson = await AsyncStorage.getItem('notifications');
      if (!existingNotificationsJson) return;
      
      const notifications: NotificationData[] = JSON.parse(existingNotificationsJson);
      
      const updatedNotifications = notifications.map(notification => ({
        ...notification,
        read: true,
      }));
      
      await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  /**
   * Get all notifications
   */
  async getNotifications(): Promise<NotificationData[]> {
    try {
      const notificationsJson = await AsyncStorage.getItem('notifications');
      return notificationsJson ? JSON.parse(notificationsJson) : [];
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    try {
      await AsyncStorage.setItem('notifications', JSON.stringify([]));
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  /**
   * Handle notification navigation with improved deep linking
   */
  private handleNotificationNavigation(remoteMessage: any): void {
    try {
      if (!remoteMessage?.data) return;
      
      const { type, ...data } = remoteMessage.data;
      
      // Generate app route based on notification type
      let route = '';
      
      switch (type) {
        case 'emergency':
          route = `/emergency/${data.emergencyId}`;
          break;
        case 'incident_assigned':
        case 'incident_updated':
        case 'incident_resolved':
          route = `/incidents/${data.incidentId}`;
          break;
        case 'maintenance_alert':
          route = `/maintenance/${data.maintenanceId}`;
          break;
        case 'system_announcement':
          route = `/announcements/${data.announcementId}`;
          break;
        case 'user_mention':
          route = `/chat/${data.chatId}`;
          break;
        default:
          // For unknown notification types, navigate to the notification center
          route = '/notifications';
      }
      
      // Store the navigation target for later use
      this.storeNavigationTarget(type, data, route);
      
      // For testing purposes in development, trigger deep link directly
      if (__DEV__) {
        const url = `firerescueexpert://${route.startsWith('/') ? route.substring(1) : route}`;
        console.log('Triggering deep link:', url);
        Linking.openURL(url).catch(err => console.error('Error opening URL:', err));
      }
    } catch (error) {
      console.error('Error handling notification navigation:', error);
    }
  }

  /**
   * Store navigation target with enhanced context
   */
  private async storeNavigationTarget(
    type: string, 
    data: any, 
    route: string
  ): Promise<void> {
    try {
      // Store the complete navigation context for a richer experience
      const navigationContext = {
        route,
        type,
        data,
        timestamp: new Date().toISOString()
      };
      
      // Store both the route (for backward compatibility) and the rich context
      await AsyncStorage.setItem('notification_navigation', route);
      await AsyncStorage.setItem('notification_navigation_context', JSON.stringify(navigationContext));
      
      console.log(`Stored navigation target: ${route}`);
    } catch (error) {
      console.error('Error storing navigation target:', error);
    }
  }

  /**
   * Get and clear navigation target with full context
   */
  async getAndClearNavigationTarget(): Promise<string | null> {
    try {
      const route = await AsyncStorage.getItem('notification_navigation');
      
      // Also retrieve the rich context
      const contextJson = await AsyncStorage.getItem('notification_navigation_context');
      const context = contextJson ? JSON.parse(contextJson) : null;
      
      // Store in memory for potential use in the destination screen
      if (context) {
        (this as any).lastNavigationContext = context;
      }
      
      // Clear stored navigation target
      await AsyncStorage.removeItem('notification_navigation');
      await AsyncStorage.removeItem('notification_navigation_context');
      
      return route;
    } catch (error) {
      console.error('Error getting/clearing navigation target:', error);
      return null;
    }
  }

  /**
   * Get the last navigation context (for use by screens that need more data)
   */
  getLastNavigationContext(): any {
    return (this as any).lastNavigationContext || null;
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const notificationsJson = await AsyncStorage.getItem('notifications');
      
      if (!notificationsJson) {
        return 0;
      }
      
      const notifications: NotificationData[] = JSON.parse(notificationsJson);
      return notifications.filter(notification => !notification.read).length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }
}

// Export singleton instance
const notificationService = new NotificationService();
export default notificationService;