import React from 'react';
import { ActivityIndicator, Text, View, StyleSheet } from 'react-native';

export function Loading({ fullScreen, message }) {
  // No hooks, just direct component rendering
  return (
    <View style={fullScreen ? [styles.container, styles.fullScreen] : styles.container}>
      <ActivityIndicator size="large" color="#0066FF" />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreen: {
    flex: 1,
  },
  message: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
    color: '#666666',
  },
});