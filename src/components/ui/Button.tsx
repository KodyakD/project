import React from 'react';
import { 
  Text, 
  Pressable, 
  StyleSheet, 
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  useColorScheme
} from 'react-native';
import Colors from '@/constants/Colors';

interface ButtonProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'emergency';
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  onPress,
  loading = false,
  disabled = false,
  fullWidth = false,
  size = 'md',
  style,
  textStyle,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Get the background color based on variant
  const getBackgroundColor = () => {
    if (disabled) return colorScheme === 'dark' ? '#334155' : '#e2e8f0';
    
    switch (variant) {
      case 'primary':
        return colors.tint;
      case 'secondary':
        return colorScheme === 'dark' ? '#334155' : '#f1f5f9';
      case 'outline':
      case 'ghost':
        return 'transparent';
      case 'emergency':
        return colors.emergencyRed;
      default:
        return colors.tint;
    }
  };
  
  // Get the text color based on variant
  const getTextColor = () => {
    if (disabled) return colorScheme === 'dark' ? '#94a3b8' : '#94a3b8';
    
    switch (variant) {
      case 'primary':
        return '#FFFFFF';
      case 'secondary':
        return colors.text;
      case 'outline':
        return colors.tint;
      case 'ghost':
        return colors.text;
      case 'emergency':
        return '#FFFFFF';
      default:
        return '#FFFFFF';
    }
  };
  
  // Get the border color and width
  const getBorderStyle = () => {
    if (variant === 'outline') {
      return {
        borderWidth: 1,
        borderColor: disabled ? 
          (colorScheme === 'dark' ? '#334155' : '#e2e8f0') : 
          colors.tint,
      };
    }
    return {};
  };
  
  // Get the size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingVertical: 6,
          paddingHorizontal: 12,
          borderRadius: 6,
        };
      case 'lg':
        return {
          paddingVertical: 14,
          paddingHorizontal: 24,
          borderRadius: 10,
        };
      case 'md':
      default:
        return {
          paddingVertical: 10,
          paddingHorizontal: 16,
          borderRadius: 8,
        };
    }
  };
  
  // Get font size based on button size
  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return 14;
      case 'lg':
        return 18;
      case 'md':
      default:
        return 16;
    }
  };
  
  return (
    <Pressable
      style={({pressed}) => [
        styles.button,
        getSizeStyles(),
        getBorderStyle(),
        {
          backgroundColor: getBackgroundColor(),
          opacity: (pressed || disabled) ? 0.8 : 1,
          width: fullWidth ? '100%' : 'auto',
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={getTextColor()} 
        />
      ) : (
        <Text 
          style={[
            styles.text, 
            { 
              color: getTextColor(),
              fontSize: getFontSize(),
            },
            textStyle
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  text: {
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
});

export default Button;