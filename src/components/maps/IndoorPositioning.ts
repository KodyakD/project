import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

export type LocationState = {
  latitude: number;
  longitude: number;
  altitude: number | null;
  floor: number | null;
  accuracy: number;
  timestamp: number;
  building: string | null;
};

export type IndoorPositioningOptions = {
  enableHighAccuracy?: boolean;
  interval?: number;
  fastestInterval?: number;
  distanceFilter?: number;
  useSignalStrength?: boolean;
  usePressureSensor?: boolean;
};

const defaultOptions: IndoorPositioningOptions = {
  enableHighAccuracy: true,
  interval: 5000,       // Update every 5 seconds
  fastestInterval: 2000, // Fastest update interval
  distanceFilter: 1,    // Update when moving 1 meter
  useSignalStrength: true,
  usePressureSensor: true,
};

// Wi-Fi position database (simulated)
// In a real app, this would be fetched from a server
const WIFI_POSITION_DB = [
  {
    ssid: 'Building1_Floor1',
    floor: 0,
    building: 'Building1',
    position: { latitude: 48.8566, longitude: 2.3522 }
  },
  {
    ssid: 'Building1_Floor2',
    floor: 1,
    building: 'Building1',
    position: { latitude: 48.8566, longitude: 2.3522 }
  },
  // More reference points would be here
];

// Floor height calculation
const FLOOR_HEIGHT_METERS = 3.5; // Average height between floors
const BASE_ALTITUDE = 0; // Ground floor reference altitude

/**
 * Determine floor based on altitude
 */
const getFloorFromAltitude = (altitude: number | null, baseAltitude = BASE_ALTITUDE): number | null => {
  if (altitude === null) return null;
  
  const relativeAltitude = altitude - baseAltitude;
  if (relativeAltitude < 0) return null;
  
  return Math.round(relativeAltitude / FLOOR_HEIGHT_METERS);
};

/**
 * Determine floor based on Wi-Fi signals (simulated)
 */
const getFloorFromWifi = async (): Promise<{ floor: number | null, building: string | null }> => {
  // This would be an actual Wi-Fi scanning in a real app
  // For this implementation, we'll return a simulated value
  const randomIndex = Math.floor(Math.random() * WIFI_POSITION_DB.length);
  const wifiPoint = WIFI_POSITION_DB[randomIndex];
  
  return {
    floor: wifiPoint.floor,
    building: wifiPoint.building
  };
};

/**
 * Get the current indoor position with floor detection
 */
export const getCurrentIndoorPosition = async (
  options: IndoorPositioningOptions = {}
): Promise<LocationState> => {
  // Get current location
  const location = await Location.getCurrentPositionAsync({
    accuracy: options.enableHighAccuracy ? Location.Accuracy.Highest : Location.Accuracy.Balanced,
  });
  
  let floor: number | null = null;
  let building: string | null = null;
  
  // Try to determine floor from altitude if available
  if (location.coords.altitude !== null && options.usePressureSensor) {
    floor = getFloorFromAltitude(location.coords.altitude);
  }
  
  // If altitude-based method failed or is disabled, try Wi-Fi
  if ((floor === null || !options.usePressureSensor) && options.useSignalStrength) {
    try {
      const wifiPosition = await getFloorFromWifi();
      floor = wifiPosition.floor;
      building = wifiPosition.building;
    } catch (err) {
      console.error('Error getting floor from Wi-Fi:', err);
    }
  }
  
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    altitude: location.coords.altitude,
    floor,
    accuracy: location.coords.accuracy,
    timestamp: location.timestamp,
    building,
  };
};

/**
 * Subscribe to indoor position updates
 */
export const watchIndoorPosition = (
  callback: (location: LocationState) => void,
  options: IndoorPositioningOptions = {}
): (() => void) => {
  // Merge defaults with provided options
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Start watching position
  const locationSubscription = Location.watchPositionAsync(
    {
      accuracy: mergedOptions.enableHighAccuracy 
        ? Location.Accuracy.Highest 
        : Location.Accuracy.Balanced,
      distanceInterval: mergedOptions.distanceFilter,
      timeInterval: mergedOptions.interval,
    },
    async (location) => {
      let floor: number | null = null;
      let building: string | null = null;
      
      // Try to determine floor from altitude if available
      if (location.coords.altitude !== null && mergedOptions.usePressureSensor) {
        floor = getFloorFromAltitude(location.coords.altitude);
      }
      
      // If altitude-based method failed or is disabled, try Wi-Fi
      if ((floor === null || !mergedOptions.usePressureSensor) && mergedOptions.useSignalStrength) {
        try {
          const wifiPosition = await getFloorFromWifi();
          floor = wifiPosition.floor;
          building = wifiPosition.building;
        } catch (err) {
          console.error('Error getting floor from Wi-Fi:', err);
        }
      }
      
      // Call the callback with the location data
      callback({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: location.coords.altitude,
        floor,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
        building,
      });
    }
  );
  
  // Return unsubscribe function
  return () => {
    locationSubscription.then(sub => sub.remove());
  };
};

/**
 * React hook for indoor positioning
 */
export const useIndoorPosition = (options: IndoorPositioningOptions = {}) => {
  const [location, setLocation] = useState<LocationState | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    const startWatching = async () => {
      try {
        // Check permissions first
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Location permission not granted');
        }
        
        // Start watching position
        unsubscribe = watchIndoorPosition(
          (newLocation) => {
            setLocation(newLocation);
            setLoading(false);
          },
          options
        );
      } catch (err) {
        console.error('Error setting up location tracking:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setLoading(false);
      }
    };
    
    startWatching();
    
    // Clean up on unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [options.enableHighAccuracy, options.interval, options.distanceFilter]);
  
  return { location, error, loading };
}; 