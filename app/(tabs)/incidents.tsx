import React, { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '../../src/constants/Colors';
import IncidentList from '../../src/components/incidents/IncidentList';
import { IncidentFilter } from '../../src/components/incidents/IncidentList';

export default function IncidentsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  
  // State for tab selection (All vs My Reports)
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  
  // Navigate to create incident screen
  const handleCreateIncident = () => {
    router.push('/report/incident');
  };
  
  // Render the screen header with title and tabs
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerTitleRow}>
        <Text style={[styles.screenTitle, { color: colors.text }]}>Incidents</Text>
        <TouchableOpacity 
          style={[styles.createButton, { backgroundColor: colors.primary }]}
          onPress={handleCreateIncident}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Report</Text>
        </TouchableOpacity>
      </View>
      
      <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'all' && [styles.activeTab, { borderBottomColor: colors.primary }]
          ]}
          onPress={() => setActiveTab('all')}
        >
          <Text 
            style={[
              styles.tabText, 
              { color: activeTab === 'all' ? colors.primary : colors.textSecondary }
            ]}
          >
            All Incidents
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'my' && [styles.activeTab, { borderBottomColor: colors.primary }]
          ]}
          onPress={() => setActiveTab('my')}
        >
          <Text 
            style={[
              styles.tabText, 
              { color: activeTab === 'my' ? colors.primary : colors.textSecondary }
            ]}
          >
            My Reports
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {renderHeader()}
      
      {activeTab === 'all' ? (
        <IncidentList 
          showFilters={true}
          emptyStateMessage="No incidents have been reported yet"
        />
      ) : (
        <IncidentList 
          showFilters={true}
          isUserIncidents={true}
          emptyStateMessage="You haven't reported any incidents yet"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    marginLeft: 4,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  tab: {
    paddingVertical: 12,
    marginRight: 24,
  },
  activeTab: {
    borderBottomWidth: 3,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
});