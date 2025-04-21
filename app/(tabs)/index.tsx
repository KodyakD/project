import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import Card, { CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';

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
  const [activeIncidents, setActiveIncidents] = useState(0);
  
  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false);
      setActiveIncidents(2);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate refreshing data
    setTimeout(() => {
      setActiveIncidents(Math.floor(Math.random() * 3) + 1);
      setRefreshing(false);
    }, 1500);
  }, []);
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return colors.critical;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.info;
      default:
        return colors.textSecondary;
    }
  };

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
        
        {/* Status Summary Card */}
        <Card style={styles.card}>
          <CardHeader>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Status Summary</Text>
          </CardHeader>
          <CardContent style={styles.statusContent}>
            <View style={styles.statusItem}>
              <Text style={[styles.statusValue, { color: colors.text }]}>{activeIncidents}</Text>
              <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Active Alerts</Text>
            </View>
            <View style={styles.statusDivider} />
            <View style={styles.statusItem}>
              <Text style={[styles.statusValue, { color: colors.text }]}>5</Text>
              <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Buildings</Text>
            </View>
            <View style={styles.statusDivider} />
            <View style={styles.statusItem}>
              <Text style={[styles.statusValue, { color: colors.text }]}>3</Text>
              <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Recent Updates</Text>
            </View>
          </CardContent>
        </Card>
        
        {/* Active Alerts Card */}
        <Card style={styles.card}>
          <CardHeader>
            <View style={styles.cardHeaderContent}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Active Alerts</Text>
              <TouchableOpacity onPress={() => router.push('/alerts')}>
                <Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text>
              </TouchableOpacity>
            </View>
          </CardHeader>
          <CardContent>
            {alerts.length > 0 ? (
              <View style={styles.alertsList}>
                {alerts.map((alert) => (
                  <TouchableOpacity 
                    key={alert.id} 
                    style={styles.alertItem}
                    onPress={() => router.push(`/alerts/${alert.id}`)}
                  >
                    <View style={[styles.alertIconContainer, { backgroundColor: getSeverityColor(alert.severity) + '20' }]}>
                      <Feather name="alert-triangle" size={18} color={getSeverityColor(alert.severity)} />
                    </View>
                    <View style={styles.alertContent}>
                      <Text style={[styles.alertTitle, { color: colors.text }]}>{alert.title}</Text>
                      <Text style={[styles.alertLocation, { color: colors.textSecondary }]}>{alert.location}</Text>
                      <Text style={[styles.alertTime, { color: colors.textMuted }]}>{alert.time}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyAlerts}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No active alerts at this time
                </Text>
              </View>
            )}
          </CardContent>
        </Card>
        
        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        </View>
        
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity 
              key={action.id} 
              style={[styles.quickActionItem, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(action.route)}
            >
              <View style={styles.quickActionIcon}>
                {action.icon}
              </View>
              <Text style={[styles.quickActionTitle, { color: colors.text }]}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      
      <FloatingActionButton 
        icon={<Feather name="plus-circle" size={24} color="#FFFFFF" />}
        onPress={() => router.push('/create-incident')}
        label="Report Incident"
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
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusItem: {
    flex: 1,
    alignItems: 'center',
  },
  statusValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 14,
  },
  statusDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
  alertsList: {
    gap: 16,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  alertLocation: {
    fontSize: 14,
    marginBottom: 2,
  },
  alertTime: {
    fontSize: 12,
  },
  emptyAlerts: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  quickActionItem: {
    width: '31%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  quickActionIcon: {
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});