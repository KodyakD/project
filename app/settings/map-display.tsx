import React, { useState } from 'react';
import { StyleSheet, View, Text, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Colors from '../../src/constants/Colors';
import Card from '../../src/components/ui/Card';

export default function MapDisplaySettings() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [showIncidents, setShowIncidents] = useState(true);
  const [showEvacuationRoutes, setShowEvacuationRoutes] = useState(true);
  const [showSafetyEquipment, setShowSafetyEquipment] = useState(true);
  const [show3DBuildings, setShow3DBuildings] = useState(false);
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Map Display',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView style={styles.content}>
        <Text style={[styles.sectionHeader, { color: colors.text }]}>Map Elements</Text>
        <Card style={styles.card}>
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Show Incidents</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Display reported incidents on the map
              </Text>
            </View>
            <Switch
              value={showIncidents}
              onValueChange={setShowIncidents}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor="#f4f3f4"
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Show Evacuation Routes</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Display evacuation paths on the map
              </Text>
            </View>
            <Switch
              value={showEvacuationRoutes}
              onValueChange={setShowEvacuationRoutes}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor="#f4f3f4"
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Show Safety Equipment</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Display fire extinguishers, AEDs, and other safety equipment
              </Text>
            </View>
            <Switch
              value={showSafetyEquipment}
              onValueChange={setShowSafetyEquipment}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor="#f4f3f4"
            />
          </View>
        </Card>
        
        <Text style={[styles.sectionHeader, { color: colors.text }]}>Map Appearance</Text>
        <Card style={styles.card}>
          <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>3D Buildings</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Show buildings in 3D (may reduce performance)
              </Text>
            </View>
            <Switch
              value={show3DBuildings}
              onValueChange={setShow3DBuildings}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor="#f4f3f4"
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