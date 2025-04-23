import React, { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import notificationService from '../services/notificationService';

/**
 * DeepLinkHandler component
 * Handles deep links and notification navigation throughout the app
 */
const DeepLinkHandler: React.FC = () => {
  const router = useRouter();
  const initialized = useRef(false);

  // Handle deep links from notifications or external sources
  useEffect(() => {
    const handleInitialDeepLink = async () => {
      // Prevent multiple initializations
      if (initialized.current) return;
      initialized.current = true;

      try {
        // Check for URLs that may have launched the app
        const url = await Linking.getInitialURL();
        
        if (url) {
          console.log('App launched with URL:', url);
          // Let the Expo Router handle the deep link
          return;
        }
        
        // Check if we have a stored navigation target from a notification
        const route = await notificationService.getAndClearNavigationTarget();
        if (route) {
          console.log('Navigating to notification route:', route);
          router.push(route);
        }
      } catch (error) {
        console.error('Error handling initial deep link:', error);
      }
    };

    // Handle deep links when app is already running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      try {
        console.log('Received deep link with app running:', url);
        // Extract path from URL
        const { path } = Linking.parse(url);
        
        if (path) {
          // Convert path to app route
          const route = `/${path}`;
          console.log('Navigating to deep link route:', route);
          router.push(route);
        }
      } catch (error) {
        console.error('Error handling deep link event:', error);
      }
    });

    handleInitialDeepLink();

    return () => {
      subscription.remove();
    };
  }, [router]);

  // No UI needed - this is just a handler component
  return null;
};

export default DeepLinkHandler; 