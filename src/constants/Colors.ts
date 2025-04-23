import { useColorScheme } from 'react-native';

const Colors = {
  light: {
    text: '#1F2937',
    background: '#F3F4F6',
    tint: '#0EA5E9',
    neutral: '#9CA3AF',
    border: '#E5E7EB',
    cardBackground: '#FFFFFF',
    danger: '#EF4444',
    emergencyRed: '#DC2626',
    success: '#10B981',
    primary: '#0EA5E9',
    textSecondary: '#6B7280',
    card: '#FFFFFF',
    error: '#EF4444',
    warning: '#F59E0B',
  },
  dark: {
    text: '#F9FAFB',
    background: '#111827',
    tint: '#0EA5E9',
    neutral: '#6B7280',
    border: '#374151',
    cardBackground: '#1F2937',
    danger: '#EF4444',
    emergencyRed: '#DC2626',
    success: '#10B981',
    primary: '#0EA5E9',
    textSecondary: '#9CA3AF',
    card: '#1F2937',
    error: '#EF4444',
    warning: '#F59E0B',
  },
};

export default Colors;

export function useThemeColor() {
  const colorScheme = useColorScheme();
  return Colors[colorScheme === 'dark' ? 'dark' : 'light'];
}