import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { PanGestureHandler, PinchGestureHandler } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useMapCache } from '@/hooks/useMapCache';
import { useMapGestures } from '@/hooks/useMapGestures';
import { FloorType } from '@/types/map.types';
import RoomHighlight from './RoomHighlight';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';

interface FloorMapProps {
  floorId: FloorType;
  showRooms?: boolean;
  initialZoom?: number;
  onRoomPress?: (roomId: string) => void;
  highlightedRoomId?: string | null;
}

const FloorMap: React.FC<FloorMapProps> = ({
  floorId,
  showRooms = true,
  initialZoom = 1,
  onRoomPress,
  highlightedRoomId = null,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const { mapUri, isLoading, error } = useMapCache(floorId);
  const { scale, translateX, translateY, gestureHandlers } = useMapGestures(initialZoom);
  
  // Animated styles for pan and zoom
  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value }
      ]
    };
  });
  
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading map...</Text>
      </View>
    );
  }
  
  if (error || !mapUri) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          Could not load map. Please try again.
        </Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <PanGestureHandler 
        onGestureEvent={gestureHandlers.panGestureEvent}
        onHandlerStateChange={gestureHandlers.panStateChange}
      >
        <Animated.View style={styles.fullSize}>
          <PinchGestureHandler
            onGestureEvent={gestureHandlers.pinchGestureEvent}
            onHandlerStateChange={gestureHandlers.pinchStateChange}
          >
            <Animated.View style={[styles.mapContainer, animatedStyles]}>
              <SvgUri
                width="100%"
                height="100%"
                uri={mapUri}
              />
              
              {showRooms && (
                <RoomHighlight
                  floorId={floorId}
                  highlightedRoomId={highlightedRoomId}
                  onRoomPress={onRoomPress}
                />
              )}
            </Animated.View>
          </PinchGestureHandler>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  fullSize: {
    width: '100%',
    height: '100%',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 20,
  }
});

export default FloorMap;