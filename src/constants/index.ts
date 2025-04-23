import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Color palette
export const COLORS = {
  // Primary colors
  primary: '#FF2C55', // Fire red
  secondary: '#2C55FF', // Blue
  
  // Accent colors
  accent1: '#FF9500', // Orange (warning)
  accent2: '#34C759', // Green (success)
  
  // Status colors
  success: '#34C759', // Green
  error: '#FF3B30', // Red
  warning: '#FF9500', // Orange
  info: '#007AFF', // Blue
  
  // Neutral colors
  black: '#000000',
  darkGray: '#333333',
  gray: '#666666',
  lightGray: '#DDDDDD',
  white: '#FFFFFF',
  
  // Background colors
  background: '#FFFFFF',
  card: '#F9F9F9',
  
  // Text colors
  text: '#333333',
  textSecondary: '#666666',
  textLight: '#999999',
  
  // Transparent colors
  transparent: 'transparent',
  transparentBlack: 'rgba(0, 0, 0, 0.5)',
  transparentWhite: 'rgba(255, 255, 255, 0.8)',
  
  // Dark mode colors
  backgroundDark: '#121212',
  cardDark: '#1E1E1E',
  textDark: '#F0F0F0',
  textSecondaryDark: '#B0B0B0',
};

// Font styles
export const FONTS = {
  // Headings
  h1: {
    fontFamily: 'System',
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
  },
  h2: {
    fontFamily: 'System',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
  },
  h3: {
    fontFamily: 'System',
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
  },
  h4: {
    fontFamily: 'System',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  h5: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
  },
  
  // Body text
  body1: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  body2: {
    fontFamily: 'System',
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  },
  body3: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  body4: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
  },
  
  // Button text
  button: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  buttonSmall: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  
  // Caption text
  caption: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
};

// Common sizes
export const SIZES = {
  // Screen dimensions
  width,
  height,
  
  // Spacing
  padding: 16,
  margin: 16,
  radius: 8,
  radiusLarge: 16,
  
  // Icon sizes
  iconSmall: 16,
  iconMedium: 24,
  iconLarge: 32,
  
  // Button sizes
  buttonHeight: 48,
  buttonHeightSmall: 36,
  
  // Input sizes
  inputHeight: 48,
  
  // Border widths
  borderWidth: 1,
  borderWidthMedium: 2,
  borderWidthLarge: 3,
  
  // Tab bar height
  tabBarHeight: 60,
};

// Layouts
export const LAYOUT = {
  row: {
    flexDirection: 'row',
  },
  column: {
    flexDirection: 'column',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  shadow: {
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  shadowMedium: {
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
};

export default {
  COLORS,
  FONTS,
  SIZES,
  LAYOUT,
}; 