import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

type StatusType = 'critical' | 'warning' | 'success' | 'info' | 'neutral';

interface StatusBadgeProps {
  status: StatusType;
  label: string;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export default function StatusBadge({ 
  status, 
  label, 
  size = 'medium',
  style 
}: StatusBadgeProps) {
  const { colors, isDark } = useTheme();
  
  // Get background color based on status
  const getBackgroundColor = () => {
    const opacity = isDark ? '30' : '15';
    
    switch(status) {
      case 'critical': return `${colors.critical}${opacity}`;
      case 'warning': return `${colors.warning}${opacity}`;
      case 'success': return `${colors.success}${opacity}`;
      case 'info': return `${colors.info}${opacity}`;
      case 'neutral': 
      default: return `${colors.neutral}${opacity}`;
    }
  };
  
  // Get text/border color based on status
  const getColor = () => {
    switch(status) {
      case 'critical': return colors.critical;
      case 'warning': return colors.warning;
      case 'success': return colors.success;
      case 'info': return colors.info;
      case 'neutral': 
      default: return colors.neutral;
    }
  };
  
  // Get size
  const getSize = () => {
    switch(size) {
      case 'small': return {
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 10,
        fontSize: 10,
      };
      case 'large': return {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        fontSize: 14,
      };
      default: return {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
        fontSize: 12,
      };
    }
  };
  
  const sizeStyles = getSize();
  
  return (
    <View style={[
      styles.badge,
      {
        backgroundColor: getBackgroundColor(),
        borderColor: getColor(),
        paddingVertical: sizeStyles.paddingVertical,
        paddingHorizontal: sizeStyles.paddingHorizontal,
        borderRadius: sizeStyles.borderRadius,
      },
      style
    ]}>
      <Text style={[
        styles.text,
        { 
          color: getColor(),
          fontSize: sizeStyles.fontSize,
        }
      ]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  text: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
});