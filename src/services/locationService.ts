import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { useState, useEffect } from 'react';
import { FloorType } from '@/types/map.types';
import { FLOORS } from '@/constants/floors';

const LOCATION_TRACKING_TASK = 'background-location-task';

// Service for location functionality
export const locationService = {
  // Request location permissions
  requestPermissions: async () => {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    
    if (foregroundStatus !== 'granted') {
      return { granted: false, foreground: false, background: false };
    }
    
    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    
    return { 
      granted: foregroundStatus === 'granted',
      foreground: foregroundStatus === 'granted',
      background: backgroundStatus === 'granted'
    };
  },
  
  // Get current location
  getCurrentLocation: async () => {
    const { granted } = await locationService.requestPermissions();
    
    if (!granted) {
      throw new Error('Location permission not granted');
    }
    
    return await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
  },
  
  // Determine floor (simplified implementation)
  determineFloor: async (): Promise<FloorType> => {
    // In a real app, this would use beacons, wifi, etc.
    return 'rdc';
  }
};

// Hook for location data
export const useLocation = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [floor, setFloor] = useState<FloorType>('rdc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    let subscription: Location.LocationSubscription;
    
    const setupLocationTracking = async () => {
      try {
        setLoading(true);
        const { granted } = await locationService.requestPermissions();
        
        if (!granted) {
          throw new Error('Location permission not granted');
        }
        
        // Try to determine the floor
        const detectedFloor = await locationService.determineFloor();
        setFloor(detectedFloor);
        
        // Subscribe to location updates
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 5,
          },
          (newLocation) => {
            setLocation(newLocation);
          }
        );
      } catch (err) {
        console.error('Error setting up location:', err);
        setError(err instanceof Error ? err : new Error('Unknown location error'));
      } finally {
        setLoading(false);
      }
    };
    
    setupLocationTracking();
    
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);
  
  return { location, floor, loading, error, setFloor };
};