import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, useColorScheme } from 'react-native';
import Colors from '../../constants/Colors';

type CardProps = {
  children: ReactNode;
  style?: ViewStyle;
  elevation?: number;
  variant?: 'elevated' | 'outlined' | 'filled';
};

type CardChildProps = {
  children: ReactNode;
  style?: ViewStyle;
};

export default function Card({ children, style, elevation = 2, variant = 'elevated' }: CardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Get variant-specific styles
  const variantStyle = getVariantStyle(variant, colors, colorScheme === 'dark');
  
  // Get shadow styles (only for elevated variant)
  const shadowStyles = variant === 'elevated' 
    ? getShadowStyles(elevation, colorScheme === 'dark') 
    : {};

  return (
    <View
      style={[
        styles.card,
        variantStyle,
        shadowStyles,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function CardHeader({ children, style }: CardChildProps) {
  return (
    <View style={[styles.header, style]}>
      {children}
    </View>
  );
}

export function CardContent({ children, style }: CardChildProps) {
  return (
    <View style={[styles.content, style]}>
      {children}
    </View>
  );
}

export function CardFooter({ children, style }: CardChildProps) {
  return (
    <View style={[styles.footer, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginVertical: 8,
    overflow: 'hidden',
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  content: {
    padding: 16,
  },
  footer: {
    padding: 16,
    paddingTop: 8,
  },
});

// Helper function to get variant-specific styles
function getVariantStyle(variant: CardProps['variant'], colors: any, isDark: boolean) {
  switch (variant) {
    case 'outlined':
      return {
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
      };
    case 'filled':
      return {
        backgroundColor: isDark ? colors.surface : colors.input,
        borderWidth: 0,
      };
    case 'elevated':
    default:
      return {
        backgroundColor: colors.card,
        borderWidth: 0,
      };
  }
}

// Helper function to calculate shadow styles based on elevation
function getShadowStyles(elevation: number, isDark: boolean) {
  if (isDark) {
    // Dark mode - more subtle shadows
    return {
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: elevation,
      },
      shadowOpacity: 0.15,
      shadowRadius: elevation * 1.5,
      elevation: elevation,
    };
  } else {
    // Light mode - standard shadows
    return {
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: elevation,
      },
      shadowOpacity: 0.1,
      shadowRadius: elevation * 1.5,
      elevation: elevation,
    };
  }
}