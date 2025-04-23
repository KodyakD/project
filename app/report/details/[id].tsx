import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useColorScheme,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import Colors from '../../../src/constants/Colors';
import incidentService from '../../../src/services/incidentService';
import { StatusTimeline } from '../../../src/components/incidents/StatusTimeline';
import { StatusBadge } from '../../../src/components/ui/StatusBadge';
import { format } from 'date-fns';
import MapView from '../../../src/components/MapView';

const { width: screenWidth } = Dimensions.get('window');

// Map incident types to icons
const TypeIcons: Record<string, string> = {
  maintenance: 'build-outline',
  security: 'shield-outline',
  safety: 'warning-outline',
  environmental: 'leaf-outline',
  other: 'help-circle-outline',
};

// Severity colors
const SeverityColors = {
  low: '#0EA5E9',     // Blue
  medium: '#F59E0B',  // Amber
  high: '#EA580C',    // Orange
  critical: '#DC2626', // Red
};

// Severity labels
const SeverityLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export default function IncidentDetailsScreen() {
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // State
  const [incident, setIncident] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  
  // Fetch incident data
  useEffect(() => {
    let unsubscribe: () => void;
    
    const fetchIncidentData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!id) {
          setError('Invalid incident ID');
          setLoading(false);
          return;
        }
        
        // Set up real-time listener for incident updates
        unsubscribe = incidentService.subscribeToIncident(
          id as string,
          (updatedIncident) => {
            setIncident(updatedIncident);
            setLoading(false);
          }
        );
        
      } catch (err) {
        console.error('Error fetching incident:', err);
        setError('Failed to load incident details. Please try again.');
        setLoading(false);
      }
    };
    
    fetchIncidentData();
    
    // Cleanup subscription
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [id]);
  
  // Handle map data
  const [mapData, setMapData] = useState<any | null>(null);
  
  // Handle back button
  const handleBack = () => {
    router.back();
  };
  
  // Handle media navigation
  const handleNextMedia = () => {
    if (incident?.mediaUrls?.length > 0) {
      setCurrentMediaIndex((currentMediaIndex + 1) % incident.mediaUrls.length);
    }
  };
  
  const handlePrevMedia = () => {
    if (incident?.mediaUrls?.length > 0) {
      setCurrentMediaIndex(
        currentMediaIndex === 0 
          ? incident.mediaUrls.length - 1 
          : currentMediaIndex - 1
      );
    }
  };
  
  // Handle update incident
  const handleUpdateIncident = () => {
    router.push(`/report/update/${incident.id}`);
  };
  
  // Handle viewing the location on map
  const handleViewOnMap = () => {
    if (incident?.location) {
      router.push({
        pathname: '/(tabs)/maps',
        params: {
          buildingId: incident.location.buildingId,
          floorId: incident.location.floorId,
          x: incident.location.x,
          y: incident.location.y,
          incidentId: incident.id
        }
      });
    }
  };
  
  // Render loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Incident Details</Text>
          <View style={styles.headerRight} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading incident details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  // Render error state
  if (error || !incident) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Incident Details</Text>
          <View style={styles.headerRight} />
        </View>
        
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error || 'Incident not found'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Incident Details</Text>
        <TouchableOpacity onPress={handleUpdateIncident} style={styles.headerRight}>
          <Ionicons name="create-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.titleRow}>
            <View style={styles.typeIconContainer}>
              <Ionicons
                name={TypeIcons[incident.type] || 'help-circle-outline'}
                size={24}
                color={colors.primary}
              />
            </View>
            
            <View style={styles.titleContainer}>
              <Text style={[styles.title, { color: colors.text }]}>
                {incident.title}
              </Text>
              
              <View style={styles.metaRow}>
                <Text style={[styles.reportedBy, { color: colors.textSecondary }]}>
                  Reported by {incident.reporterName}
                </Text>
                <Text style={[styles.reportDate, { color: colors.textSecondary }]}>
                  {format(new Date(incident.reportedAt), 'MMM d, yyyy • h:mm a')}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.statusSection}>
            <View style={styles.statusRow}>
              <StatusBadge status={incident.status} large />
              
              <View style={[
                styles.severityBadge, 
                { backgroundColor: SeverityColors[incident.severity] }
              ]}>
                <Text style={styles.severityText}>
                  {SeverityLabels[incident.severity] || 'Unknown'} Severity
                </Text>
              </View>
            </View>
            
            <StatusTimeline status={incident.status} />
          </View>
          
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {incident.description}
            </Text>
          </View>
          
          {incident.location && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Location</Text>
              
              <View style={styles.locationContainer}>
                <View style={styles.locationTextContainer}>
                  <Ionicons name="location" size={18} color={colors.primary} />
                  <Text style={[styles.locationText, { color: colors.textSecondary }]}>
                    {incident.location.description || 
                      `Building: ${incident.location.buildingId}, Floor: ${incident.location.floorId}`
                    }
                  </Text>
                </View>
                
                <TouchableOpacity 
                  style={[styles.viewOnMapButton, { borderColor: colors.border }]}
                  onPress={handleViewOnMap}
                >
                  <Text style={[styles.viewOnMapText, { color: colors.primary }]}>View on Map</Text>
                </TouchableOpacity>
              </View>
              
              {mapData && (
                <View style={styles.miniMapContainer}>
                  <MapView 
                    mapData={mapData}
                    incidents={[incident]}
                    showIncidents={true}
                    interactive={false}
                  />
                </View>
              )}
            </View>
          )}
          
          {incident.mediaUrls && incident.mediaUrls.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Media</Text>
              
              <View style={styles.mediaContainer}>
                <Image
                  source={{ uri: incident.mediaUrls[currentMediaIndex] }}
                  style={styles.mediaImage}
                  resizeMode="cover"
                />
                
                {incident.mediaUrls.length > 1 && (
                  <View style={styles.mediaNavigation}>
                    <TouchableOpacity 
                      style={[styles.mediaNavButton, { backgroundColor: colors.card }]}
                      onPress={handlePrevMedia}
                    >
                      <Ionicons name="chevron-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    
                    <Text style={[styles.mediaCounter, { color: colors.text }]}>
                      {currentMediaIndex + 1}/{incident.mediaUrls.length}
                    </Text>
                    
                    <TouchableOpacity 
                      style={[styles.mediaNavButton, { backgroundColor: colors.card }]}
                      onPress={handleNextMedia}
                    >
                      <Ionicons name="chevron-forward" size={24} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}
          
          {incident.statusHistory && incident.statusHistory.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Status History</Text>
              
              {incident.statusHistory.map((statusUpdate: any, index: number) => (
                <View 
                  key={index} 
                  style={[
                    styles.historyItem, 
                    index !== incident.statusHistory.length - 1 && styles.historyItemBorder,
                    { borderBottomColor: colors.border }
                  ]}
                >
                  <View style={styles.historyHeader}>
                    <StatusBadge status={statusUpdate.status} small />
                    <Text style={[styles.historyDate, { color: colors.textSecondary }]}>
                      {format(new Date(statusUpdate.timestamp), 'MMM d, yyyy • h:mm a')}
                    </Text>
                  </View>
                  
                  <Text style={[styles.updatedByText, { color: colors.textSecondary }]}>
                    Updated by {statusUpdate.updatedBy.name}
                  </Text>
                  
                  {statusUpdate.notes && (
                    <Text style={[styles.notes, { color: colors.text }]}>
                      {statusUpdate.notes}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  typeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  reportedBy: {
    fontSize: 14,
    marginRight: 8,
  },
  reportDate: {
    fontSize: 14,
  },
  statusSection: {
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  severityText: {
    color: '#FFF',
    fontWeight: '500',
    fontSize: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  locationContainer: {
    marginBottom: 12,
  },
  locationTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 15,
    marginLeft: 6,
  },
  viewOnMapButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  viewOnMapText: {
    fontWeight: '500',
    fontSize: 14,
  },
  miniMapContainer: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 12,
  },
  mediaContainer: {
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: 240,
    borderRadius: 8,
  },
  mediaNavigation: {
    position: 'absolute',
    bottom: 12,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  mediaNavButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8,
  },
  mediaCounter: {
    fontSize: 14,
    fontWeight: '500',
  },
  historyItem: {
    paddingVertical: 12,
  },
  historyItemBorder: {
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    marginLeft: 8,
  },
  updatedByText: {
    fontSize: 14,
    marginBottom: 4,
  },
  notes: {
    fontSize: 14,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
}); 