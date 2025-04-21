import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ViewStyle, useColorScheme } from 'react-native';
import { AlertCircle } from '@expo/vector-icons/Feather';
import Colors from '@/constants/Colors';

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
  fullScreen?: boolean;
  style?: ViewStyle;
}

export function ErrorDisplay({ message, onRetry, fullScreen, style }: ErrorDisplayProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (fullScreen) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: colors.background }, style]}>
        <AlertCircle size={50} color={colors.error} />
        <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
        {onRetry && (
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={onRetry}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <AlertCircle size={30} color={colors.error} />
      <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
      {onRetry && (
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={onRetry}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    margin: 16,
  },
  message: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontWeight: 'bold',
  },
});