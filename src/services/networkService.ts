import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { processMediaUploadQueue } from './mediaService';

// Network state listeners
let listeners: ((isConnected: boolean) => void)[] = [];
let isConnected = true;
let isInitialized = false;

/**
 * Initialize the network monitoring service
 * This should be called once at app startup
 */
export const initNetworkMonitoring = (): void => {
  if (isInitialized) return;
  
  // Subscribe to network state changes
  NetInfo.addEventListener(handleConnectivityChange);
  
  // Check current state
  NetInfo.fetch().then(handleConnectivityChange);
  
  isInitialized = true;
  console.log('Network monitoring initialized');
};

/**
 * Handle connectivity change events
 */
const handleConnectivityChange = async (state: NetInfoState): Promise<void> => {
  const online = state.isConnected === true && state.isInternetReachable !== false;
  
  // Only process changes in connectivity status
  if (online !== isConnected) {
    console.log(`Connectivity changed: ${online ? 'online' : 'offline'}`);
    isConnected = online;
    
    // Notify all listeners
    listeners.forEach(listener => listener(online));
    
    // If we're back online, process any queued uploads
    if (online) {
      console.log('Back online, processing media upload queue');
      try {
        const result = await processMediaUploadQueue();
        console.log(`Queue processing complete: ${result.success}/${result.total} uploads successful`);
      } catch (error) {
        console.error('Error processing queue on connectivity change:', error);
      }
    }
  }
};

/**
 * Add a listener for connectivity changes
 */
export const addConnectivityListener = (
  listener: (isConnected: boolean) => void
): (() => void) => {
  listeners.push(listener);
  
  // Immediately notify with current state
  listener(isConnected);
  
  // Return unsubscribe function
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
};

/**
 * Check if the device is currently online
 */
export const isOnline = async (): Promise<boolean> => {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected === true && state.isInternetReachable !== false;
  } catch (error) {
    console.error('Error checking online status:', error);
    return false;
  }
};

/**
 * Force check for connectivity and process upload queue if online
 */
export const checkConnectivityAndProcessQueue = async (): Promise<void> => {
  try {
    const online = await isOnline();
    
    if (online) {
      console.log('Device is online, processing media upload queue');
      await processMediaUploadQueue();
    } else {
      console.log('Device is offline, skipping queue processing');
    }
  } catch (error) {
    console.error('Error in checkConnectivityAndProcessQueue:', error);
  }
}; 