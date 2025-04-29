import { useColorScheme } from 'react-native';

const Colors = {
  light: {
    text: '#111827',             // Foreground text
    background: '#FFFFFF',       // Background
    tint: '#E11D48',             // Primary color - Emergency red
    neutral: '#9CA3AF',          // Neutral gray
    border: '#E5E7EB',           // Border color
    cardBackground: '#FFFFFF',   // Card background
    danger: '#DC2626',           // Critical red
    emergencyRed: '#E11D48',     // Primary red
    success: '#16A34A',          // Success green
    primary: '#E11D48',          // Primary - same as the web app
    secondary: '#3B82F6',        // Secondary blue - same as the web app
    textSecondary: '#6B7280',    // Secondary text
    card: '#FFFFFF',             // Card background
    error: '#DC2626',            // Error/critical
    warning: '#F59E0B',          // Warning yellow
    info: '#0EA5E9',             // Info blue
  },
  dark: {
    text: '#F9FAFB',             // Dark mode text
    background: '#111827',       // Dark background
    tint: '#E11D48',             // Primary red stays the same in dark mode
    neutral: '#6B7280',          // Dark neutral
    border: '#374151',           // Dark border
    cardBackground: '#1F2937',   // Dark card background
    danger: '#DC2626',           // Critical stays visible in dark
    emergencyRed: '#E11D48',     // Primary red
    success: '#16A34A',          // Success green
    primary: '#E11D48',          // Primary color
    secondary: '#3B82F6',        // Secondary blue
    textSecondary: '#9CA3AF',    // Secondary text in dark mode
    card: '#1F2937',             // Card background
    error: '#DC2626',            // Error red
    warning: '#F59E0B',          // Warning yellow
    info: '#0EA5E9',             // Info blue
  },
};

export default Colors;

export function useThemeColor() {
  const colorScheme = useColorScheme();
  return Colors[colorScheme === 'dark' ? 'dark' : 'light'];
}