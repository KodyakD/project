import { useState, useEffect, useCallback } from 'react';
import firestore from '@react-native-firebase/firestore';
import { DeviceData } from '../types/device';

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
      // Query for all active devices using React Native Firebase SDK
      const devicesQuery = firestore()
        .collection('devices')
        .orderBy('timestamp', 'desc');
      
      // Set up real-time listener with RN Firebase
      const unsubscribe = devicesQuery.onSnapshot(
        (snapshot) => {
          const deviceList: DeviceData[] = [];
          
          snapshot.forEach(doc => {
            const data = doc.data();
            deviceList.push({
              id: doc.id,
              name: data.name || 'Unnamed Device',
              deviceId: data.deviceId || doc.id,
              type: data.type || 'other',
              status: data.status || 'normal',
              value: data.value,
              unit: data.unit,
              // Handle Firebase timestamp conversion with RN Firebase
              timestamp: data.timestamp?.toMillis 
                ? data.timestamp.toMillis() 
                : (data.timestamp instanceof Date 
                    ? data.timestamp.getTime() 
                    : Date.now()),
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
      
      // Fetch latest devices directly (though we have real-time updates already)
      const snapshot = await firestore()
        .collection('devices')
        .orderBy('timestamp', 'desc')
        .get();
      
      const deviceList: DeviceData[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        deviceList.push({
          id: doc.id,
          name: data.name || 'Unnamed Device',
          deviceId: data.deviceId || doc.id,
          type: data.type || 'other',
          status: data.status || 'normal',
          value: data.value,
          unit: data.unit,
          timestamp: data.timestamp?.toMillis 
            ? data.timestamp.toMillis() 
            : (data.timestamp instanceof Date 
                ? data.timestamp.getTime() 
                : Date.now()),
          batteryLevel: data.batteryLevel,
          location: data.location,
          metadata: data.metadata,
        });
      });
      
      setDevices(deviceList);
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

// Optional helper function to add mock device data for testing
export const addMockDeviceData = async (mockDevices: Partial<DeviceData>[]): Promise<void> => {
  try {
    const batch = firestore().batch();
    
    mockDevices.forEach(device => {
      const docRef = firestore().collection('devices').doc();
      batch.set(docRef, {
        ...device,
        timestamp: firestore.FieldValue.serverTimestamp(),
      });
    });
    
    await batch.commit();
    console.log('Added mock device data');
  } catch (error) {
    console.error('Error adding mock device data:', error);
  }
};

export default useIotDeviceData;