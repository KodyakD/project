import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define theme types
type ThemeType = 'light' | 'dark' | 'system';
type ColorSchemeType = 'light' | 'dark';

// Define our color palette based on web app design system
const lightColors = {
  // Primary colors - match web app
  primary: '#E11D48',      // Emergency red
  secondary: '#3B82F6',    // Action blue
  success: '#16A34A',      // Green
  warning: '#F59E0B',      // Yellow
  info: '#0EA5E9',         // Sky blue
  error: '#DC2626',        // Critical red
  
  // Background, text and surfaces
  background: '#FFFFFF',
  card: '#FFFFFF',
  text: '#111827',        // Gray-900
  textSecondary: '#6B7280', // Gray-500
  border: '#E5E7EB',      // Gray-200
  
  // Status-specific colors
  critical: '#DC2626',     // Critical red
  emergencyRed: '#E11D48', // Emergency red
  neutral: '#9CA3AF',      // Gray-400
  danger: '#DC2626',       // Same as critical
};

const darkColors = {
  // Primary colors - match web app
  primary: '#E11D48',      // Emergency red
  secondary: '#3B82F6',    // Action blue  
  success: '#16A34A',      // Green
  warning: '#F59E0B',      // Yellow
  info: '#0EA5E9',         // Sky blue
  error: '#DC2626',        // Critical red
  
  // Background, text and surfaces - dark mode versions
  background: '#111827',   // Gray-900
  card: '#1F2937',         // Gray-800
  text: '#F9FAFB',         // Gray-50
  textSecondary: '#9CA3AF', // Gray-400
  border: '#374151',       // Gray-700
  
  // Status-specific colors
  critical: '#DC2626',     // Critical red
  emergencyRed: '#E11D48', // Emergency red
  neutral: '#6B7280',      // Gray-500
  danger: '#DC2626',       // Same as critical
};

interface ThemeContextType {
  theme: ThemeType;
  colorScheme: ColorSchemeType;
  colors: typeof lightColors;
  isDark: boolean;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const deviceColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeType>('system');
  
  // Determine actual color scheme based on theme choice and device setting
  const colorScheme: ColorSchemeType = 
    theme === 'system' ? (deviceColorScheme as ColorSchemeType || 'light') : theme;
  
  // Use the appropriate colors based on the color scheme
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  
  // Convenience boolean for dark mode checks
  const isDark = colorScheme === 'dark';
  
  // Load saved theme on startup
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setThemeState(savedTheme as ThemeType);
        }
      } catch (error) {
        console.error('Failed to load theme', error);
      }
    };
    
    loadTheme();
  }, []);
  
  // Update theme and save to storage
  const setTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('Failed to save theme', error);
    }
  };
  
  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        colorScheme, 
        colors, 
        isDark,
        setTheme 
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};