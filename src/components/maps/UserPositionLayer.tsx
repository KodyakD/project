import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useColorScheme } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocation } from '../../services/locationService';
import Colors from '../../constants/Colors';
import { FloorType } from '../../types/map.types';

interface UserPositionLayerProps {
  floor: FloorType;
  width: number;
  height: number;
  zoomLevel?: number;
  showAccuracy?: boolean;
  showOrientation?: boolean;
  showHistoricalPath?: boolean;
  maxHistoryPoints?: number;
}

/**
 * UserPositionLayer component displays the user's current position on the map
 * Features:
 * - Current position indicator
 * - Accuracy radius visualization
 * - Orientation indicator (if available)
 * - Historical path tracking (if enabled)
 */
const UserPositionLayer: React.FC<UserPositionLayerProps> = ({
  floor,
  width,
  height,
  zoomLevel = 1,
  showAccuracy = true,
  showOrientation = true,
  showHistoricalPath = false,
  maxHistoryPoints = 10
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { 
    location, 
    floor: userFloor, 
    loading, 
    error,
    getCurrentX,
    getCurrentY
  } = useLocation({
    enableHighAccuracy: true,
    interval: 3000, // Update position every 3 seconds
    distanceFilter: 1, // Update when moving at least 1 meter
    useSignalStrength: true,
    usePressureSensor: true
  });

  const [position, setPosition] = useState<{x: number, y: number} | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number>(5); // Default 5 meters
  const [pathHistory, setPathHistory] = useState<{x: number, y: number}[]>([]);
  const pulseAnim = useState(new Animated.Value(0.6))[0];

  // Start pulse animation for the position marker
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 1000,
          useNativeDriver: true
        })
      ])
    ).start();
  }, []);

  // Convert GPS coordinates to map coordinates
  useEffect(() => {
    // Only update position if user is on the same floor we're viewing
    if (location && userFloor === floor) {
      // In a real implementation, you would use a proper mapping algorithm
      // to convert GPS coordinates to map x,y coordinates
      
      // For the sample implementation, map to relative positions on the floor map
      // This is a simplified version - in a real app, you would have a more precise
      // mapping based on building dimensions and floor plans
      const mapX = width * 0.5 + (Math.random() * 50 - 25); // Simulate small movements around center
      const mapY = height * 0.5 + (Math.random() * 50 - 25);

      // Update position
      setPosition({ x: mapX, y: mapY });
      
      // Set accuracy based on location data
      setAccuracy(location.accuracy / 3); // Convert GPS accuracy to screen pixels
      
      // Update heading if available (could come from device sensors in a real app)
      // This is simulated for demo purposes
      setHeading(Math.random() * 360);
      
      // Add to historical path if tracking is enabled
      if (showHistoricalPath) {
        setPathHistory(prev => {
          const newHistory = [...prev, { x: mapX, y: mapY }];
          // Limit history length
          return newHistory.slice(-maxHistoryPoints);
        });
      }
    }
  }, [location, userFloor, floor, width, height, showHistoricalPath]);

  // Don't render anything if not on the current floor or no position data
  if (userFloor !== floor || !position) {
    return null;
  }

  // Calculate marker size based on zoom level
  const markerSize = 24 / zoomLevel;
  const accuracySize = (accuracy * 2) / zoomLevel;

  return (
    <View style={[
      styles.container,
      {
        width: width,
        height: height,
      }
    ]}>
      {/* Historical path */}
      {showHistoricalPath && pathHistory.length > 1 && (
        <View style={styles.pathContainer}>
          {pathHistory.map((point, index) => {
            // Skip the last point as it's the current position
            if (index === pathHistory.length - 1) return null;
            
            const opacity = 0.2 + (0.6 * (index / pathHistory.length));
            const pointSize = 4 + (2 * (index / pathHistory.length));
            
            return (
              <View
                key={`path-${index}`}
                style={[
                  styles.pathPoint,
                  {
                    left: point.x,
                    top: point.y,
                    opacity,
                    width: pointSize / zoomLevel,
                    height: pointSize / zoomLevel,
                    borderRadius: pointSize / zoomLevel / 2,
                  }
                ]}
              />
            );
          })}
        </View>
      )}
      
      {/* Accuracy circle */}
      {showAccuracy && (
        <View
          style={[
            styles.accuracyCircle,
            {
              left: position.x,
              top: position.y,
              width: accuracySize,
              height: accuracySize,
              borderRadius: accuracySize / 2,
              transform: [
                { translateX: -accuracySize / 2 },
                { translateY: -accuracySize / 2 }
              ],
            }
          ]}
        />
      )}
      
      {/* Position marker */}
      <Animated.View
        style={[
          styles.positionMarker,
          {
            left: position.x,
            top: position.y,
            width: markerSize,
            height: markerSize,
            borderRadius: markerSize / 2,
            transform: [
              { translateX: -markerSize / 2 },
              { translateY: -markerSize / 2 },
              { scale: pulseAnim }
            ],
          }
        ]}
      >
        {/* Inner dot */}
        <View style={styles.innerDot} />
      </Animated.View>
      
      {/* Orientation indicator */}
      {showOrientation && heading !== null && (
        <View
          style={[
            styles.orientationIndicator,
            {
              left: position.x,
              top: position.y,
              width: markerSize * 1.5,
              transform: [
                { translateX: 0 },
                { translateY: -markerSize / 2 },
                { rotate: `${heading}deg` },
                { translateY: -markerSize },
              ],
            }
          ]}
        >
          <MaterialIcons
            name="navigation"
            size={markerSize}
            color={colors.primary}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    pointerEvents: 'none',
  },
  positionMarker: {
    position: 'absolute',
    backgroundColor: 'rgba(33, 150, 243, 0.8)',
    borderWidth: 2,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    zIndex: 10,
  },
  innerDot: {
    width: '40%',
    height: '40%',
    backgroundColor: 'white',
    borderRadius: 100,
  },
  accuracyCircle: {
    position: 'absolute',
    backgroundColor: 'rgba(33, 150, 243, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.3)',
    zIndex: 5,
  },
  orientationIndicator: {
    position: 'absolute',
    height: 24,
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 11,
  },
  pathContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 4,
  },
  pathPoint: {
    position: 'absolute',
    backgroundColor: 'rgba(33, 150, 243, 0.5)',
    zIndex: 4,
  },
});

export default UserPositionLayer; 