import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { submitOfflineIncidents, submitOfflineDrafts } from '../services/incidentService';
import { processMediaUploadQueue } from '../services/mediaService';
import { 
  initNetworkMonitoring, 
  addConnectivityListener, 
  isOnline as checkIsOnline,
  checkConnectivityAndProcessQueue
} from '../services/networkService';

interface NetworkContextType {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  lastConnectedAt: Date | null;
  connectionType: string | null;
  syncInProgress: boolean;
  syncOfflineData: () => Promise<void>;
}

const defaultNetworkContext: NetworkContextType = {
  isConnected: false,
  isInternetReachable: null,
  lastConnectedAt: null,
  connectionType: null,
  syncInProgress: false,
  syncOfflineData: async () => {},
};

export const NetworkContext = createContext<NetworkContextType>(defaultNetworkContext);

export const useNetwork = () => useContext(NetworkContext);

interface NetworkProviderProps {
  children: ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(null);
  const [lastConnectedAt, setLastConnectedAt] = useState<Date | null>(null);
  const [connectionType, setConnectionType] = useState<string | null>(null);
  const [syncInProgress, setSyncInProgress] = useState<boolean>(false);

  // Handle network state changes
  useEffect(() => {
    // Initialize network monitoring service
    initNetworkMonitoring();
    
    // Subscribe to connectivity changes using the new NetworkService
    const unsubscribe = addConnectivityListener((online, state) => {
      setIsConnected(online);
      setIsInternetReachable(state?.isInternetReachable ?? null);
      setConnectionType(state?.type ?? null);
      
      // When connection is restored, update lastConnectedAt and sync data
      if (online && state?.isInternetReachable) {
        setLastConnectedAt(new Date());
        syncOfflineData();
      }
    });

    // Check initial state
    const currentOnline = checkIsOnline();
    setIsConnected(currentOnline);
    
    return () => {
      unsubscribe();
    };
  }, []);

  // Function to synchronize offline data when back online
  const syncOfflineData = async (): Promise<void> => {
    if (!isConnected || !isInternetReachable || syncInProgress) {
      return;
    }

    try {
      setSyncInProgress(true);
      
      // Process media upload queue using our NetworkService
      await checkConnectivityAndProcessQueue();
      
      // Submit offline incidents
      await submitOfflineIncidents();
      
      // Submit offline drafts
      await submitOfflineDrafts();
      
      console.log('Offline data synchronization completed');
    } catch (error) {
      console.error('Error synchronizing offline data:', error);
    } finally {
      setSyncInProgress(false);
    }
  };

  const contextValue: NetworkContextType = {
    isConnected,
    isInternetReachable,
    lastConnectedAt,
    connectionType,
    syncInProgress,
    syncOfflineData,
  };

  return (
    <NetworkContext.Provider value={contextValue}>
      {children}
    </NetworkContext.Provider>
  );
}; 