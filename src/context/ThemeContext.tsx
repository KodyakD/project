import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../constants/Colors';

// Theme types
export type ThemeType = 'light' | 'dark' | 'system';

// Theme context interface
interface ThemeContextType {
  theme: ThemeType;
  isDark: boolean;
  colors: typeof Colors.light | typeof Colors.dark;
  setTheme: (theme: ThemeType) => void;
}

// Create the theme context with default values
export const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  isDark: false,
  colors: Colors.light,
  setTheme: () => {},
});

// Theme storage key
const THEME_STORAGE_KEY = 'user_theme_preference';

// Theme provider props
interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Theme Provider Component
 * Provides theme context and handles theme changes
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Get system color scheme
  const systemColorScheme = useColorScheme();
  
  // State for theme preference (light, dark, or system)
  const [theme, setThemeState] = useState<ThemeType>('system');
  
  // Compute the effective theme (taking into account the system preference if theme is 'system')
  const effectiveTheme = theme === 'system' ? systemColorScheme || 'light' : theme;
  const isDark = effectiveTheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  
  // Load theme preference from storage on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme) {
          setThemeState(savedTheme as ThemeType);
        }
      } catch (error) {
        console.log('Error loading theme preference:', error);
      }
    };
    
    loadTheme();
  }, []);
  
  // Set theme and save to storage
  const setTheme = async (newTheme: ThemeType) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.log('Error saving theme preference:', error);
    }
  };
  
  // Context value
  const contextValue: ThemeContextType = {
    theme,
    isDark,
    colors,
    setTheme,
  };
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Custom hook to use the theme context
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}; 