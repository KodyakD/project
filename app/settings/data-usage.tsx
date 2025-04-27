import React, { useState } from 'react';
import { StyleSheet, View, Text, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Colors from '../../src/constants/Colors';
import Card from '../../src/components/ui/Card';

export default function DataUsageSettings() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [offlineMode, setOfflineMode] = useState(false);
  const [downloadMaps, setDownloadMaps] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [wifiOnly, setWifiOnly] = useState(false);
  
  const clearOfflineData = () => {
    // In a real app, this would clear stored offline data
    alert('Offline data cleared successfully');
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Data Usage',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView style={styles.content}>
        <Text style={[styles.sectionHeader, { color: colors.text }]}>Offline Mode</Text>
        <Card style={styles.card}>
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Enable Offline Mode</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Use the app without an internet connection
              </Text>
            </View>
            <Switch
              value={offlineMode}
              onValueChange={setOfflineMode}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor="#f4f3f4"
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Download Maps</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Download floor maps for offline use
              </Text>
            </View>
            <Switch
              value={downloadMaps}
              onValueChange={setDownloadMaps}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor="#f4f3f4"
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomWidth: 0 }]}
            onPress={clearOfflineData}
          >
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.error }]}>Clear Offline Data</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Remove all downloaded maps and cached data
              </Text>
            </View>
            <Feather name="trash-2" size={18} color={colors.error} />
          </TouchableOpacity>
        </Card>
        
        <Text style={[styles.sectionHeader, { color: colors.text }]}>Synchronization</Text>
        <Card style={styles.card}>
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Auto-Sync</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Automatically sync data when internet is available
              </Text>
            </View>
            <Switch
              value={autoSync}
              onValueChange={setAutoSync}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor="#f4f3f4"
            />
          </View>
          
          <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Wi-Fi Only</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Only sync data when connected to Wi-Fi
              </Text>
            </View>
            <Switch
              value={wifiOnly}
              onValueChange={setWifiOnly}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor="#f4f3f4"
              disabled={!autoSync}
            />
          </View>
        </Card>
        
        <View style={styles.statsContainer}>
          <Text style={[styles.statsTitle, { color: colors.text }]}>Data Usage Statistics</Text>
          <Text style={[styles.statsText, { color: colors.textSecondary }]}>Maps: 24.5 MB</Text>
          <Text style={[styles.statsText, { color: colors.textSecondary }]}>Incident Reports: 1.2 MB</Text>
          <Text style={[styles.statsText, { color: colors.textSecondary }]}>Other App Data: 3.8 MB</Text>
          <Text style={[styles.statsTotal, { color: colors.text }]}>Total: 29.5 MB</Text>
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
  statsContainer: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 32,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  statsText: {
    fontSize: 14,
    marginBottom: 4,
  },
  statsTotal: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 8,
  },
});