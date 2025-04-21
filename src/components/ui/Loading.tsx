import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View, ViewStyle, useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';

interface LoadingProps {
  size?: 'small' | 'large';
  message?: string;
  fullScreen?: boolean;
  style?: ViewStyle;
}

export function Loading({ size = 'large', message, fullScreen, style }: LoadingProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (fullScreen) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: colors.background }, style]}>
        <ActivityIndicator size={size} color={colors.primary} />
        {message && <Text style={[styles.message, { color: colors.text }]}>{message}</Text>}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={colors.primary} />
      {message && <Text style={[styles.message, { color: colors.text }]}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
});