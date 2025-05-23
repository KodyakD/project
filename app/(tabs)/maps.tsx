import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { FloorMap } from '../../src/components/maps/FloorMap';
import { FloorSelector } from '../../src/components/maps/FloorSelector';
import WhereAmI from '../../src/components/maps/WhereAmI';
import MapLayerToggle from '../../src/components/maps/MapLayerToggle';
import { usePermissions } from '../../src/context/PermissionContext';
import Colors from '../../src/constants/Colors';
import { FloorType } from '../../src/types/map.types';

// Define component as a named function component for better clarity
const MapsScreen = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { permissions, requestLocationPermission } = usePermissions();
  
  const [currentFloor, setCurrentFloor] = useState<FloorType>('rdc');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [currentFloorMapId, setCurrentFloorMapId] = useState<string>('main-building-rdc');
  const [layers, setLayers] = useState({
    incidents: true,
    risks: false,
    evacuation: false,
    resources: true,
    userPosition: true,
    userAccuracy: true,
    userOrientation: true,
    userPath: false,
  });
  
  useEffect(() => {
    // Check for location permissions when the screen loads
    if (permissions && !permissions.location.foreground) {
      requestLocationPermission();
    }
  }, [permissions]);
  
  // Update floor map ID when floor changes
  useEffect(() => {
    // This would normally fetch the correct map ID for the building and floor
    // For now, we'll just use a simple mapping
    setCurrentFloorMapId(`main-building-${currentFloor}`);
  }, [currentFloor]);
  
  const handleSensorPress = (sensorId: string) => {
    // Handle sensor press
    console.log('Sensor pressed:', sensorId);
  };
  
  const handleLayerToggle = (layerName: keyof typeof layers) => {
    setLayers(prev => ({ ...prev, [layerName]: !prev[layerName] }));
  };
  
  const handleLocationFound = (floor: string, x: number, y: number) => {
    // Change to the floor where the user is located
    setCurrentFloor(floor as FloorType);
    // Additional logic like centering the map on the user position
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack.Screen
        options={{
          title: 'Campus Maps',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      
      <View style={styles.mapContainer}>
        <FloorMap
          floorMapId={currentFloorMapId}
          onSensorPress={handleSensorPress}
          showUserPosition={layers.userPosition}
          showUserAccuracy={layers.userAccuracy}
          showUserOrientation={layers.userOrientation}
          showUserPath={layers.userPath}
        />
      </View>
      
      <View style={styles.controlsOverlay}>
        <View style={styles.floorSelector}>
          <FloorSelector 
            currentFloor={currentFloor}
            onFloorChange={setCurrentFloor}
          />
        </View>
        
        <View style={styles.bottomControls}>
          <WhereAmI onLocationFound={handleLocationFound} />
          
          <View style={styles.layerToggles}>
            <MapLayerToggle
              icon="warning"
              label="Incidents"
              isActive={layers.incidents}
              onToggle={() => handleLayerToggle('incidents')}
            />
            <MapLayerToggle
              icon="local-fire-department"
              label="Risks"
              isActive={layers.risks}
              onToggle={() => handleLayerToggle('risks')}
            />
            <MapLayerToggle
              icon="directions-run"
              label="Evacuation"
              isActive={layers.evacuation}
              onToggle={() => handleLayerToggle('evacuation')}
            />
            <MapLayerToggle
              icon="shield"
              label="Resources"
              isActive={layers.resources}
              onToggle={() => handleLayerToggle('resources')}
            />
            <MapLayerToggle
              icon="my-location"
              label="My Position"
              isActive={layers.userPosition}
              onToggle={() => handleLayerToggle('userPosition')}
            />
            <MapLayerToggle
              icon="radar"
              label="Accuracy"
              isActive={layers.userAccuracy}
              onToggle={() => handleLayerToggle('userAccuracy')}
            />
            <MapLayerToggle
              icon="navigation"
              label="Orientation"
              isActive={layers.userOrientation}
              onToggle={() => handleLayerToggle('userOrientation')}
            />
            <MapLayerToggle
              icon="timeline"
              label="Movement"
              isActive={layers.userPath}
              onToggle={() => handleLayerToggle('userPath')}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  floorSelector: {
    alignSelf: 'center',
    marginTop: 16,
  },
  bottomControls: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
  },
  layerToggles: {
    flexDirection: 'row',
    marginTop: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
});

// Explicitly export the component as default
export default MapsScreen;