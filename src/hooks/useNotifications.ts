import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import notificationService, { NotificationData, NOTIFICATION_TOPICS } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';

/**
 * Custom hook for handling notifications in the app
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const router = useRouter();
  const { user } = useAuth();

  /**
   * Initialize the notification service
   */
  const initialize = useCallback(async () => {
    if (isInitialized) return;
    
    try {
      setLoading(true);
      
      // Initialize the notification service
      await notificationService.initialize();
      
      // Load notifications
      await loadNotifications();
      
      // Check for pending navigation
      await checkPendingNavigation();
      
      // Subscribe to relevant topics based on user role
      if (user) {
        // All users get general announcements
        await notificationService.subscribeToTopic(NOTIFICATION_TOPICS.GENERAL_ANNOUNCEMENTS);
        
        // Technical experts get incident updates
        if (user.role === 'technical_expert') {
          await notificationService.subscribeToTopic(NOTIFICATION_TOPICS.INCIDENT_UPDATES);
        }
        
        // All staff and admins get maintenance updates
        if (['staff', 'admin', 'technical_expert'].includes(user.role)) {
          await notificationService.subscribeToTopic(NOTIFICATION_TOPICS.MAINTENANCE_UPDATES);
        }
        
        // Everyone gets emergency alerts
        await notificationService.subscribeToTopic(NOTIFICATION_TOPICS.EMERGENCY_ALERTS);
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user, isInitialized]);

  /**
   * Load notifications from storage
   */
  const loadNotifications = useCallback(async () => {
    try {
      const result = await notificationService.getNotifications();
      setNotifications(result);
      
      // Update unread count
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, []);

  /**
   * Check for pending navigation from notification
   */
  const checkPendingNavigation = useCallback(async () => {
    try {
      const navigationTarget = await notificationService.getAndClearNavigationTarget();
      
      if (navigationTarget) {
        router.push(navigationTarget);
      }
    } catch (error) {
      console.error('Error checking pending navigation:', error);
    }
  }, [router]);

  /**
   * Mark a notification as read
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markNotificationAsRead(notificationId);
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      // Update unread count
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllNotificationsAsRead();
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
      
      // Update unread count
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  /**
   * Clear all notifications
   */
  const clearAll = useCallback(async () => {
    try {
      await notificationService.clearAllNotifications();
      
      // Update local state
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }, []);

  /**
   * Show a local notification
   */
  const showLocalNotification = useCallback(async (
    title: string,
    body: string,
    data?: Record<string, any>
  ) => {
    try {
      await notificationService.showLocalNotification(title, body, data);
    } catch (error) {
      console.error('Error showing local notification:', error);
    }
  }, []);

  /**
   * Subscribe to a notification topic
   */
  const subscribeTopic = useCallback(async (topic: string) => {
    try {
      await notificationService.subscribeToTopic(topic);
    } catch (error) {
      console.error(`Error subscribing to topic ${topic}:`, error);
    }
  }, []);

  /**
   * Unsubscribe from a notification topic
   */
  const unsubscribeTopic = useCallback(async (topic: string) => {
    try {
      await notificationService.unsubscribeFromTopic(topic);
    } catch (error) {
      console.error(`Error unsubscribing from topic ${topic}:`, error);
    }
  }, []);

  /**
   * Refresh notifications
   */
  const refreshNotifications = useCallback(async () => {
    try {
      setLoading(true);
      await loadNotifications();
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [loadNotifications]);

  // Initialize notifications when auth state changes
  useEffect(() => {
    if (user) {
      initialize();
    }
  }, [user, initialize]);

  // Refresh notification count every 60 seconds
  useEffect(() => {
    if (!isInitialized) return;
    
    const refreshInterval = setInterval(async () => {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    }, 60000);
    
    return () => clearInterval(refreshInterval);
  }, [isInitialized]);

  return {
    notifications,
    unreadCount,
    loading,
    isInitialized,
    markAsRead,
    markAllAsRead,
    clearAll,
    refreshNotifications,
    showLocalNotification,
    subscribeTopic,
    unsubscribeTopic,
  };
}

export default useNotifications;