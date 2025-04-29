import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import IncidentList from '../../src/components/incidents/IncidentList';
import { useTheme } from '../../src/context/ThemeContext';
import NetInfo from '@react-native-community/netinfo';

export default function IncidentsScreen() {
  // Use the theme context instead of direct colorScheme
  const { colors } = useTheme();
  const router = useRouter();
  
  // State for tab selection (All vs My Reports)
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [isConnected, setIsConnected] = useState(true);
  
  // Check connection status
  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? true);
    });
    
    // Check current connection when component mounts
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected ?? true);
    });
    
    // Cleanup the subscription when component unmounts
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Navigate to create incident screen
  const handleCreateIncident = () => {
    try {
      router.push('/report/incident');
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Navigation Error', 'Unable to navigate to report screen. Please try again.');
    }
  };
  
  // Render the screen header with title and tabs
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerTitleRow}>
        <Text style={[styles.screenTitle, { color: colors.text }]}>Incidents</Text>
        <TouchableOpacity 
          style={[styles.createButton, { backgroundColor: colors.emergencyRed }]}
          onPress={handleCreateIncident}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Report</Text>
        </TouchableOpacity>
      </View>
      
      {!isConnected && (
        <View style={[styles.offlineWarning, { backgroundColor: colors.warning + '20' }]}>
          <Ionicons name="cloud-offline" size={16} color={colors.warning} />
          <Text style={[styles.offlineText, { color: colors.warning }]}>
            You're offline. Some data may not be up to date.
          </Text>
        </View>
      )}
      
      <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'all' && [styles.activeTab, { borderBottomColor: colors.emergencyRed }]
          ]}
          onPress={() => setActiveTab('all')}
        >
          <Text 
            style={[
              styles.tabText, 
              { color: activeTab === 'all' ? colors.emergencyRed : colors.textSecondary }
            ]}
          >
            All Incidents
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'my' && [styles.activeTab, { borderBottomColor: colors.emergencyRed }]
          ]}
          onPress={() => setActiveTab('my')}
        >
          <Text 
            style={[
              styles.tabText, 
              { color: activeTab === 'my' ? colors.emergencyRed : colors.textSecondary }
            ]}
          >
            My Reports
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Define separate props objects for clarity
  const allIncidentsProps = {
    key: "all-incidents", // Add key to force re-render when switching tabs
    showFilters: true,
    emptyStateMessage: "No incidents have been reported yet",
    initialFilters: {}
  };

  const myIncidentsProps = {
    key: "my-incidents", // Add key to force re-render when switching tabs
    showFilters: true,
    isUserIncidents: true,
    emptyStateMessage: "You haven't reported any incidents yet",
    initialFilters: {}
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {renderHeader()}
      
      {activeTab === 'all' 
        ? <IncidentList {...allIncidentsProps} /> 
        : <IncidentList {...myIncidentsProps} />
      }
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
    fontFamily: 'Inter-Bold',
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
    fontFamily: 'Inter-Medium',
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
    fontFamily: 'Inter-Medium',
  },
  offlineWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  offlineText: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
});