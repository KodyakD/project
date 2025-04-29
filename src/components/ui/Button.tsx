import React from 'react';
import { 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  ActivityIndicator, 
  View,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps 
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

type ButtonVariant = 
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'outline'
  | 'ghost'
  | 'emergency';

type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  title,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled = false,
  style,
  textStyle,
  ...props
}: ButtonProps) {
  const { colors } = useTheme();
  
  // Get background color based on variant
  const getBackgroundColor = () => {
    if (disabled) return '#E5E7EB'; // Gray-200
    
    switch(variant) {
      case 'primary': return colors.primary;
      case 'secondary': return colors.secondary;
      case 'success': return colors.success;
      case 'warning': return colors.warning;
      case 'danger': return colors.error;
      case 'emergency': return colors.emergencyRed;
      case 'outline': return 'transparent';
      case 'ghost': return 'transparent';
      default: return colors.primary;
    }
  };
  
  // Get text color based on variant
  const getTextColor = () => {
    if (disabled) return '#9CA3AF'; // Gray-400
    
    switch(variant) {
      case 'outline': return colors.primary;
      case 'ghost': return colors.text;
      case 'primary':
      case 'secondary':
      case 'success':
      case 'warning':
      case 'danger':
      case 'emergency':
        return '#FFFFFF';
      default: return '#FFFFFF';
    }
  };
  
  // Get border style
  const getBorderStyle = () => {
    if (variant === 'outline') {
      return {
        borderWidth: 1,
        borderColor: colors.primary,
      };
    }
    return {};
  };
  
  // Get size styles
  const getSize = () => {
    switch(size) {
      case 'small': return {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
      };
      case 'large': return {
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 10,
      };
      default: return {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
      };
    }
  };
  
  // Get text size
  const getTextSize = () => {
    switch(size) {
      case 'small': return 14;
      case 'large': return 18;
      default: return 16;
    }
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        getSize(),
        getBorderStyle(),
        { backgroundColor: getBackgroundColor() },
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <View style={styles.contentContainer}>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          
          <Text style={[
            styles.text, 
            { color: getTextColor(), fontSize: getTextSize() },
            textStyle
          ]}>
            {title}
          </Text>
          
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});