import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format } from 'date-fns'; // This import was missing

export default function IncidentsScreen() {
  return (
    <View style={styles.container}>
      <Text>Incidents Screen</Text>
      <Text>Current date: {format(new Date(), 'PPP')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});