import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { FloorType } from '../types/map.types';
import { Alert } from 'react-native';
import apiClient from './apiClient';
import { IncidentStatus, IncidentType } from '../types';
import storageService from './storageService';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import { handleApiError } from '../utils/errorHandling';
// Import from mediaService
import { processQueuedUploads, MediaFile } from './mediaService';

// Collection references
const incidentsCollection = firestore().collection('incidents');
const INCIDENTS_ENDPOINT = '/incidents';
const MEDIA_ENDPOINT = '/media';

// Incident types
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Incident {
  id?: string;
  title: string;
  description: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  location: {
    buildingId: string;
    floorId: string;
    x: number;
    y: number;
    description?: string;
  };
  reporterId: string;
  reporterName: string;
  assignedTo?: {
    id: string;
    name: string;
  };
  mediaUrls?: string[];
  createdAt: any; // firestore timestamp
  updatedAt: any; // firestore timestamp
  statusHistory?: {
    status: IncidentStatus;
    timestamp: any; // firestore timestamp
    updatedBy: {
      id: string;
      name: string;
    };
    notes?: string;
  }[];
}

export interface IncidentUpdate {
  status?: IncidentStatus;
  assignedTo?: {
    id: string;
    name: string;
  };
  notes?: string;
  mediaUrls?: string[];
}

// Add missing interfaces
export interface IncidentDraft {
  id: string;
  title: string;
  description: string;
  location: {
    buildingId: string;
    floorId: string;
    x: number;
    y: number;
    description?: string;
  } | null;
  category: string;
  severity: IncidentSeverity;
  mediaFiles: MediaFile[];
  createdAt: string;
  updatedAt: string;
  isOffline: boolean;
  submissionAttempts: number;
  type?: IncidentType;
}

export interface OfflineIncident {
  id: string;
  incident: Incident;
  submissionAttempts: number;
  createdAt: string;
}

// Storage keys
const INCIDENT_DRAFTS_KEY = 'incidentDrafts';
const INCIDENT_QUEUE_KEY = 'offlineIncidentQueue';
const OFFLINE_INCIDENTS_KEY = 'OFFLINE_INCIDENTS';

// Helper function declarations
const getIncidentDrafts = async (): Promise<IncidentDraft[]> => {
  try {
    const draftsString = await AsyncStorage.getItem(INCIDENT_DRAFTS_KEY);
    return draftsString ? JSON.parse(draftsString) : [];
  } catch (error) {
    console.error('Error getting incident drafts:', error);
    return [];
  }
};

const getIncidentDraftById = async (id: string): Promise<IncidentDraft | null> => {
  try {
    const drafts = await getIncidentDrafts();
    return drafts.find(draft => draft.id === id) || null;
  } catch (error) {
    console.error(`Error getting incident draft ${id}:`, error);
    return null;
  }
};

const deleteIncidentDraft = async (id: string): Promise<void> => {
  try {
    const drafts = await getIncidentDrafts();
    const updatedDrafts = drafts.filter(draft => draft.id !== id);
    await AsyncStorage.setItem(INCIDENT_DRAFTS_KEY, JSON.stringify(updatedDrafts));
  } catch (error) {
    console.error(`Error deleting incident draft ${id}:`, error);
    throw error;
  }
};

const getOfflineIncidents = async (): Promise<OfflineIncident[]> => {
  try {
    const offlineIncidentsString = await AsyncStorage.getItem(OFFLINE_INCIDENTS_KEY);
    return offlineIncidentsString ? JSON.parse(offlineIncidentsString) : [];
  } catch (error) {
    console.error('Error getting offline incidents:', error);
    return [];
  }
};

/**
 * Create a new incident
 */
export const createIncident = async (incident: Omit<Incident, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory'>): Promise<string> => {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      throw new Error('User must be logged in to report an incident');
    }

    const now = firestore.Timestamp.now();
    
    // Create status history with initial status
    const statusHistory = [{
      status: incident.status || 'reported',
      timestamp: now,
      updatedBy: {
        id: currentUser.uid,
        name: incident.reporterName || currentUser.displayName || 'Anonymous User'
      }
    }];

    // Prepare incident data with timestamps
    const incidentData: Incident = {
      ...incident,
      status: incident.status || 'reported',
      createdAt: now,
      updatedAt: now,
      statusHistory,
      // Use reporter details from auth if not provided
      reporterId: incident.reporterId || currentUser.uid,
      reporterName: incident.reporterName || currentUser.displayName || 'Anonymous User'
    };

    // Add document to collection
    const docRef = await incidentsCollection.add(incidentData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating incident:', error);
    Alert.alert('Error', 'Failed to create incident report. Please try again.');
    throw error;
  }
};

const addToOfflineQueue = async (
  offlineId: string,
  incident: Omit<Incident, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory'>
): Promise<void> => {
  try {
    // Get current queue
    const queueJSON = await storageService.getItem(INCIDENT_QUEUE_KEY) || '[]';
    const queue = JSON.parse(queueJSON);
    
    // Prepare incident for queue with client-side timestamps
    const now = new Date().toISOString();
    const queuedIncident = {
      ...incident,
      offlineId,
      clientCreatedAt: now,
      clientUpdatedAt: now,
      isOffline: true
    };
    
    // Add to queue
    queue.push(queuedIncident);
    
    // Save updated queue
    await storageService.setItem(INCIDENT_QUEUE_KEY, JSON.stringify(queue));
    
    console.log(`Incident queued offline with ID: ${offlineId}`);
  } catch (error) {
    console.error('Error adding incident to offline queue:', error);
    throw error;
  }
};

// Create a function to support offline incident creation
export const createIncidentWithOfflineSupport = async (
  incident: Omit<Incident, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory'>
): Promise<string> => {
  try {
    // Check network connection
    const netInfo = await NetInfo.fetch();
    const isConnected = netInfo.isConnected && netInfo.isInternetReachable;
    
    if (isConnected) {
      // Online - create incident directly
      return await createIncident(incident);
    } else {
      // Offline - queue for later submission
      const offlineId = `offline_${Date.now()}`;
      
      // Add to offline queue
      await addToOfflineQueue(offlineId, incident);
      
      return offlineId;
    }
  } catch (error) {
    console.error('Error creating incident with offline support:', error);
    
    // If any error occurs, try to save as offline
    const offlineId = `offline_${Date.now()}`;
    await addToOfflineQueue(offlineId, incident);
    
    return offlineId;
  }
};

const processOfflineIncidentQueue = async (): Promise<{
  success: number;
  failed: number;
  total: number;
}> => {
  try {
    // Check network connection
    const netInfo = await NetInfo.fetch();
    const isConnected = netInfo.isConnected && netInfo.isInternetReachable;
    
    if (!isConnected) {
      console.log('Device is offline, cannot process incident queue');
      return { success: 0, failed: 0, total: 0 };
    }
    
    // Get queue
    const queueJSON = await storageService.getItem(INCIDENT_QUEUE_KEY) || '[]';
    const queue = JSON.parse(queueJSON);
    
    if (queue.length === 0) {
      return { success: 0, failed: 0, total: 0 };
    }
    
    console.log(`Processing ${queue.length} queued incidents`);
    
    // Process each queued incident
    const updatedQueue = [];
    let successCount = 0;
    let failedCount = 0;
    
    for (const queuedIncident of queue) {
      try {
        // Remove offline-specific properties
        const { offlineId, clientCreatedAt, clientUpdatedAt, isOffline, ...incident } = queuedIncident;
        
        // Create incident
        const incidentId = await createIncident(incident);
        
        console.log(`Successfully created incident from queue: ${incidentId}`);
        successCount++;
        
        // Notify any subscribers about changes
        try {
          // Dispatch event to notify app about successful sync
          const syncEvent = new CustomEvent('incidentSynced', { 
            detail: { offlineId, onlineId: incidentId } 
          });
          document.dispatchEvent(syncEvent);
        } catch (e) {
          // Ignore errors in event dispatch
        }
      } catch (error) {
        console.error('Error processing queued incident:', error);
        // Keep in queue if failed
        updatedQueue.push(queuedIncident);
        failedCount++;
      }
    }
    
    // Save updated queue
    await storageService.setItem(INCIDENT_QUEUE_KEY, JSON.stringify(updatedQueue));
    
    console.log(`Queue processing complete. Success: ${successCount}, Failed: ${failedCount}, Remaining: ${updatedQueue.length}`);
    
    // Try to process media uploads after incidents are created
    await processQueuedUploads();
    
    return {
      success: successCount,
      failed: failedCount,
      total: queue.length
    };
  } catch (error) {
    console.error('Error processing offline incident queue:', error);
    return { success: 0, failed: 0, total: 0 };
  }
};

const saveIncidentDraft = async (draft: Partial<IncidentDraft>): Promise<IncidentDraft> => {
  try {
    // Get existing drafts
    const draftsString = await AsyncStorage.getItem(INCIDENT_DRAFTS_KEY);
    const drafts: IncidentDraft[] = draftsString ? JSON.parse(draftsString) : [];
    
    // If draft has no ID, create one
    if (!draft.id) {
      draft.id = uuid.v4().toString();
      draft.createdAt = new Date().toISOString();
    }
    
    // Update the updatedAt timestamp
    draft.updatedAt = new Date().toISOString();
    
    // Make sure mediaFiles is initialized
    if (!draft.mediaFiles) {
      draft.mediaFiles = [];
    }
    
    // Set initial values for new drafts
    const completeDraft: IncidentDraft = {
      id: draft.id,
      title: draft.title || '',
      description: draft.description || '',
      location: draft.location || null,
      category: draft.category || '',
      severity: draft.severity || 'medium',
      mediaFiles: draft.mediaFiles || [],
      createdAt: draft.createdAt || new Date().toISOString(),
      updatedAt: draft.updatedAt || new Date().toISOString(),
      isOffline: draft.isOffline !== undefined ? draft.isOffline : false,
      submissionAttempts: draft.submissionAttempts || 0,
    };
    
    // Find and update existing draft or add new one
    const existingIndex = drafts.findIndex(d => d.id === completeDraft.id);
    if (existingIndex >= 0) {
      drafts[existingIndex] = completeDraft;
    } else {
      drafts.push(completeDraft);
    }
    
    // Save updated drafts
    await AsyncStorage.setItem(INCIDENT_DRAFTS_KEY, JSON.stringify(drafts));
    
    return completeDraft;
  } catch (error) {
    console.error('Error saving incident draft:', error);
    throw error;
  }
};

const submitIncidentDraft = async (draftId: string): Promise<Incident | null> => {
  try {
    // Get the draft
    const draft = await getIncidentDraftById(draftId);
    if (!draft) {
      throw new Error(`Draft with ID ${draftId} not found`);
    }
    
    // Check if we have a location, which is required
    if (!draft.location) {
      throw new Error('Location is required to submit an incident');
    }
    
    // Convert draft to incident
    const incident: Partial<Incident> = {
      title: draft.title,
      description: draft.description,
      location: draft.location,
      type: draft.type,
      severity: draft.severity,
      status: 'submitted',
      mediaUrls: draft.mediaFiles?.map(file => file.uri) || [],
    };
    
    // Try to submit the incident
    const createdIncident = await createIncident(incident);
    
    // If created successfully, upload media files
    if (createdIncident && draft.mediaFiles.length > 0) {
      for (const mediaFile of draft.mediaFiles) {
        try {
          // Create form data for media upload
          const formData = new FormData();
          formData.append('file', {
            uri: mediaFile.uri,
            name: mediaFile.uri.split('/').pop() || `media-${Date.now()}.${mediaFile.type === 'image' ? 'jpg' : 'mp4'}`,
            type: mediaFile.type === 'image' ? 'image/jpeg' : 'video/mp4',
          } as any);
          formData.append('incidentId', createdIncident);
          
          // Upload the media
          await apiClient.post('/media/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        } catch (error) {
          console.error(`Error uploading media for incident ${createdIncident}:`, error);
        }
      }
    }
    
    // Delete the draft if successfully submitted
    await deleteIncidentDraft(draftId);
    
    return { id: createdIncident, ...incident } as Incident;
  } catch (error) {
    console.error(`Error submitting draft ${draftId}:`, error);
    
    // If there's a network error, mark the draft as offline
    if (error.message && error.message.includes('Network Error')) {
      const draft = await getIncidentDraftById(draftId);
      if (draft) {
        draft.isOffline = true;
        draft.submissionAttempts += 1;
        await saveIncidentDraft(draft);
      }
    }
    
    return null;
  }
};

/**
 * Get all incidents
 */
export const getIncidents = async (
  filters?: {
    status?: IncidentStatus | IncidentStatus[];
    buildingId?: string;
    floorId?: string;
    reporterId?: string;
    assignedToId?: string;
    type?: IncidentType | IncidentType[];
    severity?: IncidentSeverity | IncidentSeverity[];
  },
  limitCount: number = 50,
  lastVisible?: any // firestore document
): Promise<{
  incidents: Incident[];
  lastVisible: any | null;
}> => {
  try {
    let query = incidentsCollection.orderBy('createdAt', 'desc');
    
    // Apply filters
    if (filters) {
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          query = query.where('status', 'in', filters.status);
        } else {
          query = query.where('status', '==', filters.status);
        }
      }
      
      if (filters.buildingId) {
        query = query.where('location.buildingId', '==', filters.buildingId);
      }
      
      if (filters.floorId) {
        query = query.where('location.floorId', '==', filters.floorId);
      }
      
      if (filters.reporterId) {
        query = query.where('reporterId', '==', filters.reporterId);
      }
      
      if (filters.assignedToId) {
        query = query.where('assignedTo.id', '==', filters.assignedToId);
      }
      
      if (filters.type) {
        if (Array.isArray(filters.type)) {
          query = query.where('type', 'in', filters.type);
        } else {
          query = query.where('type', '==', filters.type);
        }
      }
      
      if (filters.severity) {
        if (Array.isArray(filters.severity)) {
          query = query.where('severity', 'in', filters.severity);
        } else {
          query = query.where('severity', '==', filters.severity);
        }
      }
    }
    
    // Apply pagination
    if (lastVisible) {
      query = query.startAfter(lastVisible);
    }
    
    // Apply limit
    query = query.limit(limitCount);
    
    // Execute query
    const snapshot = await query.get();
    const incidents: Incident[] = [];
    
    snapshot.forEach((doc) => {
      incidents.push({ id: doc.id, ...doc.data() } as Incident);
    });
    
    // Get last document for pagination
    const lastVisibleDoc = snapshot.docs.length > 0 
      ? snapshot.docs[snapshot.docs.length - 1] 
      : null;
    
    return {
      incidents,
      lastVisible: lastVisibleDoc
    };
  } catch (error) {
    console.error('Error fetching incidents:', error);
    throw error;
  }
};

/**
 * Get active incidents (reported or in-progress)
 */
export const getActiveIncidents = async (): Promise<Incident[]> => {
  try {
    const snapshot = await incidentsCollection
      .where('status', 'in', ['reported', 'in-progress'])
      .orderBy('reportedAt', 'desc')
      .get();
      
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Incident[];
  } catch (error) {
    console.error('Error getting active incidents:', error);
    return [];
  }
};

/**
 * Subscribe to incidents (real-time)
 */
export const subscribeToIncidents = (
  callback: (incidents: Incident[]) => void
): (() => void) => {
  try {
    return incidentsCollection
      .orderBy('reportedAt', 'desc')
      .onSnapshot(
        (snapshot) => {
          const incidents = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Incident[];
          callback(incidents);
        },
        (error) => {
          console.error('Error in incidents subscription:', error);
          callback([]);
        }
      );
  } catch (error) {
    console.error('Error setting up incidents subscription:', error);
    return () => {};
  }
};

/**
 * Get incidents for a specific floor
 */
export const getIncidentsByFloor = async (floor: FloorType): Promise<Incident[]> => {
  try {
    const snapshot = await incidentsCollection
      .where('location.floor', '==', floor)
      .where('status', 'in', ['reported', 'in-progress'])
      .orderBy('reportedAt', 'desc')
      .get();
      
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Incident[];
  } catch (error) {
    console.error(`Error getting incidents for floor ${floor}:`, error);
    return [];
  }
};

/**
 * Subscribe to incidents for a specific floor (real-time)
 */
export const subscribeToFloorIncidents = (
  floor: FloorType,
  callback: (incidents: Incident[]) => void
): (() => void) => {
  try {
    return incidentsCollection
      .where('location.floor', '==', floor)
      .where('status', 'in', ['reported', 'in-progress'])
      .orderBy('reportedAt', 'desc')
      .onSnapshot(
        (snapshot) => {
          const incidents = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Incident[];
          callback(incidents);
        },
        (error) => {
          console.error(`Error in floor ${floor} incidents subscription:`, error);
          callback([]);
        }
      );
  } catch (error) {
    console.error(`Error setting up floor ${floor} incidents subscription:`, error);
    return () => {};
  }
};

/**
 * Get a single incident
 */
export const getIncident = async (incidentId: string): Promise<Incident | null> => {
  try {
    const docSnap = await incidentsCollection.doc(incidentId).get();
    
    if (!docSnap.exists) {
      return null;
    }
    
    return { id: docSnap.id, ...docSnap.data() } as Incident;
  } catch (error) {
    console.error('Error fetching incident:', error);
    throw error;
  }
};

/**
 * Update an incident status and add entry to history
 */
export const updateIncidentStatus = async (
  incidentId: string,
  status: IncidentStatus,
  notes?: string
): Promise<void> => {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      throw new Error('User must be logged in to update an incident');
    }
    
    const now = firestore.Timestamp.now();
    
    // Create new status history entry
    const statusHistoryEntry = {
      status,
      timestamp: now,
      updatedBy: {
        id: currentUser.uid,
        name: currentUser.displayName || 'Anonymous User'
      },
      notes
    };
    
    // Update document
    await incidentsCollection.doc(incidentId).update({
      status,
      updatedAt: now,
      statusHistory: firestore.FieldValue.arrayUnion(statusHistoryEntry)
    });
  } catch (error) {
    console.error('Error updating incident status:', error);
    Alert.alert('Error', 'Failed to update incident status. Please try again.');
    throw error;
  }
};

/**
 * Assign an incident to a user
 */
export const assignIncident = async (
  incidentId: string, 
  assigneeId: string, 
  assigneeName: string
): Promise<void> => {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      throw new Error('User must be logged in to assign an incident');
    }
    
    const now = firestore.Timestamp.now();
    
    // Update document
    await incidentsCollection.doc(incidentId).update({
      assignedTo: {
        id: assigneeId,
        name: assigneeName
      },
      updatedAt: now
    });
  } catch (error) {
    console.error('Error assigning incident:', error);
    Alert.alert('Error', 'Failed to assign incident. Please try again.');
    throw error;
  }
};

/**
 * Add media URLs to an incident
 */
export const addIncidentMedia = async (
  incidentId: string,
  mediaUrls: string[]
): Promise<void> => {
  if (!mediaUrls.length) return;
  
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      throw new Error('User must be logged in to add media to an incident');
    }
    
    const now = firestore.Timestamp.now();
    
    // Update document by adding new URLs to the existing array
    await incidentsCollection.doc(incidentId).update({
      mediaUrls: firestore.FieldValue.arrayUnion(...mediaUrls),
      updatedAt: now
    });
  } catch (error) {
    console.error('Error adding media to incident:', error);
    Alert.alert('Error', 'Failed to add media to incident. Please try again.');
    throw error;
  }
};

/**
 * Subscribe to real-time updates for a specific incident
 */
export const subscribeToIncident = (
  incidentId: string,
  callback: (incident: Incident | null) => void
): () => void => {
  // Create listener
  return incidentsCollection.doc(incidentId).onSnapshot(
    (docSnapshot) => {
      if (docSnapshot.exists) {
        const incident = { id: docSnapshot.id, ...docSnapshot.data() } as Incident;
        callback(incident);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Error listening to incident updates:', error);
      Alert.alert('Connection Error', 'There was an error connecting to the incident data.');
    }
  );
};

/**
 * Service for managing incidents
 */
const incidentService = {
  /**
   * Get all incidents with optional filters
   * @param filters - Optional filters for incidents
   */
  getIncidents: async (filters?: {
    status?: IncidentStatus;
    type?: IncidentType;
    assignedTo?: string;
    buildingId?: string;
    floorId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Incident[]> => {
    try {
      const response = await apiClient.get(INCIDENTS_ENDPOINT, {
        params: filters
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching incidents:', error);
      throw error;
    }
  },

  /**
   * Get a specific incident by ID
   * @param incidentId - The ID of the incident to fetch
   */
  getIncident: async (incidentId: string): Promise<Incident> => {
    try {
      const response = await apiClient.get(`${INCIDENTS_ENDPOINT}/${incidentId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching incident ${incidentId}:`, error);
      throw error;
    }
  },

  /**
   * Create a new incident
   * @param incident - The incident data to create
   */
  createIncident: async (incident: Partial<Incident>): Promise<Incident> => {
    try {
      const response = await apiClient.post(INCIDENTS_ENDPOINT, incident);
      return response.data;
    } catch (error) {
      console.error('Error creating incident:', error);
      throw error;
    }
  },

  /**
   * Update an existing incident
   * @param incidentId - The ID of the incident to update
   * @param updates - The fields to update
   */
  updateIncident: async (incidentId: string, updates: Partial<Incident>): Promise<Incident> => {
    try {
      const response = await apiClient.patch(`${INCIDENTS_ENDPOINT}/${incidentId}`, updates);
      return response.data;
    } catch (error) {
      console.error(`Error updating incident ${incidentId}:`, error);
      throw error;
    }
  },

  /**
   * Delete an incident
   * @param incidentId - The ID of the incident to delete
   */
  deleteIncident: async (incidentId: string): Promise<void> => {
    try {
      await apiClient.delete(`${INCIDENTS_ENDPOINT}/${incidentId}`);
    } catch (error) {
      console.error(`Error deleting incident ${incidentId}:`, error);
      throw error;
    }
  },

  /**
   * Upload media (photos, videos) related to an incident
   * @param incidentId - The ID of the incident
   * @param mediaFile - The media file to upload
   * @param mediaType - The type of media (photo or video)
   */
  uploadMedia: async (
    incidentId: string,
    mediaFile: any,
    mediaType: 'photo' | 'video'
  ): Promise<string> => {
    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', mediaFile);
      formData.append('type', mediaType);
      formData.append('incidentId', incidentId);

      const response = await apiClient.post(`${MEDIA_ENDPOINT}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.mediaUrl;
    } catch (error) {
      console.error(`Error uploading media for incident ${incidentId}:`, error);
      throw error;
    }
  },

  /**
   * Get incidents near a specific location
   * @param buildingId - The building ID
   * @param floorId - The floor ID
   * @param radius - Search radius in meters
   * @param coordinates - The x, y coordinates
   */
  getIncidentsNearLocation: async (
    buildingId: string,
    floorId: string,
    coordinates: { x: number; y: number },
    radius: number = 50
  ): Promise<Incident[]> => {
    try {
      const response = await apiClient.get(`${INCIDENTS_ENDPOINT}/nearby`, {
        params: {
          buildingId,
          floorId,
          x: coordinates.x,
          y: coordinates.y,
          radius
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching nearby incidents:', error);
      throw error;
    }
  },

  /**
   * Save incident as draft locally when offline
   * @param incident - The incident data to save as draft
   */
  saveDraft: async (incident: Partial<Incident>): Promise<string> => {
    try {
      const draftId = `draft_${Date.now()}`;
      const draft = {
        id: draftId,
        ...incident,
        isDraft: true,
        createdAt: new Date().toISOString()
      };

      // Get existing drafts
      const existingDrafts = await storageService.getItem(INCIDENT_DRAFTS_KEY) || '[]';
      const drafts = JSON.parse(existingDrafts);
      
      // Add new draft
      drafts.push(draft);
      
      // Save updated drafts
      await storageService.setItem(INCIDENT_DRAFTS_KEY, JSON.stringify(drafts));
      return draftId;
    } catch (error) {
      console.error('Error saving incident draft:', error);
      throw error;
    }
  },

  /**
   * Get all saved incident drafts
   */
  getDrafts: async (): Promise<Incident[]> => {
    try {
      const drafts = await storageService.getItem(INCIDENT_DRAFTS_KEY) || '[]';
      return JSON.parse(drafts);
    } catch (error) {
      console.error('Error getting incident drafts:', error);
      return [];
    }
  },

  /**
   * Delete an incident draft
   */
  deleteDraft: async (draftId: string): Promise<void> => {
    try {
      const draftsJSON = await storageService.getItem(INCIDENT_DRAFTS_KEY) || '[]';
      const drafts = JSON.parse(draftsJSON);
      
      const updatedDrafts = drafts.filter((draft: any) => draft.id !== draftId);
      
      await storageService.setItem(INCIDENT_DRAFTS_KEY, JSON.stringify(updatedDrafts));
    } catch (error) {
      console.error('Error deleting incident draft:', error);
      throw error;
    }
  },

  /**
   * Update an incident draft
   */
  updateDraft: async (draftId: string, updates: Partial<Incident>): Promise<void> => {
    try {
      const draftsJSON = await storageService.getItem(INCIDENT_DRAFTS_KEY) || '[]';
      const drafts = JSON.parse(draftsJSON);
      
      const draftIndex = drafts.findIndex((draft: any) => draft.id === draftId);
      
      if (draftIndex === -1) {
        throw new Error(`Draft with ID ${draftId} not found`);
      }
      
      drafts[draftIndex] = {
        ...drafts[draftIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await storageService.setItem(INCIDENT_DRAFTS_KEY, JSON.stringify(drafts));
    } catch (error) {
      console.error('Error updating incident draft:', error);
      throw error;
    }
  },
  
  /**
   * Submit a draft as an incident
   */
  submitDraft: async (draftId: string): Promise<string> => {
    try {
      const draftsJSON = await storageService.getItem(INCIDENT_DRAFTS_KEY) || '[]';
      const drafts = JSON.parse(draftsJSON);
      
      const draft = drafts.find((d: any) => d.id === draftId);
      
      if (!draft) {
        throw new Error(`Draft with ID ${draftId} not found`);
      }
      
      // Remove draft-specific properties
      const { id, isDraft, ...incidentData } = draft;
      
      // Submit as incident with offline support
      const incidentId = await createIncidentWithOfflineSupport(incidentData);
      
      // If successful, remove from drafts
      await incidentService.deleteDraft(draftId);
      
      return incidentId;
    } catch (error) {
      console.error('Error submitting draft:', error);
      throw error;
    }
  },
  
  /**
   * Get pending offline incidents count
   */
  getPendingIncidentsCount: async (): Promise<number> => {
    try {
      const queueJSON = await storageService.getItem(INCIDENT_QUEUE_KEY) || '[]';
      const queue = JSON.parse(queueJSON);
      return queue.length;
    } catch (error) {
      console.error('Error getting pending incidents count:', error);
      return 0;
    }
  },
  
  /**
   * Force sync offline incidents
   */
  syncOfflineIncidents: async (): Promise<{
    success: number;
    failed: number;
    total: number;
  }> => {
    return processOfflineIncidentQueue();
  },

  /**
   * Create a new incident with offline support
   */
  createIncidentWithOfflineSupport,

  /**
   * Add incident to offline queue
   */
  addToOfflineQueue,

  /**
   * Process offline incident queue
   */
  processOfflineIncidentQueue,

  /**
   * Check for connectivity and process queue when online
   */
  setupQueueProcessingOnConnectivity: (): () => void => {
    const unsubscribe = NetInfo.addEventListener(async state => {
      if (state.isConnected && state.isInternetReachable) {
        console.log('Connection restored, processing incident queue');
        await processOfflineIncidentQueue();
      }
    });
    
    return unsubscribe;
  },

  // Methods for offline incident submission and drafts
  saveIncidentOffline: async (incident: Incident): Promise<void> => {
    try {
      // If the incident doesn't have an ID, create one
      if (!incident.id) {
        incident.id = uuid.v4().toString();
      }
      
      // Get existing offline incidents
      const offlineIncidentsString = await AsyncStorage.getItem(OFFLINE_INCIDENTS_KEY);
      const offlineIncidents: OfflineIncident[] = offlineIncidentsString 
        ? JSON.parse(offlineIncidentsString) 
        : [];
      
      // Create offline incident record
      const offlineIncident: OfflineIncident = {
        id: uuid.v4().toString(),
        incident,
        submissionAttempts: 0,
        createdAt: new Date().toISOString(),
      };
      
      // Add to offline incidents
      offlineIncidents.push(offlineIncident);
      
      // Save updated offline incidents
      await AsyncStorage.setItem(OFFLINE_INCIDENTS_KEY, JSON.stringify(offlineIncidents));
    } catch (error) {
      console.error('Error saving incident offline:', error);
      throw error;
    }
  },

  getOfflineIncidents,

  submitOfflineIncidents: async (): Promise<void> => {
    try {
      const offlineIncidents = await getOfflineIncidents();
      if (offlineIncidents.length === 0) return;
      
      // Create a new array for incidents that fail to submit
      const remainingOfflineIncidents: OfflineIncident[] = [];
      
      for (const offlineIncident of offlineIncidents) {
        try {
          // Skip incidents that have too many submission attempts
          if (offlineIncident.submissionAttempts >= 3) {
            console.warn(`Skipping submission for incident ${offlineIncident.id} after ${offlineIncident.submissionAttempts} attempts`);
            continue;
          }
          
          // Try to submit the incident
          const incident = offlineIncident.incident;
          const response = await apiClient.post('/incidents', incident);
          
          // If the incident has media files, upload them
          if (incident.mediaUrls && incident.mediaUrls.length > 0) {
            const createdIncidentId = response.data.id;
            
            for (const mediaUrl of incident.mediaUrls) {
              try {
                // Create form data for media upload
                const formData = new FormData();
                formData.append('file', {
                  uri: mediaUrl,
                  name: mediaUrl.split('/').pop() || `media-${Date.now()}.${mediaUrl.endsWith('.jpg') ? 'jpg' : 'mp4'}`,
                  type: mediaUrl.endsWith('.jpg') ? 'image/jpeg' : 'video/mp4',
                } as any);
                formData.append('incidentId', createdIncidentId);
                
                // Upload the media
                await apiClient.post('/media/upload', formData, {
                  headers: {
                    'Content-Type': 'multipart/form-data',
                  },
                });
              } catch (error) {
                console.error(`Error uploading media for incident ${createdIncidentId}:`, error);
              }
            }
          }
        } catch (error) {
          console.error(`Error submitting offline incident ${offlineIncident.id}:`, error);
          // Increment attempts and add back to remaining incidents
          offlineIncident.submissionAttempts += 1;
          remainingOfflineIncidents.push(offlineIncident);
        }
      }
      
      // Save remaining incidents
      await AsyncStorage.setItem(OFFLINE_INCIDENTS_KEY, JSON.stringify(remainingOfflineIncidents));
    } catch (error) {
      console.error('Error submitting offline incidents:', error);
    }
  },

  submitIncidentDraft,

  submitOfflineDrafts: async (): Promise<void> => {
    try {
      const drafts = await getIncidentDrafts();
      const offlineDrafts = drafts.filter(draft => draft.isOffline);
      
      for (const draft of offlineDrafts) {
        try {
          await submitIncidentDraft(draft.id);
        } catch (error) {
          console.error(`Error submitting offline draft ${draft.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error submitting offline drafts:', error);
    }
  },

  // Export direct functions for advanced usage
  subscribeToIncident,
  getIncidentDraftById,
  getIncidentDrafts,
  deleteIncidentDraft,
  saveIncidentDraft
};

export default incidentService;