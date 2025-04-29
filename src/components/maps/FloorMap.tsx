import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, ScrollView } from 'react-native';
import { PanGestureHandler, PinchGestureHandler, State } from 'react-native-gesture-handler';
import Animated, { 
  useAnimatedGestureHandler, 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming 
} from 'react-native-reanimated';
import { SvgXml } from 'react-native-svg';
import { FloorMap as FloorMapType, fetchFloorMap, fetchFloorMapSensorPoints } from '../../services/floorMapService';
import { SensorOverlay } from './SensorOverlay';
import UserPositionLayer from './UserPositionLayer';
import { FloorMapSensorPoint } from '../../services/floorMapService';
import { useIotDeviceData } from '../../hooks/useIotDeviceData';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FloorType } from '@/types/map.types';

interface FloorMapProps {
  floorMapId: string;
  onSensorPress?: (sensorId: string) => void;
  showUserPosition?: boolean;
  showUserAccuracy?: boolean;
  showUserOrientation?: boolean;
  showUserPath?: boolean;
}

export const FloorMap: React.FC<FloorMapProps> = ({
  floorMapId,
  onSensorPress,
  showUserPosition = true,
  showUserAccuracy = true,
  showUserOrientation = true,
  showUserPath = false
}) => {
  const [floorMap, setFloorMap] = useState<FloorMapType | null>(null);
  const [sensors, setSensors] = useState<FloorMapSensorPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getDeviceDataBySensorId } = useIotDeviceData();

  // Animation values
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const lastScale = useSharedValue(1);
  const lastTranslateX = useSharedValue(0);
  const lastTranslateY = useSharedValue(0);

  useEffect(() => {
    const loadFloorMap = async () => {
      try {
        setLoading(true);
        const mapData = await fetchFloorMap(floorMapId);
        if (mapData) {
          setFloorMap(mapData);
          const sensorData = await fetchFloorMapSensorPoints(floorMapId);
          setSensors(sensorData);
        } else {
          setError('Floor map not found');
        }
      } catch (err) {
        console.error('Error loading floor map:', err);
        setError('Failed to load floor map');
      } finally {
        setLoading(false);
      }
    };

    loadFloorMap();
  }, [floorMapId]);

  const pinchHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      ctx.startScale = scale.value;
    },
    onActive: (event, ctx) => {
      scale.value = ctx.startScale * event.scale;
    },
    onEnd: () => {
      lastScale.value = scale.value;
    },
  });

  const panHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx) => {
      translateX.value = ctx.startX + event.translationX;
      translateY.value = ctx.startY + event.translationY;
    },
    onEnd: () => {
      lastTranslateX.value = translateX.value;
      lastTranslateY.value = translateY.value;
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  const resetView = () => {
    scale.value = withTiming(1);
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    lastScale.value = 1;
    lastTranslateX.value = 0;
    lastTranslateY.value = 0;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading floor map...</Text>
      </View>
    );
  }

  if (error || !floorMap) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error || 'Error loading map'}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <PinchGestureHandler
        onGestureEvent={pinchHandler}
        onHandlerStateChange={({ nativeEvent }) => {
          if (nativeEvent.state === State.END) {
            lastScale.value = scale.value;
          }
        }}
      >
        <Animated.View style={styles.mapContainer}>
          <PanGestureHandler
            onGestureEvent={panHandler}
            onHandlerStateChange={({ nativeEvent }) => {
              if (nativeEvent.state === State.END) {
                lastTranslateX.value = translateX.value;
                lastTranslateY.value = translateY.value;
              }
            }}
          >
            <Animated.View style={[styles.svgContainer, animatedStyle]}>
              <SvgXml 
                xml={floorMap.svgContent} 
                width={floorMap.width} 
                height={floorMap.height} 
              />
              <SensorOverlay 
                sensors={sensors} 
                getDeviceData={getDeviceDataBySensorId}
                onSensorPress={onSensorPress}
                scale={scale.value}
              />
            </Animated.View>
          </PanGestureHandler>
          
          {/* User position layer - positioned outside the pan/zoom container so it's always visible */}
          {showUserPosition && (
            <UserPositionLayer
              floor={floorMap.floor as FloorType}
              width={floorMap.width}
              height={floorMap.height}
              zoomLevel={scale.value}
              showAccuracy={showUserAccuracy}
              showOrientation={showUserOrientation}
              showHistoricalPath={showUserPath}
            />
          )}
        </Animated.View>
      </PinchGestureHandler>
      
      <View style={styles.controls}>
        <Text style={styles.resetButton} onPress={resetView}>
          Reset View
        </Text>
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
    overflow: 'hidden',
  },
  svgContainer: {
    position: 'absolute',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
    padding: 10,
  },
  resetButton: {
    fontSize: 16,
    color: '#0066cc',
    fontWeight: 'bold',
  },
});