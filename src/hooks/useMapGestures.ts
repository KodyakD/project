import { useSharedValue, useAnimatedGestureHandler, withTiming } from 'react-native-reanimated';

export const useMapGestures = (initialZoom = 1) => {
  // Shared values for transformations
  const scale = useSharedValue(initialZoom);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  
  // For pinch gesture calculations
  const baseScale = useSharedValue(initialZoom);
  
  // For pan gesture calculations
  const lastX = useSharedValue(0);
  const lastY = useSharedValue(0);
  
  // Min/Max constraints
  const MIN_SCALE = 0.5;
  const MAX_SCALE = 4;
  
  // Handle pinch (zoom) gesture
  const pinchGestureEvent = useAnimatedGestureHandler({
    onStart: () => {
      baseScale.value = scale.value;
    },
    onActive: (event) => {
      // Calculate new scale with constraints
      scale.value = Math.min(
        Math.max(baseScale.value * event.scale, MIN_SCALE),
        MAX_SCALE
      );
    },
    onEnd: () => {
      // Optional: Add a small animation at the end of scaling
      if (scale.value < MIN_SCALE) {
        scale.value = withTiming(MIN_SCALE);
      } else if (scale.value > MAX_SCALE) {
        scale.value = withTiming(MAX_SCALE);
      }
    },
  });
  
  // Handle pan gesture
  const panGestureEvent = useAnimatedGestureHandler({
    onStart: () => {
      lastX.value = translateX.value;
      lastY.value = translateY.value;
    },
    onActive: (event) => {
      // Apply translation based on touch movement
      translateX.value = lastX.value + event.translationX;
      translateY.value = lastY.value + event.translationY;
    },
  });
  
  // Handle state changes
  const pinchStateChange = useAnimatedGestureHandler({
    onFinish: () => {
      baseScale.value = scale.value;
    },
  });
  
  const panStateChange = useAnimatedGestureHandler({
    onFinish: () => {
      lastX.value = translateX.value;
      lastY.value = translateY.value;
    },
  });
  
  return {
    scale,
    translateX,
    translateY,
    gestureHandlers: {
      pinchGestureEvent,
      pinchStateChange,
      panGestureEvent,
      panStateChange,
    },
    resetView: () => {
      scale.value = withTiming(initialZoom);
      translateX.value = withTiming(0);
      translateY.value = withTiming(0);
    },
  };
};