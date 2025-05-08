import React, { useCallback, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity, 
  Text,
  BackHandler,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
  useAnimatedGestureHandler,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';

interface BottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  snapPoints?: string[]; // percentage heights like ['25%', '50%', '90%']
  initialSnapIndex?: number;
  title?: string;
  children: React.ReactNode;
  showDragIndicator?: boolean;
  showCloseButton?: boolean;
  enableDismiss?: boolean;
  enablePanGesture?: boolean;
  headerComponent?: React.ReactNode;
  footerComponent?: React.ReactNode;
  backdropOpacity?: number;
}

export default function BottomSheet({
  isVisible,
  onClose,
  snapPoints = ['50%'],
  initialSnapIndex = 0,
  title,
  children,
  showDragIndicator = true,
  showCloseButton = true,
  enableDismiss = true,
  enablePanGesture = true,
  headerComponent,
  footerComponent,
  backdropOpacity = 0.5,
}: BottomSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  
  // Convert snap points to pixel values
  const snapPointsPixels = snapPoints.map(point => {
    const percentage = parseInt(point.replace('%', ''));
    return (windowHeight * percentage) / 100;
  });
  
  // Animation values
  const translateY = useSharedValue(windowHeight);
  const backdropOpacityValue = useSharedValue(0);
  
  // Calculate the initial snap point value
  const initialSnapPoint = snapPointsPixels[initialSnapIndex] || snapPointsPixels[0];

  // Handle visibility changes
  useEffect(() => {
    if (isVisible) {
      // Show the bottom sheet
      backdropOpacityValue.value = withTiming(backdropOpacity, { duration: 300 });
      translateY.value = withTiming(windowHeight - initialSnapPoint, { 
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    } else {
      // Hide the bottom sheet
      backdropOpacityValue.value = withTiming(0, { duration: 300 });
      translateY.value = withTiming(windowHeight, { 
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }
  }, [isVisible, windowHeight, initialSnapPoint, backdropOpacity]);

  // Handle back button press
  useEffect(() => {
    const handleBackPress = () => {
      if (isVisible && enableDismiss) {
        onClose();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [isVisible, onClose, enableDismiss]);

  // Gesture handler for dragging the bottom sheet
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx) => {
      if (!enablePanGesture) return;
      
      const newTranslateY = ctx.startY + event.translationY;
      
      // Don't allow dragging above the highest snap point
      const highestSnapPoint = snapPointsPixels[snapPointsPixels.length - 1] || 0;
      const minTranslateY = windowHeight - highestSnapPoint;
      
      translateY.value = Math.max(newTranslateY, minTranslateY);
    },
    onEnd: (event, _) => {
      if (!enablePanGesture) return;
      
      const currentSheetPosition = windowHeight - translateY.value;
      
      // Determine which snap point to snap to based on velocity and position
      let targetSnapPoint;
      
      if (event.velocityY > 500) {
        // If flicking down quickly, dismiss the sheet
        if (enableDismiss) {
          runOnJS(onClose)();
          return;
        } else {
          // Otherwise, snap to the lowest snap point
          targetSnapPoint = snapPointsPixels[0];
        }
      } else if (event.velocityY < -500) {
        // If flicking up quickly, snap to the highest snap point
        targetSnapPoint = snapPointsPixels[snapPointsPixels.length - 1];
      } else {
        // Find the closest snap point
        let closestSnapPointIndex = 0;
        let minDistance = Infinity;
        
        snapPointsPixels.forEach((snapPoint, index) => {
          const distance = Math.abs(snapPoint - currentSheetPosition);
          if (distance < minDistance) {
            minDistance = distance;
            closestSnapPointIndex = index;
          }
        });
        
        targetSnapPoint = snapPointsPixels[closestSnapPointIndex];
      }
      
      // If the closest snap point is the lowest and the user is dragging down with some velocity
      if (targetSnapPoint === snapPointsPixels[0] && event.velocityY > 200 && enableDismiss) {
        // Dismiss the sheet
        runOnJS(onClose)();
        return;
      }
      
      // Otherwise, snap to the determined snap point
      translateY.value = withTiming(windowHeight - targetSnapPoint, {
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    },
  });

  // Animated styles
  const backdropAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: backdropOpacityValue.value,
    };
  });

  const sheetAnimatedStyle = useAnimatedStyle(() => {
    const borderRadius = interpolate(
      translateY.value,
      [windowHeight - (snapPointsPixels[snapPointsPixels.length - 1] || 0), windowHeight],
      [20, 20],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateY: translateY.value }],
      borderTopLeftRadius: borderRadius,
      borderTopRightRadius: borderRadius,
    };
  });

  return (
    <Animated.View 
      style={[
        styles.backdrop,
        { display: isVisible ? 'flex' : 'none' },
        backdropAnimatedStyle,
      ]}
      pointerEvents={isVisible ? 'auto' : 'none'}
    >
      <TouchableOpacity
        style={styles.backdropTouchable}
        activeOpacity={1}
        onPress={enableDismiss ? onClose : undefined}
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={insets.bottom}
      >
        <PanGestureHandler onGestureEvent={gestureHandler} enabled={enablePanGesture}>
          <Animated.View
            style={[
              styles.sheetContainer,
              {
                backgroundColor: colors.background,
                paddingBottom: Math.max(insets.bottom, 16),
              },
              sheetAnimatedStyle,
            ]}
          >
            {/* Drag indicator and header */}
            <View style={styles.header}>
              {showDragIndicator && (
                <View style={[styles.dragIndicator, { backgroundColor: colors.border }]} />
              )}
              
              <View style={styles.headerContent}>
                {title && (
                  <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                    {title}
                  </Text>
                )}
                
                {headerComponent}
                
                {showCloseButton && (
                  <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <Feather name="x" size={20} color={colors.text} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            
            {/* Content */}
            <ScrollView
              style={styles.contentContainer}
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {children}
            </ScrollView>
            
            {/* Footer */}
            {footerComponent && (
              <View style={[styles.footer, { borderTopColor: colors.border }]}>
                {footerComponent}
              </View>
            )}
          </Animated.View>
        </PanGestureHandler>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardAvoidingView: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    width: '100%',
    minHeight: 200,
    maxHeight: '90%',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  header: {
    paddingTop: 8,
    paddingHorizontal: 20,
  },
  dragIndicator: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  closeButton: {
    padding: 4,
  },
  contentContainer: {
    flexGrow: 1,
  },
  content: {
    padding: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
});