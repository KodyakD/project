import React, { useState } from 'react';
import { StyleSheet, View, Text, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import Colors from '../../src/constants/Colors';
import Card from '../../src/components/ui/Card';

export default function NotificationSettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Toggle states for notification preferences
  const [emergencyAlerts, setEmergencyAlerts] = useState(true);
  const [incidentUpdates, setIncidentUpdates] = useState(true);
  const [evacuationGuides, setEvacuationGuides] = useState(true);
  const [campusAnnouncements, setCampusAnnouncements] = useState(true);
  const [rescuerAssignments, setRescuerAssignments] = useState(false);
  const [safetyTips, setSafetyTips] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack.Screen
        options={{
          title: 'Notification Settings',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView style={styles.content}>
        <Text style={[styles.sectionHeader, { color: colors.text }]}>Alert Categories</Text>
        <Card style={styles.card}>
          {/* Emergency Alerts - Cannot be disabled */}
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Emergency Alerts</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Critical alerts that cannot be disabled
              </Text>
            </View>
            <Switch
              value={emergencyAlerts}
              disabled={true}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={'#f4f3f4'}
            />
          </View>

          {/* Incident Updates */}
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Incident Updates</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Updates about ongoing incidents
              </Text>
            </View>
            <Switch
              value={incidentUpdates}
              onValueChange={setIncidentUpdates}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={'#f4f3f4'}
            />
          </View>

          {/* Evacuation Guides */}
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Evacuation Guides</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Instructions during evacuation events
              </Text>
            </View>
            <Switch
              value={evacuationGuides}
              onValueChange={setEvacuationGuides}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={'#f4f3f4'}
            />
          </View>

          {/* Campus Announcements */}
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Campus Announcements
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                General campus safety information
              </Text>
            </View>
            <Switch
              value={campusAnnouncements}
              onValueChange={setCampusAnnouncements}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={'#f4f3f4'}
            />
          </View>

          {/* Rescuer Assignments */}
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Rescuer Assignments</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Tasks assigned to you as a rescuer
              </Text>
            </View>
            <Switch
              value={rescuerAssignments}
              onValueChange={setRescuerAssignments}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={'#f4f3f4'}
            />
          </View>

          {/* Safety Tips */}
          <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Safety Tips</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Regular safety information and tips
              </Text>
            </View>
            <Switch
              value={safetyTips}
              onValueChange={setSafetyTips}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={'#f4f3f4'}
            />
          </View>
        </Card>

        <Text style={[styles.sectionHeader, { color: colors.text }]}>Alert Methods</Text>
        <Card style={styles.card}>
          {/* Sound Alerts */}
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Sound Alerts</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Play sounds for important notifications
              </Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={'#f4f3f4'}
            />
          </View>

          {/* Vibration */}
          <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Vibration</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Vibrate device for notifications
              </Text>
            </View>
            <Switch
              value={vibrationEnabled}
              onValueChange={setVibrationEnabled}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={'#f4f3f4'}
            />
          </View>
        </Card>

        <Text style={[styles.note, { color: colors.textSecondary }]}>
          Note: Emergency alerts will always be delivered regardless of your settings to ensure your
          safety.
        </Text>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  note: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
    marginBottom: 32,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});