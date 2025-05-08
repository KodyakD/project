import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapViewer from '../components/maps/MapViewer';
import SensorOverlay from '../components/maps/SensorOverlay';
import { fetchFloorMap, FloorMap, FloorMapSensorPoint } from '../services/floorMapService';
import { getSensorData } from '../services/sensorService';
import { Ionicons } from '@expo/vector-icons';

interface RouteParams {
  floorMapId: string;
  buildingName?: string;
}

const FloorMapScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { floorMapId, buildingName } = route.params as RouteParams;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [floorMap, setFloorMap] = useState<FloorMap | null>(null);
  const [scale, setScale] = useState(1);
  
  useEffect(() => {
    const loadFloorMap = async () => {
      try {
        setLoading(true);
        const map = await fetchFloorMap(floorMapId);
        setFloorMap(map);
        
        // Set the screen title to the floor name
        navigation.setOptions({
          title: buildingName ? `${buildingName} - ${map.name}` : map.name,
        });
      } catch (err) {
        console.error('Failed to load floor map:', err);
        setError('Failed to load floor map. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadFloorMap();
  }, [floorMapId, navigation, buildingName]);
  
  const handleSensorPress = (sensor: FloorMapSensorPoint) => {
    // Navigate to sensor details or show a modal with sensor data
    console.log('Sensor pressed:', sensor);
  };
  
  // Function to get real-time sensor data
  const getDeviceData = (sensorId: string, type: string) => {
    // This function would fetch real-time data for a given sensor
    // For now, we'll return mock data for demonstration
    return getSensorData(sensorId);
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading floor map...</Text>
      </View>
    );
  }
  
  if (error || !floorMap) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Failed to load floor map'}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['right', 'bottom', 'left']}>
      <View style={styles.mapContainer}>
        <MapViewer
          svgContent={floorMap.mapSvg}
          width={floorMap.width}
          height={floorMap.height}
          onZoomChange={setScale}
        />
        <SensorOverlay
          sensors={floorMap.sensorPoints}
          getDeviceData={getDeviceData}
          onSensorPress={handleSensorPress}
          scale={scale}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FloorMapScreen; 