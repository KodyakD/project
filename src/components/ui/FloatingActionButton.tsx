import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Text, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { AlertTriangle } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

interface FloatingActionButtonProps {
  icon?: React.ReactNode;
  onPress?: () => void;
  label?: string;
  color?: string;
  position?: 'bottomRight' | 'bottomLeft' | 'bottomCenter';
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export function FloatingActionButton({
  icon,
  onPress,
  label = 'Report Incident',
  color,
  position = 'bottomRight',
  size = 'large',
  showLabel = true,
}: FloatingActionButtonProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const [scaleAnim] = useState(new Animated.Value(1));
  
  // Button size based on size prop
  const getButtonSize = () => {
    switch (size) {
      case 'small': return 50;
      case 'medium': return 60;
      case 'large': return 70;
      default: return 60;
    }
  };
  
  // Button position based on position prop
  const getButtonPosition = () => {
    switch (position) {
      case 'bottomLeft': return { bottom: 80, left: 20 };
      case 'bottomCenter': return { 
        bottom: 80, 
        alignSelf: 'center', 
        left: Dimensions.get('window').width / 2 - getButtonSize() / 2 
      };
      case 'bottomRight':
      default: return { bottom: 80, right: 20 };
    }
  };

  const handlePress = () => {
    // Animation on press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
    
    // Call the provided onPress or default to navigation
    if (onPress) {
      onPress();
    } else {
      router.push('/report/incident');
    }
  };

  const buttonSize = getButtonSize();
  const buttonColor = color || colors.emergencyRed;

  return (
    <View style={[styles.container, getButtonPosition()]}>
      {showLabel && label && (
        <View style={[styles.labelContainer, { backgroundColor: buttonColor }]}>
          <Text style={styles.label}>{label}</Text>
        </View>
      )}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[
            styles.button, 
            { 
              backgroundColor: buttonColor,
              width: buttonSize,
              height: buttonSize,
              borderRadius: buttonSize / 2
            }
          ]}
          onPress={handlePress}
          activeOpacity={0.8}>
          {icon || <AlertTriangle size={24} color="white" />}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 100,
    alignItems: 'center',
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  labelContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  label: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  }
});