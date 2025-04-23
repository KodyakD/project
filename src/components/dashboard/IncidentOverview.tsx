import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import Card, { CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { ChevronRight, AlertCircle, AlertTriangle, CheckCircle } from '@expo/vector-icons/Feather';
import { IncidentSummary } from './IncidentSummaryCard';
import IncidentSummaryCard from './IncidentSummaryCard';

// Define mock data for testing
const MOCK_INCIDENTS: IncidentSummary[] = [
  {
    id: '1',
    title: 'Fire Alarm Activation',
    description: 'Fire alarm activated on the 3rd floor of Engineering Building, east wing.',
    location: 'Room 305',
    building: 'Engineering Building',
    floor: '3rd Floor',
    timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
    severity: 'high',
    status: 'in-progress',
    reporter: {
      name: 'John Doe',
      role: 'Security Officer',
    },
  },
  {
    id: '2',
    title: 'Water Leak',
    description: 'Water leak from ceiling in the library study area, near computer stations.',
    location: 'Main Area',
    building: 'Library',
    floor: '2nd Floor',
    timestamp: new Date(Date.now() - 7200000), // 2 hours ago
    severity: 'medium',
    status: 'reported',
    reporter: {
      name: 'Jane Smith',
      role: 'Faculty Member',
    },
  },
];

interface IncidentOverviewProps {
  maxIncidents?: number;
  showTitle?: boolean;
  showFooter?: boolean;
  compact?: boolean;
}

export default function IncidentOverview({
  maxIncidents = 2,
  showTitle = true,
  showFooter = true,
  compact = false,
}: IncidentOverviewProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [incidents, setIncidents] = useState<IncidentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load incidents - in a real app, this would fetch from a service
  useEffect(() => {
    // Simulate API request
    const timer = setTimeout(() => {
      try {
        setIncidents(MOCK_INCIDENTS);
        setLoading(false);
      } catch (err) {
        setError('Failed to load incidents');
        setLoading(false);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Calculate incident statistics
  const stats = {
    total: incidents.length,
    critical: incidents.filter(i => i.severity === 'critical').length,
    high: incidents.filter(i => i.severity === 'high').length,
    medium: incidents.filter(i => i.severity === 'medium').length,
    low: incidents.filter(i => i.severity === 'low').length,
    reported: incidents.filter(i => i.status === 'reported').length,
    inProgress: incidents.filter(i => i.status === 'in-progress').length,
    resolved: incidents.filter(i => i.status === 'resolved').length,
  };

  // Handle view all incidents
  const handleViewAll = () => {
    router.push('/report/incidents');
  };
  
  // Handle incident selection
  const handleIncidentPress = (incident: IncidentSummary) => {
    router.push(`/report/details/${incident.id}`);
  };

  // Render loading state
  if (loading) {
    return (
      <Card style={styles.card}>
        {showTitle && (
          <CardHeader>
            <Text style={[styles.title, { color: colors.text }]}>Recent Incidents</Text>
          </CardHeader>
        )}
        <CardContent style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading incidents...
          </Text>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card style={styles.card}>
        {showTitle && (
          <CardHeader>
            <Text style={[styles.title, { color: colors.text }]}>Recent Incidents</Text>
          </CardHeader>
        )}
        <CardContent style={styles.errorContainer}>
          <AlertCircle size={32} color={colors.error} style={styles.errorIcon} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => setLoading(true)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </CardContent>
      </Card>
    );
  }

  // Render empty state
  if (incidents.length === 0) {
    return (
      <Card style={styles.card}>
        {showTitle && (
          <CardHeader>
            <Text style={[styles.title, { color: colors.text }]}>Recent Incidents</Text>
          </CardHeader>
        )}
        <CardContent style={styles.emptyContainer}>
          <CheckCircle size={32} color={colors.success} style={styles.emptyIcon} />
          <Text style={[styles.emptyTitle, { color: colors.success }]}>All Clear</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No active incidents at this time
          </Text>
        </CardContent>
      </Card>
    );
  }

  // Render incidents
  return (
    <Card style={styles.card}>
      {showTitle && (
        <CardHeader>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Recent Incidents</Text>
            <View style={styles.statsContainer}>
              {stats.critical > 0 && (
                <View 
                  style={[
                    styles.statBadge, 
                    { backgroundColor: colors.critical + '20' }
                  ]}
                >
                  <Text style={[styles.statText, { color: colors.critical }]}>
                    {stats.critical} Critical
                  </Text>
                </View>
              )}
              {stats.high > 0 && (
                <View 
                  style={[
                    styles.statBadge, 
                    { backgroundColor: colors.error + '20' }
                  ]}
                >
                  <Text style={[styles.statText, { color: colors.error }]}>
                    {stats.high} High
                  </Text>
                </View>
              )}
              {stats.reported > 0 && (
                <View 
                  style={[
                    styles.statBadge, 
                    { backgroundColor: colors.warning + '20' }
                  ]}
                >
                  <Text style={[styles.statText, { color: colors.warning }]}>
                    {stats.reported} Reported
                  </Text>
                </View>
              )}
            </View>
          </View>
        </CardHeader>
      )}
      
      <CardContent style={styles.content}>
        {incidents.slice(0, maxIncidents).map((incident) => (
          <IncidentSummaryCard
            key={incident.id}
            incident={incident}
            onPress={handleIncidentPress}
            compact={compact}
            showFooter={false}
          />
        ))}
      </CardContent>
      
      {showFooter && (
        <CardFooter>
          <TouchableOpacity 
            style={[styles.footerButton, { borderColor: colors.border }]}
            onPress={handleViewAll}
          >
            <Text style={[styles.footerButtonText, { color: colors.primary }]}>
              View All Incidents
            </Text>
            <ChevronRight size={16} color={colors.primary} />
          </TouchableOpacity>
        </CardFooter>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    padding: 0,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    padding: 24,
    alignItems: 'center',
  },
  errorIcon: {
    marginBottom: 12,
  },
  errorText: {
    marginBottom: 16,
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyIcon: {
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});