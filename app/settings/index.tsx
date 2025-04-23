import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Stack, useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { 
  Bell, 
  Globe, 
  ChevronRight, 
  Sliders, 
  Settings as SettingsIcon, 
  Shield, 
  Eye, 
  Volume2, 
  AlertTriangle,
  Map 
} from '@expo/vector-icons/Feather';
import Colors from '@/constants/Colors';
import Card from '@/components/ui/Card';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack.Screen
        options={{
          title: 'Settings',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView style={styles.content}>
        {/* Application Settings Section */}
        <Text style={[styles.sectionHeader, { color: colors.text }]}>Application Settings</Text>
        <Card style={styles.card}>
          {/* Notifications Settings */}
          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => router.push('/settings/notifications')}
          >
            <View style={styles.settingIconContainer}>
              <Bell size={22} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingMain}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Notifications</Text>
                <ChevronRight size={18} color={colors.textSecondary} />
              </View>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Configure notification preferences
              </Text>
            </View>
          </TouchableOpacity>

          {/* Language */}
          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => router.push('/settings/language')}
          >
            <View style={styles.settingIconContainer}>
              <Globe size={22} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingMain}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Language</Text>
                <ChevronRight size={18} color={colors.textSecondary} />
              </View>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Change application language
              </Text>
            </View>
          </TouchableOpacity>

          {/* Accessibility */}
          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => router.push('/settings/accessibility')}
          >
            <View style={styles.settingIconContainer}>
              <Eye size={22} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingMain}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Accessibility</Text>
                <ChevronRight size={18} color={colors.textSecondary} />
              </View>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Configure text size, contrast and more
              </Text>
            </View>
          </TouchableOpacity>

          {/* Audio Settings */}
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomWidth: 0 }]} 
            onPress={() => router.push('/settings/audio')}
          >
            <View style={styles.settingIconContainer}>
              <Volume2 size={22} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingMain}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Audio</Text>
                <ChevronRight size={18} color={colors.textSecondary} />
              </View>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Adjust sounds and alerts
              </Text>
            </View>
          </TouchableOpacity>
        </Card>

        {/* Map & Location Settings */}
        <Text style={[styles.sectionHeader, { color: colors.text }]}>Map & Location</Text>
        <Card style={styles.card}>
          {/* Map Display */}
          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => router.push('/settings/map-display')}
          >
            <View style={styles.settingIconContainer}>
              <Map size={22} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingMain}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Map Display</Text>
                <ChevronRight size={18} color={colors.textSecondary} />
              </View>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Configure map appearance and features
              </Text>
            </View>
          </TouchableOpacity>

          {/* Location Services */}
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomWidth: 0 }]} 
            onPress={() => router.push('/settings/location')}
          >
            <View style={styles.settingIconContainer}>
              <SettingsIcon size={22} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingMain}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Location Services</Text>
                <ChevronRight size={18} color={colors.textSecondary} />
              </View>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Manage location permissions and accuracy
              </Text>
            </View>
          </TouchableOpacity>
        </Card>

        {/* Security & Privacy */}
        <Text style={[styles.sectionHeader, { color: colors.text }]}>Security & Privacy</Text>
        <Card style={styles.card}>
          {/* Privacy Settings */}
          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => router.push('/settings/privacy')}
          >
            <View style={styles.settingIconContainer}>
              <Shield size={22} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingMain}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Privacy</Text>
                <ChevronRight size={18} color={colors.textSecondary} />
              </View>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Manage app permissions and data sharing
              </Text>
            </View>
          </TouchableOpacity>

          {/* Emergency Contact Settings */}
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomWidth: 0 }]} 
            onPress={() => router.push('/settings/emergency-contacts')}
          >
            <View style={styles.settingIconContainer}>
              <AlertTriangle size={22} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingMain}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Emergency Contacts</Text>
                <ChevronRight size={18} color={colors.textSecondary} />
              </View>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Set up emergency contacts and notifications
              </Text>
            </View>
          </TouchableOpacity>
        </Card>

        {/* Advanced Settings */}
        <Text style={[styles.sectionHeader, { color: colors.text }]}>Advanced</Text>
        <Card style={styles.card}>
          {/* Data Usage */}
          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => router.push('/settings/data-usage')}
          >
            <View style={styles.settingIconContainer}>
              <Sliders size={22} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingMain}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Data Usage</Text>
                <ChevronRight size={18} color={colors.textSecondary} />
              </View>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Manage offline mode and data preferences
              </Text>
            </View>
          </TouchableOpacity>

          {/* Clear Cache */}
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomWidth: 0 }]} 
            onPress={() => alert('Cache cleared successfully')}
          >
            <View style={styles.settingIconContainer}>
              <SettingsIcon size={22} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingMain}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Clear Cache</Text>
                <ChevronRight size={18} color={colors.textSecondary} />
              </View>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Free up storage space used by the app
              </Text>
            </View>
          </TouchableOpacity>
        </Card>

        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.textMuted }]}>
            Version 1.0.0
          </Text>
        </View>
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
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  versionText: {
    fontSize: 14,
  },
}); 