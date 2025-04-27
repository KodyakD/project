import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Plus from '@expo/vector-icons/Feather';
import { Feather } from '@expo/vector-icons';
import Colors from '../../src/constants/Colors';
import { Loading } from '../../src/components/ui/Loading';
import { ErrorDisplay } from '../../src/components/ui/ErrorDisplay';
import { FloatingActionButton } from '../../src/components/ui/FloatingActionButton';
import SafetyStatusIndicator from '../../src/components/dashboard/SafetyStatusIndicator';
import SafetyTipsCarousel from '../../src/components/dashboard/SafetyTipsCarousel';
import QuickActionsGrid from '../../src/components/dashboard/QuickActionsGrid';
import IncidentOverview from '../../src/components/dashboard/IncidentOverview';

// Mock data
const alerts = [
  { id: '1', title: 'Fire Alarm', location: 'Engineering Building, Floor 2', severity: 'high', time: '10 minutes ago' },
  { id: '2', title: 'Security Alert', location: 'Main Campus Entrance', severity: 'medium', time: '30 minutes ago' },
];

const quickActions = [
  { id: '1', title: 'View Maps', icon: <Feather name="map" size={24} color="#3772FF" />, route: '/maps' },
  { id: '2', title: 'My Profile', icon: <Feather name="user" size={24} color="#EF476F" />, route: '/profile' },
  { id: '3', title: 'Emergency Plans', icon: <Feather name="book-open" size={24} color="#FFD166" />, route: '/plans' },
];

export default function Dashboard() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate refreshing data
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  if (loading) {
    return <Loading fullScreen message="Loading dashboard..." />;
  }

  if (error) {
    return <ErrorDisplay fullScreen message={error} onRetry={() => setError(null)} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[colors.primary]} 
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Dashboard</Text>
        </View>
        
        {/* Safety Status Indicator */}
        <SafetyStatusIndicator />
        
        {/* Incident Overview */}
        <IncidentOverview maxIncidents={2} />
        {/* Quick Actions */}
        <QuickActionsGrid title="Quick Actions" showCard={true} actions={quickActions} />
        <QuickActionsGrid title="Quick Actions" showCard={true} />
        
        {/* Safety Tips Carousel */}
        <SafetyTipsCarousel 
          numTipsToShow={5}
          autoPlay={true}
          autoPlayInterval={5000}
          showControls={true}
        />
      </ScrollView>
      
      {/* Floating Action Button */}
      <FloatingActionButton 
        icon={<Plus size={24} color="#FFFFFF" />}
        onPress={() => router.push('/report/incident')}
        label="Report Incident"
        color={colors.emergencyRed}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Extra padding to account for FAB
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
});