import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Image,
  TouchableWithoutFeedback,
  PanResponder,
  Animated,
  Dimensions,
  Text,
  ImageSourcePropType,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import Svg, { Circle } from 'react-native-svg';
import { COLORS } from '../constants';
import { FloorMapData } from '../services/floorMapService';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';

interface MapData {
  imageUrl: string;
  width: number;
  height: number;
  incidents?: any[];
}

interface MapViewProps {
  mapData: FloorMapData;
  onLocationSelect?: (coordinates: { x: number, y: number }) => void;
  initialMarker?: { x: number, y: number } | null;
  incidents?: any[];
  showIncidents?: boolean;
  interactive?: boolean;
}

const MapView: React.FC<MapViewProps> = ({
  mapData,
  onLocationSelect,
  initialMarker = null,
  incidents = [],
  showIncidents = false,
  interactive = true
}) => {
  const [marker, setMarker] = useState<{ x: number, y: number } | null>(initialMarker);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [lastScale, setLastScale] = useState(1);
  
  // Animation values for pan and zoom
  const pan = useRef(new Animated.ValueXY()).current;
  const baseScale = useRef(new Animated.Value(1)).current;
  const pinchScale = useRef(new Animated.Value(1)).current;
  const combinedScale = Animated.multiply(baseScale, pinchScale);
  
  // Keep track of the last pan position
  const lastPanX = useRef(0);
  const lastPanY = useRef(0);
  
  // Initialize with default position
  useEffect(() => {
    pan.setValue({ x: 0, y: 0 });
  }, []);
  
  // Update marker when initialMarker changes
  useEffect(() => {
    setMarker(initialMarker);
  }, [initialMarker]);
  
  // Pan responder for handling gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => interactive,
      onMoveShouldSetPanResponder: () => interactive,
      
      // Handle map dragging
      onPanResponderGrant: () => {
        pan.setOffset({
          x: lastPanX.current,
          y: lastPanY.current
        });
        pan.setValue({ x: 0, y: 0 });
      },
      
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      
      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset();
        lastPanX.current = pan.x._value;
        lastPanY.current = pan.y._value;
        
        // Check if it's a tap with minimal movement
        if (
          Math.abs(gestureState.dx) < 5 &&
          Math.abs(gestureState.dy) < 5 &&
          onLocationSelect
        ) {
          handleMapPress(gestureState.x0, gestureState.y0);
        }
      }
    })
  ).current;
  
  // Function to handle location selection on the map
  const handleMapPress = (x: number, y: number) => {
    if (!interactive || !onLocationSelect || !dimensions.width || !dimensions.height) return;
    
    // Calculate the tap position relative to the map
    const mapContainerRect = {
      x: 0,
      y: 0,
      width: dimensions.width,
      height: dimensions.height
    };
    
    // Adjust the coordinates based on pan and zoom
    const adjustedX = (x - mapContainerRect.x - pan.x._value) / scale;
    const adjustedY = (y - mapContainerRect.y - pan.y._value) / scale;
    
    // Calculate the percentage position (0-1)
    const percentX = adjustedX / dimensions.width;
    const percentY = adjustedY / dimensions.height;
    
    // Convert to map coordinates
    const mapX = percentX * mapData.width;
    const mapY = percentY * mapData.height;
    
    // Set the marker and call the onLocationSelect callback
    const newMarker = { x: mapX, y: mapY };
    setMarker(newMarker);
    onLocationSelect(newMarker);
  };
  
  // Handle layout changes
  const onLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout;
    setDimensions({ width, height });
    
    // Calculate the scale to fit the map
    if (mapData && mapData.width && mapData.height) {
      const screenRatio = width / height;
      const mapRatio = mapData.width / mapData.height;
      
      let newScale = 1;
      if (screenRatio > mapRatio) {
        // Screen is wider than map
        newScale = height / mapData.height;
      } else {
        // Screen is taller than map
        newScale = width / mapData.width;
      }
      
      setScale(newScale);
      baseScale.setValue(newScale);
    }
  };
  
  // Renders the marker position
  const renderMarker = () => {
    if (!marker || !dimensions.width || !dimensions.height) return null;
    
    // Calculate position based on the marker coordinates
    const x = (marker.x / mapData.width) * dimensions.width;
    const y = (marker.y / mapData.height) * dimensions.height;
    
    return (
      <Animated.View
        style={[
          styles.marker,
          {
            left: x,
            top: y,
            transform: [
              { translateX: -15 },
              { translateY: -30 }
            ]
          }
        ]}
      >
        <Ionicons name="location" size={30} color={COLORS.primary} />
        <View style={styles.markerDot} />
      </Animated.View>
    );
  };
  
  // Render incident markers if showIncidents is true
  const renderIncidents = () => {
    if (!showIncidents || !incidents.length || !dimensions.width || !dimensions.height) return null;
    
    return incidents.map((incident, index) => {
      if (!incident.location || !incident.location.coordinates) return null;
      
      const { x, y } = incident.location.coordinates;
      
      // Calculate position based on the incident coordinates
      const posX = (x / mapData.width) * dimensions.width;
      const posY = (y / mapData.height) * dimensions.height;
      
      return (
        <Animated.View
          key={incident.id || index}
          style={[
            styles.incidentMarker,
            {
              left: posX,
              top: posY,
              transform: [
                { translateX: -12 },
                { translateY: -12 }
              ],
              backgroundColor: getIncidentSeverityColor(incident.severity)
            }
          ]}
        >
          <Text style={styles.incidentMarkerText}>!</Text>
        </Animated.View>
      );
    });
  };
  
  // Helper to get color based on incident severity
  const getIncidentSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return COLORS.error;
      case 'medium':
        return COLORS.warning;
      case 'low':
        return COLORS.info;
      default:
        return COLORS.primary;
    }
  };
  
  // Render the map
  return (
    <View style={styles.container} onLayout={onLayout}>
      {!mapData ? (
        <View style={styles.noMapContainer}>
          <Ionicons name="map-outline" size={48} color={COLORS.gray} />
          <Text style={styles.noMapText}>No map data available</Text>
        </View>
      ) : (
        <TouchableWithoutFeedback onPress={(e) => interactive && onLocationSelect && handleMapPress(e.nativeEvent.locationX, e.nativeEvent.locationY)}>
          <Animated.View
            style={[
              styles.mapContainer,
              {
                transform: [
                  { translateX: pan.x },
                  { translateY: pan.y },
                  { scale: combinedScale }
                ]
              }
            ]}
            {...panResponder.panHandlers}
          >
            <Image
              source={{ uri: mapData.imageUrl }}
              style={[
                styles.mapImage,
                {
                  width: dimensions.width,
                  height: dimensions.height
                }
              ]}
              resizeMode="contain"
            />
            {renderMarker()}
            {renderIncidents()}
          </Animated.View>
        </TouchableWithoutFeedback>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mapContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapImage: {
    backgroundColor: COLORS.white,
  },
  marker: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  markerDot: {
    position: 'absolute',
    bottom: 3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  incidentMarker: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  incidentMarkerText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  noMapContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  noMapText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
  },
});

export default MapView;

// Helper type declaration
interface TouchableOpacity {
  style: any;
  onPress: () => void;
  children: React.ReactNode;
}

// This component doesn't exist in React Native
// Creating a simple implementation for compatibility
const TouchableOpacity: React.FC<TouchableOpacity> = ({ style, onPress, children }) => {
  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <View style={style}>
        {children}
      </View>
    </TouchableWithoutFeedback>
  );
}; 

export default MapView;