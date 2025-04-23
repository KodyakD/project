import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import notificationService from '../services/notificationService';
import authService from '../services/authService';

// Mock dependencies
jest.mock('@react-native-firebase/messaging', () => {
  return () => ({
    requestPermission: jest.fn(() => Promise.resolve()),
    hasPermission: jest.fn(() => Promise.resolve(true)),
    getToken: jest.fn(() => Promise.resolve('mock-fcm-token')),
    registerDeviceForRemoteMessages: jest.fn(() => Promise.resolve()),
    onMessage: jest.fn(() => () => {}),
    onNotificationOpenedApp: jest.fn(() => () => {}),
    getInitialNotification: jest.fn(() => Promise.resolve(null)),
    onTokenRefresh: jest.fn(() => () => {}),
    subscribeToTopic: jest.fn(() => Promise.resolve()),
    unsubscribeFromTopic: jest.fn(() => Promise.resolve()),
    setForegroundNotificationPresentationOptions: jest.fn(() => Promise.resolve()),
  });
});

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve()),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  AndroidNotificationPriority: {
    HIGH: 'high',
  },
  setNotificationCategoryAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
    Version: 31,
  },
  PermissionsAndroid: {
    request: jest.fn(() => Promise.resolve('granted')),
    PERMISSIONS: {
      POST_NOTIFICATIONS: 'android.permission.POST_NOTIFICATIONS',
    },
    RESULTS: {
      GRANTED: 'granted',
    },
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../config/firebase', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({
          exists: true,
          data: jest.fn(() => ({
            fcmTokens: ['old-token'],
          })),
        })),
        update: jest.fn(() => Promise.resolve()),
      })),
    })),
  })),
  FieldValue: {
    serverTimestamp: jest.fn(),
  },
}));

jest.mock('../services/authService', () => ({
  getCurrentUser: jest.fn(() => Promise.resolve({
    uid: 'test-user-id',
    email: 'test@example.com',
    role: 'technical_expert',
  })),
}));

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  // Reset AsyncStorage mock implementation
  (AsyncStorage.getItem as jest.Mock).mockImplementation(() => Promise.resolve(null));
  (AsyncStorage.setItem as jest.Mock).mockImplementation(() => Promise.resolve());
  (AsyncStorage.removeItem as jest.Mock).mockImplementation(() => Promise.resolve());
});

describe('NotificationService', () => {
  describe('initialize', () => {
    it('should initialize notification service', async () => {
      await notificationService.initialize();
      
      // Check if notification handler is set
      expect(Notifications.setNotificationHandler).toHaveBeenCalled();
      
      // Check if permissions are requested
      expect(notificationService.requestPermissions).toBeDefined();
    });

    it('should only initialize once', async () => {
      await notificationService.initialize();
      await notificationService.initialize();
      
      // Notification handler should be set only once
      expect(Notifications.setNotificationHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAndStoreFCMToken', () => {
    it('should get and store a new FCM token', async () => {
      // Mock AsyncStorage to simulate no existing token
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      
      const token = await notificationService.getAndStoreFCMToken();
      
      // Check if token is returned
      expect(token).toBe('mock-fcm-token');
      
      // Check if token is stored
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('fcm_token', 'mock-fcm-token');
      
      // Check if token is registered with user
      expect(authService.getCurrentUser).toHaveBeenCalled();
    });

    it('should return existing token if available', async () => {
      // Mock AsyncStorage to simulate existing token
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('existing-token');
      
      const token = await notificationService.getAndStoreFCMToken();
      
      // Check if existing token is returned
      expect(token).toBe('existing-token');
      
      // Storage should not be called with a new token
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('notifications storage', () => {
    it('should store notifications', async () => {
      const mockRemoteMessage = {
        notification: {
          title: 'Test Notification',
          body: 'This is a test notification',
        },
        data: {
          type: 'system_announcement',
          notificationId: 'test-id',
        },
      };
      
      // Call private method using any type casting
      await (notificationService as any).storeNotification(mockRemoteMessage);
      
      // Check if notification is stored in AsyncStorage
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('notifications', expect.any(String));
      
      // Parse the stored JSON to check contents
      const storedJson = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
      const stored = JSON.parse(storedJson);
      
      // Check stored notification properties
      expect(stored).toBeInstanceOf(Array);
      expect(stored[0].id).toBe('test-id');
      expect(stored[0].title).toBe('Test Notification');
      expect(stored[0].body).toBe('This is a test notification');
      expect(stored[0].type).toBe('system_announcement');
      expect(stored[0].read).toBe(false);
    });

    it('should mark notification as read', async () => {
      // Mock existing notifications
      const mockNotifications = [
        {
          id: 'notification-1',
          title: 'Test 1',
          body: 'Body 1',
          type: 'system_announcement',
          createdAt: new Date().toISOString(),
          read: false,
        },
        {
          id: 'notification-2',
          title: 'Test 2',
          body: 'Body 2',
          type: 'emergency',
          createdAt: new Date().toISOString(),
          read: false,
        },
      ];
      
      // Setup mock for existing notifications
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockNotifications));
      
      // Mark notification as read
      await notificationService.markNotificationAsRead('notification-1');
      
      // Check if AsyncStorage was updated
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('notifications', expect.any(String));
      
      // Parse the stored JSON to check contents
      const storedJson = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
      const stored = JSON.parse(storedJson);
      
      // First notification should be marked as read
      expect(stored[0].read).toBe(true);
      // Second notification should still be unread
      expect(stored[1].read).toBe(false);
    });

    it('should mark all notifications as read', async () => {
      // Mock existing notifications
      const mockNotifications = [
        {
          id: 'notification-1',
          title: 'Test 1',
          body: 'Body 1',
          type: 'system_announcement',
          createdAt: new Date().toISOString(),
          read: false,
        },
        {
          id: 'notification-2',
          title: 'Test 2',
          body: 'Body 2',
          type: 'emergency',
          createdAt: new Date().toISOString(),
          read: false,
        },
      ];
      
      // Setup mock for existing notifications
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockNotifications));
      
      // Mark all notifications as read
      await notificationService.markAllNotificationsAsRead();
      
      // Check if AsyncStorage was updated
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('notifications', expect.any(String));
      
      // Parse the stored JSON to check contents
      const storedJson = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
      const stored = JSON.parse(storedJson);
      
      // All notifications should be marked as read
      expect(stored[0].read).toBe(true);
      expect(stored[1].read).toBe(true);
    });

    it('should get unread count', async () => {
      // Mock existing notifications with one read and one unread
      const mockNotifications = [
        {
          id: 'notification-1',
          title: 'Test 1',
          body: 'Body 1',
          type: 'system_announcement',
          createdAt: new Date().toISOString(),
          read: true,
        },
        {
          id: 'notification-2',
          title: 'Test 2',
          body: 'Body 2',
          type: 'emergency',
          createdAt: new Date().toISOString(),
          read: false,
        },
      ];
      
      // Setup mock for existing notifications
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockNotifications));
      
      // Get unread count
      const count = await notificationService.getUnreadCount();
      
      // Should be 1 unread notification
      expect(count).toBe(1);
    });

    it('should return 0 unread count when no notifications exist', async () => {
      // Mock empty notifications
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      
      // Get unread count
      const count = await notificationService.getUnreadCount();
      
      // Should be 0 unread notifications
      expect(count).toBe(0);
    });
  });

  describe('notification navigation', () => {
    it('should store and retrieve navigation target', async () => {
      // Store navigation target
      await (notificationService as any).storeNavigationTarget('emergency', { emergencyId: 'emergency-123' });
      
      // Check if target was stored
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('notification_navigation', '/emergency/emergency-123');
      
      // Setup mock for retrieval
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('/emergency/emergency-123');
      
      // Get and clear navigation target
      const target = await notificationService.getAndClearNavigationTarget();
      
      // Check if correct target was returned
      expect(target).toBe('/emergency/emergency-123');
      
      // Check if target was cleared
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('notification_navigation');
    });

    it('should handle incident navigation target', async () => {
      // Store navigation target for incident
      await (notificationService as any).storeNavigationTarget('incident_updated', { incidentId: 'incident-456' });
      
      // Check if target was stored with correct path
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('notification_navigation', '/incidents/incident-456');
    });
  });

  describe('local notifications', () => {
    it('should schedule a local notification', async () => {
      await notificationService.showLocalNotification('Test Title', 'Test Body', { key: 'value' });
      
      // Check if notification was scheduled
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'Test Title',
          body: 'Test Body',
          data: { key: 'value' },
          sound: 'default',
          priority: 'high',
        },
        trigger: null, // Show immediately
      });
    });
  });
}); 