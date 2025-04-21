import React, { useState } from 'react';
import { StyleSheet, View, Text, Switch, ScrollView, Slider } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import Card from '@/components/ui/Card';

export default function AccessibilitySettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Accessibility options
  const [largeText, setLargeText] = useState(false);
  const [boldText, setBoldText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [screenReader, setScreenReader] = useState(false);
  const [textSize, setTextSize] = useState(1);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack.Screen
        options={{
          title: 'Accessibility',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView style={styles.content}>
        <Text style={[styles.sectionHeader, { color: colors.text }]}>Vision</Text>
        <Card style={styles.card}>
          {/* Large Text */}
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Large Text</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Increase text size for better readability
              </Text>
            </View>
            <Switch
              value={largeText}
              onValueChange={setLargeText}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={'#f4f3f4'}
            />
          </View>

          {/* Bold Text */}
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Bold Text</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Make text bolder and easier to read
              </Text>
            </View>
            <Switch
              value={boldText}
              onValueChange={setBoldText}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={'#f4f3f4'}
            />
          </View>

          {/* High Contrast */}
          <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>High Contrast</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Enhance contrast for better visibility
              </Text>
            </View>
            <Switch
              value={highContrast}
              onValueChange={setHighContrast}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={'#f4f3f4'}
            />
          </View>
        </Card>

        <Text style={[styles.sectionHeader, { color: colors.text }]}>Text Size</Text>
        <Card style={styles.card}>
          <View style={styles.sliderContainer}>
            <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>A</Text>
            <Slider
              style={styles.slider}
              minimumValue={0.8}
              maximumValue={1.4}
              step={0.1}
              value={textSize}
              onValueChange={setTextSize}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
            <Text style={[styles.sliderLabelLarge, { color: colors.textSecondary }]}>A</Text>
          </View>
          <Text style={[styles.settingDescription, { color: colors.textSecondary, textAlign: 'center', marginTop: 8 }]}>
            Drag slider to adjust text size throughout the app
          </Text>
        </Card>

        <Text style={[styles.sectionHeader, { color: colors.text }]}>Motion</Text>
        <Card style={styles.card}>
          {/* Reduce Motion */}
          <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Reduce Motion</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Minimize animations throughout the app
              </Text>
            </View>
            <Switch
              value={reduceMotion}
              onValueChange={setReduceMotion}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={'#f4f3f4'}
            />
          </View>
        </Card>

        <Text style={[styles.sectionHeader, { color: colors.text }]}>Screen Reader</Text>
        <Card style={styles.card}>
          {/* Screen Reader */}
          <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Screen Reader Support</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Optimize app for screen readers like VoiceOver and TalkBack
              </Text>
            </View>
            <Switch
              value={screenReader}
              onValueChange={setScreenReader}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={'#f4f3f4'}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderLabel: {
    fontSize: 14,
    marginRight: 10,
  },
  sliderLabelLarge: {
    fontSize: 20,
    marginLeft: 10,
  },
});