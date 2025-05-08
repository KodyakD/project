import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapViewer from '../../components/maps/MapViewer';
import { FloorSelector } from '../../components/maps/FloorSelector';
import { getFloorMapData } from '../../services/floorMapService';
import { FloorType } from '../../types/map.types';
import { FLOORS } from '../../constants/floors';

interface RouteParams {
  onLocationSelected: (floor: FloorType, x: number, y: number) => void;
  initialFloor?: FloorType;
}

const LocationPickerScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { onLocationSelected, initialFloor = 'rdc' } = route.params as RouteParams;
  
  const [selectedFloor, setSelectedFloor] = useState<FloorType>(initialFloor);
  const [selectedLocation, setSelectedLocation] = useState<{ x: number, y: number } | null>(null);
  const [mapData, setMapData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    loadFloorMap(selectedFloor);
  }, [selectedFloor]);
  
  const loadFloorMap = async (floor: FloorType) => {
    try {
      setLoading(true);
      const data = await getFloorMapData(floor);
      if (data) {
        setMapData(data);
      } else {
        setError('Could not load floor map data');
      }
    } catch (err) {
      console.error('Error loading floor map:', err);
      setError('Failed to load floor map');
    } finally {
      setLoading(false);
    }
  };
  
  const handleFloorChange = (floor: FloorType) => {
    setSelectedFloor(floor);
    setSelectedLocation(null);
  };
  
  const handleMapPress = (e: any) => {
    // Get the coordinates from the press event
    // Coordinates are relative to the map and need to be converted to map coordinates
    const { locationX, locationY } = e.nativeEvent;
    
    // This would require proper coordinate transformation in a real app
    // For now, we'll use these coordinates directly
    setSelectedLocation({
      x: locationX,
      y: locationY
    });
  };
  
  const confirmLocation = () => {
    if (!selectedLocation) {
      Alert.alert('Please select a location', 'Tap on the map to select a location');
      return;
    }
    
    const { x, y } = selectedLocation;
    onLocationSelected(selectedFloor, x, y);
    navigation.goBack();
  };
  
  // Get floor name for display
  const getFloorName = (floorId: FloorType) => {
    const floor = FLOORS.find(f => f.id === floorId);
    return floor ? floor.fullName : floorId;
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['right', 'bottom', 'left']}>
      {/* Floor Selector */}
      <FloorSelector 
        currentFloor={selectedFloor}
        onFloorChange={handleFloorChange}
      />
      
      {/* Map */}
      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0066CC" />
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : mapData ? (
          <TouchableOpacity 
            activeOpacity={1}
            style={styles.mapWrapper}
            onPress={handleMapPress}
          >
            <MapViewer
              svgContent={mapData.mapSvg}
              width={mapData.width}
              height={mapData.height}
            />
            
            {/* Selected Location Marker */}
            {selectedLocation && (
              <View 
                style={[
                  styles.locationMarker,
                  {
                    left: selectedLocation.x - 15,
                    top: selectedLocation.y - 30,
                  }
                ]}
              >
                <MaterialIcons name="place" size={30} color="#FF3B30" />
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>No map data available</Text>
          </View>
        )}
      </View>
      
      {/* Information Bar */}
      <View style={styles.infoBar}>
        <View style={styles.infoTextContainer}>
          <Text style={styles.infoText}>
            Floor: {getFloorName(selectedFloor)}
          </Text>
          {selectedLocation && (
            <Text style={styles.infoText}>
              Position: ({Math.round(selectedLocation.x)}, {Math.round(selectedLocation.y)})
            </Text>
          )}
        </View>
        
        <TouchableOpacity 
          style={[
            styles.confirmButton,
            !selectedLocation && styles.disabledButton
          ]}
          onPress={confirmLocation}
          disabled={!selectedLocation}
        >
          <Text style={styles.confirmButtonText}>Confirm Location</Text>
        </TouchableOpacity>
      </View>
      
      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          Tap on the map to select the incident location
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#333333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  locationMarker: {
    position: 'absolute',
    zIndex: 1000,
  },
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoText: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 4,
  },
  confirmButton: {
    backgroundColor: '#34C759',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#A1A1A1',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  instructionsContainer: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  instructionsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LocationPickerScreen; 