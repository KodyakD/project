import { setupQueueProcessingOnConnectivity as setupMediaQueueProcessing } from '../services/mediaService';
import { setupQueueProcessingOnConnectivity as setupIncidentQueueProcessing } from '../services/incidentService';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

/**
 * OfflineSyncManager
 * 
 * Manages the synchronization of offline data with the server:
 * - Listens for connectivity changes
 * - Processes media upload queue when connectivity is restored
 * - Processes incident queue when connectivity is restored
 * - Manages synchronization on app foreground/background
 */
class OfflineSyncManager {
  private static instance: OfflineSyncManager;
  private mediaQueueUnsubscribe: (() => void) | null = null;
  private incidentQueueUnsubscribe: (() => void) | null = null;
  private appStateSubscription: any = null;
  private syncInProgress: boolean = false;

  private constructor() {
    // Initialize listeners
    this.initialize();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): OfflineSyncManager {
    if (!OfflineSyncManager.instance) {
      OfflineSyncManager.instance = new OfflineSyncManager();
    }
    return OfflineSyncManager.instance;
  }

  /**
   * Initialize the sync manager
   */
  private initialize(): void {
    // Set up media queue processing
    this.mediaQueueUnsubscribe = setupMediaQueueProcessing();
    
    // Set up incident queue processing
    this.incidentQueueUnsubscribe = setupIncidentQueueProcessing();
    
    // Handle app state changes
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
    
    console.log('OfflineSyncManager initialized');
  }

  /**
   * Handle application state changes
   */
  private handleAppStateChange = async (nextAppState: string): Promise<void> => {
    if (nextAppState === 'active') {
      // App came to foreground - check for sync
      await this.checkAndSync();
    }
  };

  /**
   * Check connection and sync if online
   */
  public async checkAndSync(): Promise<boolean> {
    if (this.syncInProgress) {
      console.log('Sync already in progress, skipping');
      return false;
    }

    try {
      this.syncInProgress = true;
      
      // Check network state
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected || !netInfo.isInternetReachable) {
        console.log('Device is offline, skipping sync');
        this.syncInProgress = false;
        return false;
      }
      
      console.log('Running manual sync...');
      
      // Import actual services to call their functions directly
      const { processOfflineIncidentQueue } = await import('../services/incidentService');
      const { processQueuedUploads } = await import('../services/mediaService');
      
      // Process incident queue first
      const incidentResults = await processOfflineIncidentQueue();
      console.log('Incident sync results:', incidentResults);
      
      // Then process media uploads
      const mediaResults = await processQueuedUploads();
      console.log('Media sync results:', mediaResults);
      
      const success = incidentResults.success + mediaResults.success;
      const total = incidentResults.total + mediaResults.total;
      
      console.log(`Sync completed. ${success}/${total} items synced.`);
      
      this.syncInProgress = false;
      return true;
    } catch (error) {
      console.error('Error during sync:', error);
      this.syncInProgress = false;
      return false;
    }
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    if (this.mediaQueueUnsubscribe) {
      this.mediaQueueUnsubscribe();
      this.mediaQueueUnsubscribe = null;
    }
    
    if (this.incidentQueueUnsubscribe) {
      this.incidentQueueUnsubscribe();
      this.incidentQueueUnsubscribe = null;
    }
    
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    
    console.log('OfflineSyncManager cleaned up');
  }
}

export default OfflineSyncManager.getInstance(); 