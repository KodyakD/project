import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

type QuickActionButtonProps = {
  title: string;
  icon: React.ReactNode;
  route?: string;
  onPress?: () => void;
  color?: string;
  gradient?: string[];
  badge?: number | string;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  disabled?: boolean;
  testID?: string;
  textStyle?: TextStyle;
};

export default function QuickActionButton({
  title,
  icon,
  route,
  onPress,
  color,
  gradient,
  badge,
  size = 'medium',
  style,
  disabled = false,
  testID,
  textStyle,
}: QuickActionButtonProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Calculate size based on prop
  const getSize = () => {
    switch (size) {
      case 'small':
        return { width: 80, height: 80, iconSize: 24 };
      case 'medium':
        return { width: 110, height: 110, iconSize: 32 };
      case 'large':
        return { width: 140, height: 140, iconSize: 40 };
      default:
        return { width: 110, height: 110, iconSize: 32 };
    }
  };
  
  const { width, height, iconSize } = getSize();
  const buttonColor = color || colors.primary;

  // Handle button press
  const handlePress = () => {
    if (disabled) return;
    
    if (onPress) {
      onPress();
    } else if (route) {
      router.push(route);
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        { width, height },
        disabled && styles.disabled,
        style
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={disabled}
      testID={testID}
    >
      {gradient ? (
        <LinearGradient
          colors={gradient}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.inner}>
            <View style={styles.iconContainer}>
              {icon}
            </View>
            <Text 
              style={[
                styles.title, 
                { color: colors.white },
                textStyle
              ]}
              numberOfLines={2}
            >
              {title}
            </Text>
          </View>
        </LinearGradient>
      ) : (
        <View 
          style={[
            styles.inner, 
            { 
              backgroundColor: buttonColor + '15', // 15% opacity
              borderColor: buttonColor
            }
          ]}
        >
          <View style={styles.iconContainer}>
            {icon}
          </View>
          <Text 
            style={[
              styles.title, 
              { color: buttonColor },
              textStyle
            ]}
            numberOfLines={2}
          >
            {title}
          </Text>
        </View>
      )}
      
      {badge !== undefined && badge !== null && (
        <View style={[styles.badge, { backgroundColor: colors.critical }]}>
          <Text style={styles.badgeText}>
            {typeof badge === 'number' && badge > 99 ? '99+' : badge}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    margin: 8,
  },
  gradient: {
    flex: 1,
    borderRadius: 16,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  iconContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  disabled: {
    opacity: 0.5,
  },
}); 