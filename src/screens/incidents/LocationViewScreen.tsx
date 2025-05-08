import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapViewer from '../../components/maps/MapViewer';
import { FloorSelector } from '../../components/maps/FloorSelector';
import { getFloorMapData } from '../../services/floorMapService';
import { getIncident } from '../../services/incidentService';
import { FloorType } from '../../types/map.types';
import { FLOORS } from '../../constants/floors';

interface RouteParams {
  floor: FloorType;
  x: number;
  y: number;
  incidentId: string;
}

const LocationViewScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { floor, x, y, incidentId } = route.params as RouteParams;
  
  const [mapData, setMapData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [incidentTitle, setIncidentTitle] = useState<string>('');
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load floor map data
        const data = await getFloorMapData(floor);
        if (data) {
          setMapData(data);
        } else {
          setError('Could not load floor map data');
        }
        
        // Load incident info
        if (incidentId) {
          const incident = await getIncident(incidentId);
          if (incident) {
            setIncidentTitle(incident.title);
          }
        }
      } catch (err) {
        console.error('Error loading location data:', err);
        setError('Failed to load location data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [floor, incidentId]);
  
  // Get floor name for display
  const getFloorName = (floorId: FloorType) => {
    const floor = FLOORS.find(f => f.id === floorId);
    return floor ? floor.fullName : floorId;
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['right', 'bottom', 'left']}>
      {/* Title bar */}
      <View style={styles.titleBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#333333" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {incidentTitle || 'Location View'}
          </Text>
          <Text style={styles.subtitle}>
            Floor: {getFloorName(floor)}
          </Text>
        </View>
      </View>
      
      {/* Map Container */}
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
          <View style={styles.mapWrapper}>
            <MapViewer
              svgContent={mapData.mapSvg}
              width={mapData.width}
              height={mapData.height}
            />
            
            {/* Location Marker */}
            <View 
              style={[
                styles.locationMarker,
                {
                  left: x - 15,
                  top: y - 30,
                }
              ]}
            >
              <MaterialIcons name="place" size={30} color="#FF3B30" />
            </View>
            
            {/* Coordinates Label */}
            <View style={styles.coordinatesContainer}>
              <Text style={styles.coordinatesText}>
                X: {Math.round(x)} Y: {Math.round(y)}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>No map data available</Text>
          </View>
        )}
      </View>
      
      {/* Footer with buttons */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.footerButton}
          onPress={() => navigation.navigate('ReportIncident', {
            initialFloor: floor,
            initialX: x,
            initialY: y
          })}
        >
          <MaterialIcons name="warning" size={20} color="#FFFFFF" />
          <Text style={styles.footerButtonText}>Report New</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.footerButton, styles.secondaryButton]}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={20} color="#0066CC" />
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    marginRight: 16,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },
  locationMarker: {
    position: 'absolute',
    zIndex: 1000,
  },
  coordinatesContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  coordinatesText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
    marginHorizontal: 4,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#0066CC',
  },
  footerButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#0066CC',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default LocationViewScreen; 