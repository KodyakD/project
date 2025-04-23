import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { DeviceData } from '@/types/device';

interface UseIotDeviceDataResult {
  devices: DeviceData[];
  loading: boolean;
  error: Error | null;
  getDeviceDataBySensorId: (sensorId: string) => DeviceData | null;
  refreshDevices: () => Promise<void>;
}

/**
 * Hook for accessing IoT device data with real-time updates
 */
export const useIotDeviceData = (): UseIotDeviceDataResult => {
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Function to get device data for a specific sensor
  const getDeviceDataBySensorId = useCallback((sensorId: string): DeviceData | null => {
    return devices.find(device => device.id === sensorId) || null;
  }, [devices]);

  // Set up listener for real-time device updates
  useEffect(() => {
    setLoading(true);
    
    try {
      // Query for all active devices
      const devicesQuery = query(
        collection(db, 'devices'),
        orderBy('timestamp', 'desc')
      );
      
      // Set up real-time listener
      const unsubscribe = onSnapshot(devicesQuery, 
        (snapshot) => {
          const deviceList: DeviceData[] = [];
          
          snapshot.forEach(doc => {
            const data = doc.data();
            deviceList.push({
              id: doc.id,
              name: data.name,
              deviceId: data.deviceId,
              type: data.type,
              status: data.status,
              value: data.value,
              unit: data.unit,
              timestamp: data.timestamp?.toMillis() || Date.now(),
              batteryLevel: data.batteryLevel,
              location: data.location,
              metadata: data.metadata,
            });
          });
          
          setDevices(deviceList);
          setLoading(false);
        },
        (err) => {
          console.error('Error watching devices:', err);
          setError(err instanceof Error ? err : new Error('Failed to watch devices'));
          setLoading(false);
        }
      );
      
      // Clean up listener on unmount
      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up device watcher:', err);
      setError(err instanceof Error ? err : new Error('Failed to set up device watcher'));
      setLoading(false);
      return () => {};
    }
  }, []);

  // Function to manually refresh devices
  const refreshDevices = async (): Promise<void> => {
    try {
      setLoading(true);
      // This is a no-op since we're using real-time listeners
      // But we provide the function for compatibility with potential future needs
      setLoading(false);
    } catch (err) {
      console.error('Error refreshing devices:', err);
      setError(err instanceof Error ? err : new Error('Failed to refresh devices'));
      setLoading(false);
    }
  };

  return {
    devices,
    loading,
    error,
    getDeviceDataBySensorId,
    refreshDevices,
  };
}; 