import React from 'react';
import { 
  Pressable, 
  StyleSheet, 
  useColorScheme,
  View,
} from 'react-native';
import { Sun, Moon } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Colors from '@/constants/Colors';

export default function ThemeToggle() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme ?? 'light'];
  
  const iconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: withSequence(
            withTiming('0deg', { duration: 0 }),
            withDelay(
              150,
              withTiming(isDark ? '360deg' : '-360deg', {
                duration: 300,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
              })
            )
          ),
        },
        {
          scale: withSequence(
            withTiming(0.8, { duration: 150 }),
            withTiming(1, { duration: 150 })
          ),
        },
      ],
      opacity: withSequence(
        withTiming(0.5, { duration: 150 }),
        withTiming(1, { duration: 150 })
      ),
    };
  });

  const containerStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(
        isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        { duration: 200 }
      ),
    };
  });

  const toggleTheme = () => {
    // This would typically integrate with a theme context or system settings
    // For now, we'll just show the animation
    console.log('Toggle theme');
  };

  return (
    <Pressable onPress={toggleTheme}>
      <Animated.View style={[styles.container, containerStyle]}>
        <Animated.View style={iconStyle}>
          {isDark ? (
            <Moon size={20} color={colors.text} />
          ) : (
            <Sun size={20} color={colors.text} />
          )}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});