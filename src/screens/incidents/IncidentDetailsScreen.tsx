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
  Linking,
  useWindowDimensions
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Video } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { getIncident, updateIncidentStatus, Incident, IncidentStatus } from '@/services/incidentService';
import { FLOORS } from '@/constants/floors';
import { formatDate } from '@/utils/dateUtils';
import { useAuth } from '@/hooks/useAuth';
import StatusTimeline from '@/components/incidents/StatusTimeline';
import Colors from '@/constants/Colors';

interface RouteParams {
  incidentId: string;
}

const IncidentDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { incidentId } = route.params as RouteParams;
  const { width: screenWidth } = useWindowDimensions();
  const { user, userRoles } = useAuth();
  
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number>(-1);
  
  // Load incident data
  useEffect(() => {
    const loadIncident = async () => {
      try {
        setLoading(true);
        const data = await getIncident(incidentId);
        
        if (data) {
          setIncident(data);
        } else {
          setError('Incident not found');
        }
      } catch (err) {
        console.error('Error loading incident:', err);
        setError('Failed to load incident details');
      } finally {
        setLoading(false);
      }
    };
    
    loadIncident();
  }, [incidentId]);
  
  // Get floor name
  const getFloorName = (floorId: string) => {
    const floor = FLOORS.find(f => f.id === floorId);
    return floor ? floor.fullName : floorId;
  };
  
  // Get severity details
  const getSeverityDetails = () => {
    if (!incident) return { color: '#8E8E93', label: 'Unknown' };
    
    switch (incident.severity) {
      case 'critical':
        return { color: '#FF3B30', label: 'Critical' };
      case 'high':
        return { color: '#FF9500', label: 'High' };
      case 'medium':
        return { color: '#FFCC00', label: 'Medium' };
      case 'low':
        return { color: '#34C759', label: 'Low' };
      default:
        return { color: '#8E8E93', label: 'Unknown' };
    }
  };
  
  // Check if user can update incident
  const canUpdateIncident = () => {
    if (!user || !incident) return false;
    
    // Technical experts can update any incident
    if (userRoles?.includes('technical_expert')) return true;
    
    // Users can only update incidents they reported
    return incident.reportedBy === user.uid;
  };
  
  // Update incident status
  const handleUpdateStatus = async (newStatus: IncidentStatus) => {
    if (!incident || !canUpdateIncident()) return;
    
    try {
      setUpdating(true);
      await updateIncidentStatus(incident.id, newStatus);
      
      // Update local state
      setIncident({
        ...incident,
        status: newStatus,
        updatedAt: { toMillis: () => Date.now() } as any,
      });
      
      Alert.alert('Success', `Incident status updated to ${newStatus}`);
    } catch (err) {
      console.error('Error updating incident status:', err);
      Alert.alert('Error', 'Failed to update incident status');
    } finally {
      setUpdating(false);
    }
  };
  
  // Navigate to view location
  const viewLocation = () => {
    if (incident?.location?.coordinates) {
      navigation.navigate('LocationView', {
        floor: incident.location.floor,
        x: incident.location.coordinates.x,
        y: incident.location.coordinates.y,
        incidentId: incident.id,
      });
    }
  };
  
  // View media in full screen
  const viewMedia = (index: number) => {
    setSelectedMediaIndex(index);
  };
  
  // Close media preview
  const closeMediaPreview = () => {
    setSelectedMediaIndex(-1);
  };
  
  // Handle status button press
  const handleStatusUpdate = () => {
    if (!incident) return;
    
    const currentStatus = incident.status;
    let nextStatus: IncidentStatus;
    
    switch (currentStatus) {
      case 'reported':
        nextStatus = 'in-progress';
        break;
      case 'in-progress':
        nextStatus = 'resolved';
        break;
      default:
        return; // Already resolved
    }
    
    Alert.alert(
      'Update Status',
      `Do you want to change the status from "${currentStatus}" to "${nextStatus}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Update', 
          onPress: () => handleUpdateStatus(nextStatus) 
        }
      ]
    );
  };
  
  // Status button text
  const getStatusButtonText = () => {
    if (!incident) return '';
    
    switch (incident.status) {
      case 'reported':
        return 'Mark As In Progress';
      case 'in-progress':
        return 'Mark As Resolved';
      default:
        return '';
    }
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading incident details...</Text>
      </View>
    );
  }
  
  if (error || !incident) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Error loading incident'}</Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  const severityInfo = getSeverityDetails();
  
  return (
    <SafeAreaView style={styles.container} edges={['right', 'bottom', 'left']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <View 
              style={[styles.severityIndicator, { backgroundColor: severityInfo.color }]} 
            />
            <Text style={styles.title}>{incident.title}</Text>
          </View>
          
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <MaterialIcons name="access-time" size={16} color="#666666" />
              <Text style={styles.metaText}>
                {formatDate(incident.reportedAt)}
              </Text>
            </View>
            
            <View style={styles.metaItem}>
              <MaterialIcons name="place" size={16} color="#666666" />
              <Text style={styles.metaText}>
                Floor: {getFloorName(incident.location.floor)}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.locationButton}
              onPress={viewLocation}
            >
              <Text style={styles.locationButtonText}>View on Map</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Status Section */}
        <View style={styles.statusSection}>
          <View style={styles.statusHeader}>
            <Text style={styles.sectionTitle}>Status</Text>
            <View 
              style={[
                styles.statusBadge,
                { 
                  backgroundColor: 
                    incident.status === 'reported' ? '#FF9500' :
                    incident.status === 'in-progress' ? '#007AFF' : '#34C759'
                }
              ]}
            >
              <Text style={styles.statusText}>
                {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
              </Text>
            </View>
          </View>
          
          <StatusTimeline status={incident.status} />
          
          {/* Status update button */}
          {canUpdateIncident() && incident.status !== 'resolved' && (
            <TouchableOpacity
              style={[
                styles.statusButton,
                { 
                  backgroundColor: 
                    incident.status === 'reported' ? '#007AFF' : '#34C759'
                }
              ]}
              onPress={handleStatusUpdate}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <MaterialIcons 
                    name={incident.status === 'reported' ? 'play-arrow' : 'check'} 
                    size={20} 
                    color="#FFFFFF" 
                  />
                  <Text style={styles.statusButtonText}>{getStatusButtonText()}</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
        
        {/* Description Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{incident.description}</Text>
        </View>
        
        {/* Severity Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Severity</Text>
          <View style={styles.severityContainer}>
            <View 
              style={[
                styles.severityBadge, 
                { backgroundColor: severityInfo.color }
              ]}
            >
              <Text style={styles.severityText}>{severityInfo.label}</Text>
            </View>
            <Text style={styles.severityDescription}>
              {incident.severity === 'critical' ? 'Immediate action required' :
               incident.severity === 'high' ? 'Urgent attention needed' :
               incident.severity === 'medium' ? 'Requires attention' :
               'Regular handling'}
            </Text>
          </View>
        </View>
        
        {/* Media Section */}
        {incident.mediaUrls && incident.mediaUrls.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Attachments ({incident.mediaUrls.length})
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mediaList}
            >
              {incident.mediaUrls.map((url, index) => {
                const isImage = url.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/);
                return (
                  <TouchableOpacity
                    key={url}
                    style={styles.mediaItem}
                    onPress={() => viewMedia(index)}
                  >
                    {isImage ? (
                      <Image
                        source={{ uri: url }}
                        style={styles.mediaThumbnail}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.videoThumbnail}>
                        <FontAwesome5 name="file-video" size={24} color="#666666" />
                      </View>
                    )}
                    <View style={styles.mediaTypeContainer}>
                      <MaterialIcons
                        name={isImage ? 'photo' : 'videocam'}
                        size={16}
                        color="#FFFFFF"
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
        
        {/* Assignment Section */}
        {incident.assignedTo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assignment</Text>
            <View style={styles.assignmentContainer}>
              <FontAwesome5 name="user-shield" size={20} color="#007AFF" />
              <Text style={styles.assignmentText}>
                This incident is assigned to a technical expert
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
      
      {/* Full screen media preview */}
      {selectedMediaIndex >= 0 && incident.mediaUrls && (
        <View style={styles.mediaPreviewContainer}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={closeMediaPreview}
          >
            <MaterialIcons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          {(() => {
            const url = incident.mediaUrls![selectedMediaIndex];
            const isImage = url.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/);
            
            return isImage ? (
              <Image
                source={{ uri: url }}
                style={styles.fullScreenMedia}
                resizeMode="contain"
              />
            ) : (
              <Video
                source={{ uri: url }}
                style={styles.fullScreenMedia}
                useNativeControls
                resizeMode="contain"
                shouldPlay
              />
            );
          })()}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  severityIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginRight: 8,
    marginTop: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
  },
  metaContainer: {
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 6,
  },
  locationButton: {
    backgroundColor: '#E1F0FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  locationButtonText: {
    color: '#0066CC',
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  description: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
  },
  severityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  severityBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginRight: 12,
  },
  severityText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  severityDescription: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  mediaList: {
    paddingVertical: 8,
  },
  mediaItem: {
    width: 100,
    height: 100,
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  mediaThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F0F0',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaTypeContainer: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 4,
    padding: 4,
  },
  assignmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#E1F0FF',
    borderRadius: 8,
  },
  assignmentText: {
    color: '#0066CC',
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 16,
  },
  statusButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  mediaPreviewContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  fullScreenMedia: {
    width: '100%',
    height: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
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
    backgroundColor: '#F5F5F5',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  errorButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default IncidentDetailsScreen; 