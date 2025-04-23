import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { subscribeToIncidents, Incident, IncidentSeverity } from '@/services/incidentService';
import { formatDate } from '@/utils/dateUtils';
import { useAuth } from '@/hooks/useAuth';
import Colors from '@/constants/Colors';

const IncidentsListScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('active');
  
  // Set up subscription to incidents
  useEffect(() => {
    const unsubscribe = subscribeToIncidents((data) => {
      setIncidents(data);
      setLoading(false);
      setRefreshing(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  // Refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setRefreshing(true);
      // Firestore subscription will handle the refresh
      return () => {};
    }, [])
  );
  
  // Navigate to incident detail
  const handleIncidentPress = (incident: Incident) => {
    navigation.navigate('IncidentDetails', { incidentId: incident.id });
  };
  
  // Navigate to report incident
  const handleReportIncident = () => {
    navigation.navigate('ReportIncident');
  };
  
  // Get filtered incidents
  const getFilteredIncidents = () => {
    switch (filter) {
      case 'active':
        return incidents.filter(
          incident => incident.status === 'reported' || incident.status === 'in-progress'
        );
      case 'resolved':
        return incidents.filter(incident => incident.status === 'resolved');
      default:
        return incidents;
    }
  };
  
  // Get severity color
  const getSeverityColor = (severity: IncidentSeverity) => {
    switch (severity) {
      case 'critical':
        return '#FF3B30';
      case 'high':
        return '#FF9500';
      case 'medium':
        return '#FFCC00';
      case 'low':
        return '#34C759';
      default:
        return '#8E8E93';
    }
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reported':
        return '#FF9500';
      case 'in-progress':
        return '#007AFF';
      case 'resolved':
        return '#34C759';
      default:
        return '#8E8E93';
    }
  };
  
  // Render incident item
  const renderIncidentItem = ({ item }: { item: Incident }) => (
    <TouchableOpacity
      style={styles.incidentItem}
      onPress={() => handleIncidentPress(item)}
    >
      <View style={styles.incidentHeader}>
        <View style={styles.titleContainer}>
          <View 
            style={[
              styles.severityIndicator, 
              { backgroundColor: getSeverityColor(item.severity) }
            ]} 
          />
          <Text style={styles.incidentTitle} numberOfLines={1}>
            {item.title}
          </Text>
        </View>
        <View 
          style={[
            styles.statusBadge, 
            { backgroundColor: getStatusColor(item.status) }
          ]}
        >
          <Text style={styles.statusText}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>
      
      <Text style={styles.incidentDescription} numberOfLines={2}>
        {item.description}
      </Text>
      
      <View style={styles.incidentFooter}>
        <View style={styles.locationContainer}>
          <MaterialIcons name="place" size={16} color="#666666" style={styles.footerIcon} />
          <Text style={styles.footerText}>
            Floor: {item.location.floor}
            {item.location.roomId && ` - Room: ${item.location.roomId}`}
          </Text>
        </View>
        
        <View style={styles.timeContainer}>
          <MaterialIcons name="access-time" size={16} color="#666666" style={styles.footerIcon} />
          <Text style={styles.footerText}>
            {formatDate(item.reportedAt)}
          </Text>
        </View>
      </View>
      
      {item.assignedTo && (
        <View style={styles.assignedContainer}>
          <FontAwesome5 name="user-shield" size={14} color="#007AFF" style={styles.footerIcon} />
          <Text style={[styles.footerText, styles.assignedText]}>
            Assigned to a technical expert
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      {/* Filter tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'active' && styles.activeFilterTab]}
          onPress={() => setFilter('active')}
        >
          <Text style={[styles.filterText, filter === 'active' && styles.activeFilterText]}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'resolved' && styles.activeFilterTab]}
          onPress={() => setFilter('resolved')}
        >
          <Text style={[styles.filterText, filter === 'resolved' && styles.activeFilterText]}>
            Resolved
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.activeFilterTab]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
            All
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Incidents list */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
          <Text style={styles.loadingText}>Loading incidents...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={getFilteredIncidents()}
          renderItem={renderIncidentItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => setRefreshing(true)}
              colors={['#0066CC']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="info-outline" size={48} color="#8E8E93" />
              <Text style={styles.emptyText}>
                No {filter !== 'all' ? filter : ''} incidents found
              </Text>
            </View>
          }
        />
      )}
      
      {/* FAB for reporting new incident */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleReportIncident}
      >
        <MaterialIcons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  filterTab: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeFilterTab: {
    backgroundColor: '#E1F0FF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  activeFilterText: {
    color: '#0066CC',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80, // Space for FAB
  },
  incidentItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  incidentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  severityIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 8,
  },
  incidentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  incidentDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  incidentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerIcon: {
    marginRight: 4,
  },
  footerText: {
    fontSize: 12,
    color: '#666666',
  },
  assignedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  assignedText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#333333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default IncidentsListScreen; 