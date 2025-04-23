import React, { useState, useCallback } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { PanGestureHandler, PinchGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

interface MapViewerProps {
  svgContent: string;
  width: number;
  height: number;
  onZoomChange?: (scale: number) => void;
}

const MapViewer: React.FC<MapViewerProps> = ({ 
  svgContent, 
  width, 
  height, 
  onZoomChange 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const lastTranslateX = useSharedValue(0);
  const lastTranslateY = useSharedValue(0);
  
  // Create a HTML wrapper for SVG content
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            background-color: #f5f5f5;
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100%;
          }
          .map-container {
            max-width: 100%;
            max-height: 100%;
          }
        </style>
      </head>
      <body>
        <div class="map-container">
          ${svgContent}
        </div>
      </body>
    </html>
  `;
  
  // Handle pinch gesture for zooming
  const pinchHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      ctx.startScale = scale.value;
    },
    onActive: (event, ctx) => {
      scale.value = Math.max(0.5, Math.min(5, ctx.startScale * event.scale));
      if (onZoomChange) {
        // Note: this is a workaround as we can't call non-worklet functions directly
        // In a real app, you'd use runOnJS to call the onZoomChange callback
        // This is simplified for this example
      }
    },
    onEnd: () => {
      savedScale.value = scale.value;
    },
  });
  
  // Handle pan gesture for moving the map
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
  
  // Animated styles for the transform
  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });
  
  // Calculate the aspect ratio and dimensions
  const screenWidth = Dimensions.get('window').width;
  const aspectRatio = width / height;
  const displayWidth = screenWidth;
  const displayHeight = screenWidth / aspectRatio;
  
  const onLoadEnd = useCallback(() => {
    setIsLoaded(true);
    
    // Update the parent component with the initial scale
    if (onZoomChange) {
      onZoomChange(1);
    }
  }, [onZoomChange]);
  
  return (
    <PinchGestureHandler
      onGestureEvent={pinchHandler}
      onHandlerStateChange={({ nativeEvent }) => {
        if (nativeEvent.state === State.END && onZoomChange) {
          onZoomChange(scale.value);
        }
      }}
    >
      <Animated.View style={styles.container}>
        <PanGestureHandler onGestureEvent={panHandler}>
          <Animated.View style={[styles.mapWrapper, animatedStyles]}>
            <WebView
              originWhitelist={['*']}
              source={{ html: htmlContent }}
              style={{
                width: displayWidth,
                height: displayHeight,
              }}
              onLoadEnd={onLoadEnd}
              scrollEnabled={false}
              bounces={false}
              javaScriptEnabled
            />
          </Animated.View>
        </PanGestureHandler>
      </Animated.View>
    </PinchGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
  },
  mapWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
  },
});

export default MapViewer; 