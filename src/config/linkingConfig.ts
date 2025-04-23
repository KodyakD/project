import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';

/**
 * Deep linking configuration for the app
 * Handles universal links and app scheme links
 */
const linkingConfig: LinkingOptions<any> = {
  prefixes: [
    // App scheme
    'firerescueexpert://',
    // Universal link domains
    'https://firerescue.example.com',
    'https://*.firerescue.example.com'
  ],
  // Configure how deep links map to screens
  config: {
    screens: {
      // Tab screens
      '(tabs)': {
        screens: {
          home: 'home',
          map: 'map',
          incidents: 'incidents',
          notifications: 'notifications',
          profile: 'profile',
        },
      },
      // Modal screens
      'incident-details': {
        path: 'incidents/:id',
        parse: {
          id: (id: string) => id,
        },
      },
      'emergency-details': {
        path: 'emergency/:id',
        parse: {
          id: (id: string) => id,
        },
      },
      'notification-details': {
        path: 'notification/:id',
        parse: {
          id: (id: string) => id,
        },
      },
      'maintenance-details': {
        path: 'maintenance/:id',
        parse: {
          id: (id: string) => id,
        },
      },
      // Auth screens
      'sign-in': 'login',
      'sign-up': 'register',
      'forgot-password': 'forgot-password',
      // Other screens
      settings: {
        path: 'settings/:screen?',
        parse: {
          screen: (screen: string) => screen,
        },
        screens: {
          notifications: 'notifications',
          account: 'account',
          appearance: 'appearance',
          privacy: 'privacy',
          accessibility: 'accessibility',
        },
      },
    },
  },
  // Custom function to get the URL that opened the app
  getInitialURL: async () => {
    // Check if app was opened from a deep link
    const url = await Linking.getInitialURL();
    
    if (url !== null) {
      return url;
    }
    
    // Check if there is a pending notification URL from cold start
    // This gets any stored navigation target from notification service
    try {
      const notificationService = await import('../services/notificationService');
      const pendingUrl = await notificationService.default.getAndClearNavigationTarget();
      
      if (pendingUrl) {
        // Convert the internal path to a proper URL with our scheme
        return `firerescueexpert://${pendingUrl.startsWith('/') ? pendingUrl.substring(1) : pendingUrl}`;
      }
    } catch (error) {
      console.error('Error getting initial notification URL:', error);
    }
    
    return null;
  },
  // Subscribe to URL changes
  subscribe: (listener) => {
    // Listen for incoming links while the app is open
    const subscription = Linking.addEventListener('url', ({ url }) => {
      listener(url);
    });
    
    return () => {
      subscription.remove();
    };
  },
};

export default linkingConfig; 