import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import Colors from '../../constants/Colors';

interface QuickActionButtonProps {
  title: string;
  icon: React.ReactNode;
  route?: string;
  onPress?: () => void;
  color?: string;
  gradient?: string[];
  badge?: number | string;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export default function QuickActionButton({
  title,
  icon,
  route,
  onPress,
  color = '#007AFF',
  gradient,
  badge,
  disabled = false,
  size = 'medium',
  style,
}: QuickActionButtonProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Determine sizes based on the size prop
  const getSizes = () => {
    switch (size) {
      case 'small':
        return {
          button: { width: 80, height: 80 },
          icon: { width: 40, height: 40 },
          title: { fontSize: 12 },
        };
      case 'large':
        return {
          button: { width: 120, height: 120 },
          icon: { width: 60, height: 60 },
          title: { fontSize: 16 },
        };
      case 'medium':
      default:
        return {
          button: { width: 100, height: 100 },
          icon: { width: 50, height: 50 },
          title: { fontSize: 14 },
        };
    }
  };

  const sizes = getSizes();
  
  const handlePress = () => {
    if (disabled) return;
    
    if (onPress) {
      onPress();
    } else if (route) {
      router.push(route);
    }
  };

  // Safely render the icon
  const renderIcon = () => {
    if (!icon) {
      return null;
    }
    
    return (
      <View style={[styles.iconContainer, sizes.icon, { backgroundColor: color + '15' }]}>
        {icon}
      </View>
    );
  };
  
  return (
    <TouchableOpacity
      style={[styles.button, sizes.button, style, disabled && styles.disabled]}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      {renderIcon()}
      
      <Text 
        style={[
          styles.title, 
          sizes.title, 
          { 
            color: colors.text,
            opacity: disabled ? 0.5 : 1 
          }
        ]}
        numberOfLines={2}
      >
        {title}
      </Text>
      
      {badge ? (
        <View style={[styles.badge, { backgroundColor: color || colors.primary }]}>
          <Text style={styles.badgeText}>
            {typeof badge === 'number' && badge > 99 ? '99+' : badge}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 12,
  },
  disabled: {
    opacity: 0.6,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginBottom: 8,
  },
  title: {
    textAlign: 'center',
    fontWeight: '500',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});