import React, { useState } from 'react';
import { StyleSheet, View, Text, Switch, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import Card from '@/components/ui/Card';
import Slider from '@react-native-community/slider';
import { Volume2, BellOff, AlertTriangle, Check } from '@expo/vector-icons/Feather';

export default function AudioSettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Sound states
  const [masterSound, setMasterSound] = useState(true);
  const [uiSounds, setUiSounds] = useState(true);
  const [alertSounds, setAlertSounds] = useState(true);
  const [emergencySounds, setEmergencySounds] = useState(true);
  const [notificationSounds, setNotificationSounds] = useState(true);
  const [silentMode, setSilentMode] = useState(false);
  
  // Volume levels
  const [masterVolume, setMasterVolume] = useState(0.8);
  const [alertVolume, setAlertVolume] = useState(1.0);
  const [uiVolume, setUiVolume] = useState(0.6);
  const [notificationVolume, setNotificationVolume] = useState(0.7);

  // Alert sound selection
  const [selectedAlertTone, setSelectedAlertTone] = useState('alert_1');
  const alertTones = [
    { id: 'alert_1', name: 'Standard Alert' },
    { id: 'alert_2', name: 'Emergency Siren' },
    { id: 'alert_3', name: 'Vibration Only' },
    { id: 'alert_4', name: 'Soft Alert' },
  ];

  const playSound = (soundId) => {
    // Here we would normally play the sound
    alert(`Playing ${soundId} sample`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack.Screen
        options={{
          title: 'Audio Settings',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView style={styles.content}>
        {/* Main Controls */}
        <Text style={[styles.sectionHeader, { color: colors.text }]}>Sound Controls</Text>
        <Card style={styles.card}>
          {/* Master Sound */}
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Master Sound</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Enable all sounds and alerts
              </Text>
            </View>
            <Switch
              value={masterSound}
              onValueChange={(value) => {
                setMasterSound(value);
                if (!value) {
                  // When turning off master sound, also turn off all other sounds
                  setUiSounds(false);
                  setAlertSounds(false);
                  setEmergencySounds(false);
                  setNotificationSounds(false);
                } else {
                  // When turning on master sound, turn on emergency sounds by default
                  setEmergencySounds(true);
                }
              }}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={'#f4f3f4'}
            />
          </View>

          {/* Silent Mode */}
          <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Silent Mode</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Use vibration only, no sounds
              </Text>
            </View>
            <Switch
              value={silentMode}
              onValueChange={setSilentMode}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={'#f4f3f4'}
              disabled={!masterSound}
            />
          </View>
        </Card>

        {/* Volume Controls */}
        <Text style={[styles.sectionHeader, { color: colors.text }]}>Volume Controls</Text>
        <Card style={styles.card}>
          {/* Master Volume */}
          <View style={styles.sliderContainer}>
            <Text style={[styles.sliderLabel, { color: colors.text }]}>Master Volume</Text>
            <View style={styles.sliderRow}>
              <Volume2 size={16} color={colors.textSecondary} />
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                step={0.1}
                value={masterVolume}
                onValueChange={setMasterVolume}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
                disabled={!masterSound}
              />
              <Volume2 size={22} color={colors.textSecondary} />
            </View>
          </View>

          {/* Alert Volume */}
          <View style={styles.sliderContainer}>
            <Text style={[styles.sliderLabel, { color: colors.text }]}>Alert Volume</Text>
            <View style={styles.sliderRow}>
              <BellOff size={16} color={colors.textSecondary} />
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                step={0.1}
                value={alertVolume}
                onValueChange={setAlertVolume}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
                disabled={!masterSound || !alertSounds}
              />
              <AlertTriangle size={22} color={colors.textSecondary} />
            </View>
          </View>

          {/* UI Sound Volume */}
          <View style={styles.sliderContainer}>
            <Text style={[styles.sliderLabel, { color: colors.text }]}>UI Sound Volume</Text>
            <View style={styles.sliderRow}>
              <Volume2 size={16} color={colors.textSecondary} />
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                step={0.1}
                value={uiVolume}
                onValueChange={setUiVolume}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
                disabled={!masterSound || !uiSounds}
              />
              <Volume2 size={22} color={colors.textSecondary} />
            </View>
          </View>

          {/* Notification Volume */}
          <View style={styles.sliderContainer}>
            <Text style={[styles.sliderLabel, { color: colors.text }]}>Notification Volume</Text>
            <View style={styles.sliderRow}>
              <Volume2 size={16} color={colors.textSecondary} />
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                step={0.1}
                value={notificationVolume}
                onValueChange={setNotificationVolume}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
                disabled={!masterSound || !notificationSounds}
              />
              <Volume2 size={22} color={colors.textSecondary} />
            </View>
          </View>
        </Card>

        {/* Sound Options */}
        <Text style={[styles.sectionHeader, { color: colors.text }]}>Sound Categories</Text>
        <Card style={styles.card}>
          {/* UI Sounds */}
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>UI Sounds</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Button clicks and interface feedback
              </Text>
            </View>
            <Switch
              value={uiSounds}
              onValueChange={setUiSounds}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={'#f4f3f4'}
              disabled={!masterSound}
            />
          </View>

          {/* Alert Sounds */}
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Alert Sounds</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Warning and status sounds
              </Text>
            </View>
            <Switch
              value={alertSounds}
              onValueChange={setAlertSounds}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={'#f4f3f4'}
              disabled={!masterSound}
            />
          </View>

          {/* Emergency Sounds - Cannot be disabled if master sound is on */}
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Emergency Sounds</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Critical emergency alerts (cannot be disabled)
              </Text>
            </View>
            <Switch
              value={emergencySounds}
              disabled={true}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={'#f4f3f4'}
            />
          </View>

          {/* Notification Sounds */}
          <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Notification Sounds</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Regular app notifications
              </Text>
            </View>
            <Switch
              value={notificationSounds}
              onValueChange={setNotificationSounds}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={'#f4f3f4'}
              disabled={!masterSound}
            />
          </View>
        </Card>

        {/* Alert Tone Selection */}
        <Text style={[styles.sectionHeader, { color: colors.text }]}>Alert Tone</Text>
        <Card style={styles.card}>
          {alertTones.map((tone) => (
            <TouchableOpacity
              key={tone.id}
              style={[
                styles.toneItem,
                tone.id === selectedAlertTone && { backgroundColor: colors.primaryLight },
                tone.id === alertTones[alertTones.length - 1].id ? { borderBottomWidth: 0 } : null,
              ]}
              onPress={() => setSelectedAlertTone(tone.id)}
              disabled={!masterSound || !alertSounds}
            >
              <View style={styles.toneInfo}>
                <Text style={[styles.toneName, { color: colors.text }]}>{tone.name}</Text>
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={() => playSound(tone.id)}
                  disabled={!masterSound || !alertSounds}
                >
                  <Text style={[styles.playButtonText, { color: colors.primary }]}>Play</Text>
                </TouchableOpacity>
              </View>
              {tone.id === selectedAlertTone && (
                <Check size={22} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </Card>

        <Text style={[styles.note, { color: colors.textMuted }]}>
          Note: Emergency alert sounds cannot be disabled for your safety.
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
  sliderContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 10,
  },
  toneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  toneInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toneName: {
    fontSize: 16,
    fontWeight: '500',
  },
  playButton: {
    padding: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  playButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  note: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
}); 