import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { getDrafts, deleteDraft, submitDraft } from '../services/incidentService';
import { useNetwork } from '../contexts/NetworkContext';
import { COLORS } from '../constants';

type IncidentDraft = {
  id: string;
  title: string;
  description: string;
  createdAt: number;
  mediaItems?: string[];
  // Include other incident fields as needed
};

const OfflineDraftsManager: React.FC = () => {
  const [drafts, setDrafts] = useState<IncidentDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const { isConnected, isInternetReachable } = useNetwork();
  const navigation = useNavigation<StackNavigationProp<any>>();
  
  const loadDrafts = async () => {
    setLoading(true);
    try {
      const loadedDrafts = await getDrafts();
      setDrafts(loadedDrafts);
    } catch (error) {
      console.error('Error loading drafts:', error);
      Alert.alert('Error', 'Failed to load drafts');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadDrafts();
    
    // Set up focus listener to refresh drafts when screen gains focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadDrafts();
    });
    
    return unsubscribe;
  }, [navigation]);
  
  const handleEditDraft = (draft: IncidentDraft) => {
    navigation.navigate('IncidentReport', { 
      draftId: draft.id,
      isEditingDraft: true
    });
  };
  
  const handleDeleteDraft = (draftId: string) => {
    Alert.alert(
      'Delete Draft',
      'Are you sure you want to delete this draft? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDraft(draftId);
              setDrafts(drafts.filter(draft => draft.id !== draftId));
            } catch (error) {
              console.error('Error deleting draft:', error);
              Alert.alert('Error', 'Failed to delete draft');
            }
          }
        }
      ]
    );
  };
  
  const handleSubmitDraft = async (draft: IncidentDraft) => {
    if (!isConnected || !isInternetReachable) {
      Alert.alert(
        'Offline',
        'You are currently offline. The draft will be submitted when you regain connectivity.'
      );
      return;
    }
    
    setSubmitting(draft.id);
    try {
      await submitDraft(draft.id);
      Alert.alert('Success', 'Incident report submitted successfully');
      setDrafts(drafts.filter(d => d.id !== draft.id));
    } catch (error) {
      console.error('Error submitting draft:', error);
      Alert.alert('Error', 'Failed to submit draft. Please try again later.');
    } finally {
      setSubmitting(null);
    }
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading drafts...</Text>
      </View>
    );
  }
  
  if (drafts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="document-text-outline" size={64} color={COLORS.textLight} />
        <Text style={styles.emptyText}>No saved drafts</Text>
        <Text style={styles.emptySubtext}>
          Incidents that you save while offline will appear here
        </Text>
      </View>
    );
  }
  
  const renderDraftItem = ({ item }: { item: IncidentDraft }) => {
    const formattedDate = format(new Date(item.createdAt), 'MMM dd, yyyy HH:mm');
    const isSubmittingThis = submitting === item.id;
    
    return (
      <View style={styles.draftItem}>
        <View style={styles.draftHeader}>
          <Text style={styles.draftTitle} numberOfLines={1}>
            {item.title || 'Untitled Incident'}
          </Text>
          <Text style={styles.draftDate}>{formattedDate}</Text>
        </View>
        
        <Text style={styles.draftDescription} numberOfLines={2}>
          {item.description || 'No description'}
        </Text>
        
        {item.mediaItems && item.mediaItems.length > 0 && (
          <View style={styles.mediaInfo}>
            <Ionicons name="image-outline" size={14} color={COLORS.textLight} />
            <Text style={styles.mediaCount}>
              {item.mediaItems.length} media item{item.mediaItems.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
        
        <View style={styles.draftActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEditDraft(item)}
          >
            <Ionicons name="create-outline" size={16} color={COLORS.primary} />
            <Text style={[styles.actionText, styles.editText]}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteDraft(item.id)}
          >
            <Ionicons name="trash-outline" size={16} color={COLORS.error} />
            <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.actionButton, 
              styles.submitButton,
              (!isConnected || !isInternetReachable) && styles.disabledButton
            ]}
            onPress={() => handleSubmitDraft(item)}
            disabled={isSubmittingThis || !isConnected || !isInternetReachable}
          >
            {isSubmittingThis ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons 
                  name="cloud-upload-outline" 
                  size={16} 
                  color={(!isConnected || !isInternetReachable) ? COLORS.textLight : 'white'} 
                />
                <Text 
                  style={[
                    styles.actionText, 
                    styles.submitText,
                    (!isConnected || !isInternetReachable) && styles.disabledText
                  ]}
                >
                  Submit
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <FlatList
        data={drafts}
        renderItem={renderDraftItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  listContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textDark,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textDark,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 8,
  },
  draftItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  draftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  draftTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
    flex: 1,
  },
  draftDate: {
    fontSize: 12,
    color: COLORS.textLight,
    marginLeft: 8,
  },
  draftDescription: {
    fontSize: 14,
    color: COLORS.textMedium,
    marginBottom: 8,
  },
  mediaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mediaCount: {
    fontSize: 12,
    color: COLORS.textLight,
    marginLeft: 4,
  },
  draftActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  editButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  editText: {
    color: COLORS.primary,
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  deleteText: {
    color: COLORS.error,
  },
  submitButton: {
    backgroundColor: COLORS.success,
  },
  submitText: {
    color: 'white',
  },
  disabledButton: {
    backgroundColor: '#e2e8f0',
  },
  disabledText: {
    color: COLORS.textLight,
  },
});

export default OfflineDraftsManager; 