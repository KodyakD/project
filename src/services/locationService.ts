import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { useState, useEffect } from 'react';
import { FloorType } from '@/types/map.types';
import { FLOORS } from '@/constants/floors';
import { 
  watchIndoorPosition, 
  getCurrentIndoorPosition, 
  LocationState,
  IndoorPositioningOptions
} from '@/components/maps/IndoorPositioning';

const LOCATION_TRACKING_TASK = 'background-location-task';

// Conversion from numeric floor to FloorType
const convertFloorNumberToType = (floor: number | null): FloorType => {
  if (floor === null) return 'rdc'; // Default to ground floor
  
  switch (floor) {
    case 0: return 'rdc';   // Ground floor / Rez-de-chaussée
    case 1: return '1er';   // First floor
    case 2: return '2eme';  // Second floor
    case 3: return '3eme';  // Third floor
    case 4: return '4eme';  // Fourth floor
    default: return 'rdc';  // Default to ground floor for undefined floors
  }
};

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
  
  // Get current location with indoor positioning
  getCurrentLocation: async (options?: IndoorPositioningOptions) => {
    const { granted } = await locationService.requestPermissions();
    
    if (!granted) {
      throw new Error('Location permission not granted');
    }
    
    return await getCurrentIndoorPosition(options);
  },
  
  // Determine floor using indoor positioning
  determineFloor: async (): Promise<FloorType> => {
    try {
      const location = await locationService.getCurrentLocation({
        usePressureSensor: true,
        useSignalStrength: true
      });
      
      return convertFloorNumberToType(location.floor);
    } catch (error) {
      console.error('Error determining floor:', error);
      return 'rdc'; // Default to ground floor on error
    }
  }
};

// Hook for location data with indoor positioning
export const useLocation = (options?: IndoorPositioningOptions) => {
  const [location, setLocation] = useState<LocationState | null>(null);
  const [floor, setFloor] = useState<FloorType>('rdc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    const setupLocationTracking = async () => {
      try {
        setLoading(true);
        const { granted } = await locationService.requestPermissions();
        
        if (!granted) {
          throw new Error('Location permission not granted');
        }
        
        // Start indoor position tracking
        unsubscribe = watchIndoorPosition(
          (newLocation) => {
            setLocation(newLocation);
            // Convert numeric floor to FloorType
            setFloor(convertFloorNumberToType(newLocation.floor));
            setLoading(false);
          },
          options
        );
      } catch (err) {
        console.error('Error setting up location:', err);
        setError(err instanceof Error ? err : new Error('Unknown location error'));
        setLoading(false);
      }
    };
    
    setupLocationTracking();
    
    // Clean up subscription
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [options]);
  
  // Manually set floor (for when user manually selects a floor)
  const manuallySetFloor = (newFloor: FloorType) => {
    setFloor(newFloor);
  };
  
  return { 
    location, 
    floor, 
    loading, 
    error, 
    setFloor: manuallySetFloor,
    // Helper functions for map display
    getCurrentX: () => location?.longitude ? location.longitude : null,
    getCurrentY: () => location?.latitude ? location.latitude : null,
    getCurrentBuilding: () => location?.building,
  };
};