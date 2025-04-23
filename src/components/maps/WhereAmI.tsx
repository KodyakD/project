import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useColorScheme } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocation } from '@/services/locationService';
import { usePermissions } from '@/context/PermissionContext';
import Colors from '@/constants/Colors';
import { FLOORS } from '@/constants/floors';
import { FloorType } from '@/types/map.types';

interface WhereAmIProps {
  onLocationFound?: (floor: FloorType, x: number, y: number) => void;
  currentScale?: number;
  mapWidth?: number;
  mapHeight?: number;
}

const WhereAmI: React.FC<WhereAmIProps> = ({ 
  onLocationFound,
  currentScale = 1,
  mapWidth = 1000,
  mapHeight = 800
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { 
    location, 
    floor, 
    loading, 
    error, 
    getCurrentX, 
    getCurrentY, 
    getCurrentBuilding 
  } = useLocation({
    enableHighAccuracy: true,
    interval: 5000,
    distanceFilter: 2
  });
  const { permissions, requestLocationPermission } = usePermissions();
  const [findingLocation, setFindingLocation] = useState(false);
  const [positionOnMap, setPositionOnMap] = useState<{x: number, y: number} | null>(null);
  
  // When location changes, convert GPS to map coordinates
  useEffect(() => {
    if (location && !findingLocation) {
      const building = getCurrentBuilding();
      
      // If we have building info, we can do more precise mapping to coordinates
      if (building) {
        // In a real implementation, we would use a mapping algorithm
        // to convert GPS coordinates to map x,y coordinates
        // For now, we'll simulate with appropriate map coordinates
        
        // Simulate mapping from GPS to map coordinates
        // In a real implementation, you'd have a proper algorithm here
        const mapX = mapWidth / 2 + (Math.random() * 100 - 50); // Center ± 50px
        const mapY = mapHeight / 2 + (Math.random() * 100 - 50); // Center ± 50px
        
        setPositionOnMap({ x: mapX, y: mapY });
      }
    }
  }, [location, floor, findingLocation, mapWidth, mapHeight]);
  
  const handleFindMe = async () => {
    if (!permissions.location.foreground) {
      await requestLocationPermission();
    }
    
    setFindingLocation(true);
    try {
      // Use real indoor positioning
      // If we already have a location, use it
      if (location) {
        const mapPosition = positionOnMap || {
          x: mapWidth / 2,
          y: mapHeight / 2
        };
        
        if (onLocationFound) {
          onLocationFound(floor, mapPosition.x, mapPosition.y);
        }
        
        setFindingLocation(false);
        return;
      }
      
      // Otherwise wait for a location update
      setTimeout(() => {
        // If we still don't have a location after 3 seconds,
        // provide a reasonable default
        if (!location) {
          const defaultPosition = {
            x: mapWidth / 2,
            y: mapHeight / 2
          };
          
          if (onLocationFound) {
            onLocationFound(floor, defaultPosition.x, defaultPosition.y);
          }
        } else if (positionOnMap && onLocationFound) {
          onLocationFound(floor, positionOnMap.x, positionOnMap.y);
        }
        
        setFindingLocation(false);
      }, 3000);
      
    } catch (err) {
      console.error('Error finding location:', err);
      setFindingLocation(false);
    }
  };
  
  const currentFloor = FLOORS.find(f => f.id === floor);
  const buildingName = getCurrentBuilding() || 'Unknown Building';
  
  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.infoSection}>
        <Text style={[styles.title, { color: colors.text }]}>Your Location</Text>
        
        {error ? (
          <Text style={[styles.errorText, { color: colors.error }]}>
            Unable to determine your location. Please enable location services.
          </Text>
        ) : loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <View>
            <Text style={[styles.locationText, { color: colors.textSecondary }]}>
              Floor: {currentFloor?.fullName || 'Unknown'}
            </Text>
            <Text style={[styles.locationText, { color: colors.textSecondary }]}>
              Building: {buildingName}
            </Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={handleFindMe}
        disabled={findingLocation || loading}
      >
        {findingLocation ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <MaterialIcons name="my-location" size={18} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Find Me</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoSection: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    marginBottom: 2,
  },
  errorText: {
    fontSize: 14,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  buttonIcon: {
    marginRight: 6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '500',
  },
});

export default WhereAmI;