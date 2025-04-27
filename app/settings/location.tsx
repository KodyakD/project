import React, { useState } from 'react';
import { StyleSheet, View, Text, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Colors from '../../src/constants/Colors';
import Card from '../../src/components/ui/Card';

export default function LocationSettings() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [backgroundLocation, setBackgroundLocation] = useState(false);
  const [highAccuracy, setHighAccuracy] = useState(true);
  
  const requestLocationPermissions = () => {
    // This would handle requesting permissions in a real app
    alert('Location permissions requested');
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Location Services',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView style={styles.content}>
        <Text style={[styles.sectionHeader, { color: colors.text }]}>Permissions</Text>
        <Card style={styles.card}>
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Location Services</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Enable location services for this app
              </Text>
            </View>
            <Switch
              value={locationEnabled}
              onValueChange={setLocationEnabled}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor="#f4f3f4"
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Background Location</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Allow the app to access location in the background
              </Text>
            </View>
            <Switch
              value={backgroundLocation}
              onValueChange={setBackgroundLocation}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor="#f4f3f4"
              disabled={!locationEnabled}
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomWidth: 0 }]}
            onPress={requestLocationPermissions}
          >
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Request Permissions</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Request or update location permissions
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </Card>
        
        <Text style={[styles.sectionHeader, { color: colors.text }]}>Accuracy Settings</Text>
        <Card style={styles.card}>
          <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>High Accuracy Mode</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Use GPS, Wi-Fi, and cellular networks for location (uses more battery)
              </Text>
            </View>
            <Switch
              value={highAccuracy}
              onValueChange={setHighAccuracy}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor="#f4f3f4"
              disabled={!locationEnabled}
            />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  card: {
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  settingContent: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 14,
    marginTop: 4,
  },
});