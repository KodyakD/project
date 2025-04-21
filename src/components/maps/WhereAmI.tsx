import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useColorScheme } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocation } from '@/services/locationService';
import { usePermissions } from '@/context/PermissionContext';
import Colors from '@/constants/Colors';
import { FLOORS } from '@/constants/floors';

interface WhereAmIProps {
  onLocationFound?: (floor: string, x: number, y: number) => void;
}

const WhereAmI: React.FC<WhereAmIProps> = ({ onLocationFound }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { location, floor, loading, error, setFloor } = useLocation();
  const { permissions, requestLocationPermission } = usePermissions();
  const [findingLocation, setFindingLocation] = useState(false);
  
  const handleFindMe = async () => {
    if (!permissions.location.foreground) {
      await requestLocationPermission();
    }
    setFindingLocation(true);
    try {
      // In a real app, this would integrate with indoor positioning
      // For now, we just simulate finding the user on the map
      setTimeout(() => {
        // Example coordinates on the map
        const mapX = 300;
        const mapY = 200;
        
        if (onLocationFound) {
          onLocationFound(floor, mapX, mapY);
        }
        
        setFindingLocation(false);
      }, 1500);
    } catch (err) {
      console.error('Error finding location:', err);
      setFindingLocation(false);
    }
  };
  
  const currentFloor = FLOORS.find(f => f.id === floor);
  
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
          <Text style={[styles.locationText, { color: colors.textSecondary }]}>
            Floor: {currentFloor?.fullName || 'Unknown'}
          </Text>
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