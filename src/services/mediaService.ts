import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { v4 as uuidv4 } from 'uuid';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library'; 
import { Asset } from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import apiClient from './apiClient';
import { handleApiError } from '../utils/errorHandling';

// Queue key for file system
const MEDIA_UPLOAD_QUEUE_KEY = 'media_upload_queue.json';
const OFFLINE_MEDIA_DIR = 'offline_media/';

// Types for media
export interface MediaFile {
  id: string;
  uri: string;
  type: 'image' | 'video';
  timestamp: number;
  incidentId?: string;
  isUploaded?: boolean;
  uploadUrl?: string;
}

// Move this function from incidentService.ts to break the circular dependency
const addMediaToIncident = async (
  incidentId: string,
  mediaUrls: string[]
): Promise<void> => {
  if (!mediaUrls.length) return;

  try {
    const now = firestore.Timestamp.now();

    // Update document by adding new URLs to the existing array using React Native Firebase SDK
    await firestore().collection('incidents').doc(incidentId).update({
      mediaUrls: firestore.FieldValue.arrayUnion(...mediaUrls),
      updatedAt: now
    });
  } catch (error) {
    console.error('Error adding media to incident:', error);
    throw error;
  }
};

interface MediaUploadQueueItem {
  id: string;
  mediaFile: MediaFile;
  incidentId: string | null;
  timestamp: number;
  attempts: number;
}

/**
 * Compress an image to reduce file size
 */
export const compressImage = async (
  uri: string,
  quality: number = 0.7,
  maxWidth: number = 1200
): Promise<string> => {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: maxWidth } }],
      { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
    );

    return result.uri;
  } catch (error) {
    console.error('Error compressing image:', error);
    // Return original if compression fails
    return uri;
  }
};

/**
 * Get MIME type from URI
 */
const getMimeType = (uri: string): string => {
  const extension = uri.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'mp4':
      return 'video/mp4';
    case 'mov':
      return 'video/quicktime';
    default:
      return 'application/octet-stream';
  }
};

/**
 * Check if device is online
 */
const isOnline = async (): Promise<boolean> => {
  const netInfo = await NetInfo.fetch();
  return !!netInfo.isConnected && !!netInfo.isInternetReachable;
};

/**
 * Upload media directly or queue for later if offline
 */
export const uploadMedia = async (
  uri: string,
  type: 'image' | 'video',
  incidentId?: string
): Promise<string | null> => {
  try {
    const online = await isOnline();

    if (online) {
      // Device is online - try direct upload
      return await uploadIncidentMedia(uri, type);
    } else {
      // Device is offline - queue for later
      if (incidentId) {
        await queueMediaForUpload(uri, type, incidentId);
        return `pending:${uri}`; // Return a pending marker
      } else {
        throw new Error('Incident ID is required for offline queuing');
      }
    }
  } catch (error) {
    console.error('Error in uploadMedia:', error);
    if (incidentId) {
      await queueMediaForUpload(uri, type, incidentId);
      return `pending:${uri}`;
    }
    return null;
  }
};

/**
 * Upload incident media to Firebase Storage
 */
export const uploadIncidentMedia = async (
  uri: string,
  type: 'image' | 'video'
): Promise<string | null> => {
  try {
    // For images, compress before upload
    let uploadUri = uri;
    if (type === 'image') {
      uploadUri = await compressImage(uri);
    }

    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(uploadUri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }

    // Generate unique filename
    const filename = `${uuidv4()}.${uploadUri.split('.').pop()}`;
    
    // Path in Firebase Storage
    const storagePath = `incidents/${type}s/${filename}`;
    
    // Create reference using React Native Firebase SDK
    const storageRef = storage().ref(storagePath);
    
    // Upload file with React Native Firebase SDK
    await storageRef.putFile(uploadUri);
    
    // Get download URL
    const downloadURL = await storageRef.getDownloadURL();
    return downloadURL;
  } catch (error) {
    console.error('Error uploading media:', error);
    return null;
  }
};

/**
 * Queue media for upload when offline
 */
export const queueMediaForUpload = async (
  uri: string,
  type: 'image' | 'video',
  incidentId: string
): Promise<void> => {
  try {
    // Generate a temporary local path to store the media
    const localDir = `${FileSystem.documentDirectory}${OFFLINE_MEDIA_DIR}`;
    const filename = `${incidentId}_${Date.now()}_${uuidv4()}.${uri.split('.').pop()}`;
    const localUri = `${localDir}${filename}`;

    // Ensure directory exists
    await FileSystem.makeDirectoryAsync(localDir, { intermediates: true });

    // For images, compress before storing
    let storeUri = uri;
    if (type === 'image') {
      storeUri = await compressImage(uri);
    }

    // Copy file to local storage
    await FileSystem.copyAsync({
      from: storeUri,
      to: localUri,
    });

    // Get current queue from storage or initialize empty array
    const queuePath = `${FileSystem.documentDirectory}${MEDIA_UPLOAD_QUEUE_KEY}`;
    const queueStr = await FileSystem.readAsStringAsync(queuePath, {
      encoding: FileSystem.EncodingType.UTF8
    }).catch(() => '[]');

    const queue = JSON.parse(queueStr);

    // Add to queue
    queue.push({
      uri: localUri,
      type,
      incidentId,
      timestamp: Date.now(),
    });

    // Save updated queue
    await FileSystem.writeAsStringAsync(
      queuePath,
      JSON.stringify(queue),
      { encoding: FileSystem.EncodingType.UTF8 }
    );

    console.log(`Media queued for upload: ${localUri} for incident ${incidentId}`);
  } catch (error) {
    console.error('Error queuing media for upload:', error);
    throw error;
  }
};

/**
 * Process queued media uploads
 */
export const processQueuedUploads = async (): Promise<{
  success: number;
  failed: number;
  total: number;
}> => {
  try {
    // Check if device is online
    const online = await isOnline();
    if (!online) {
      console.log('Device is offline, skipping queued upload processing');
      return { success: 0, failed: 0, total: 0 };
    }

    const queuePath = `${FileSystem.documentDirectory}${MEDIA_UPLOAD_QUEUE_KEY}`;

    // Check if queue file exists
    const queueExists = await FileSystem.getInfoAsync(queuePath);
    if (!queueExists.exists) {
      return { success: 0, failed: 0, total: 0 };
    }

    // Read queue
    const queueStr = await FileSystem.readAsStringAsync(queuePath, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const queue = JSON.parse(queueStr);
    if (queue.length === 0) {
      return { success: 0, failed: 0, total: 0 };
    }

    console.log(`Processing ${queue.length} queued media uploads`);

    // Process each item
    const updatedQueue = [];
    let successCount = 0;
    let failedCount = 0;

    for (const item of queue) {
      try {
        // Check if file exists
        const fileExists = await FileSystem.getInfoAsync(item.uri);
        if (!fileExists.exists) {
          console.log(`File no longer exists: ${item.uri}`);
          continue;
        }

        // Upload file
        const downloadURL = await uploadIncidentMedia(item.uri, item.type);

        // If upload successful, update the incident with the new URL
        if (downloadURL) {
          // Update the incident with the new media URL
          await addMediaToIncident(item.incidentId, [downloadURL]);

          console.log(`Successfully uploaded queued media: ${downloadURL} for incident ${item.incidentId}`);

          // Remove local file after successful upload
          await FileSystem.deleteAsync(item.uri);
          successCount++;
        } else {
          // Keep in queue if upload failed
          updatedQueue.push(item);
          failedCount++;
        }
      } catch (error) {
        console.error('Error processing queued item:', error);
        // Keep in queue if processing failed
        updatedQueue.push(item);
        failedCount++;
      }
    }

    // Save updated queue
    await FileSystem.writeAsStringAsync(
      queuePath,
      JSON.stringify(updatedQueue),
      { encoding: FileSystem.EncodingType.UTF8 }
    );

    console.log(`Queue processing complete. Success: ${successCount}, Failed: ${failedCount}, Remaining: ${updatedQueue.length}`);

    return {
      success: successCount,
      failed: failedCount,
      total: queue.length
    };
  } catch (error) {
    console.error('Error processing queued uploads:', error);
    return { success: 0, failed: 0, total: 0 };
  }
};

/**
 * Checks and processes the media upload queue when connectivity changes
 * @returns A cleanup function to unsubscribe
 */
export const setupQueueProcessingOnConnectivity = (): () => void => {
  const unsubscribe = NetInfo.addEventListener(async state => {
    if (state.isConnected && state.isInternetReachable) {
      console.log('Connection restored, processing media upload queue');
      await processQueuedUploads();
    }
  });

  return unsubscribe;
};

/**
 * Get pending upload count
 */
export const getPendingUploadsCount = async (): Promise<number> => {
  try {
    const queuePath = `${FileSystem.documentDirectory}${MEDIA_UPLOAD_QUEUE_KEY}`;

    // Check if queue file exists
    const queueExists = await FileSystem.getInfoAsync(queuePath);
    if (!queueExists.exists) {
      return 0;
    }

    // Read queue
    const queueStr = await FileSystem.readAsStringAsync(queuePath, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const queue = JSON.parse(queueStr);
    return queue.length;
  } catch (error) {
    console.error('Error getting pending uploads count:', error);
    return 0;
  }
};

// Save media to device storage
export const saveMediaToDevice = async (uri: string, type: 'image' | 'video'): Promise<MediaFile> => {
  try {
    // Request permissions
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Media library permission not granted');
    }

    // For Android, we need to save to media library
    // For iOS, we'll copy to app's documents directory
    let savedUri = uri;

    if (Platform.OS === 'android') {
      const asset = await MediaLibrary.createAssetAsync(uri);
      savedUri = asset.uri;
    } else {
      // Copy to app's documents directory with a unique name
      const fileExtension = type === 'image' ? 'jpg' : 'mp4';
      const fileName = `${uuid.v4()}.${fileExtension}`;
      const destinationUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.copyAsync({
        from: uri,
        to: destinationUri,
      });

      savedUri = destinationUri;
    }

    const mediaFile: MediaFile = {
      id: uuid.v4().toString(),
      uri: savedUri,
      type,
      timestamp: Date.now(),
      isUploaded: false,
    };

    return mediaFile;
  } catch (error) {
    console.error('Error saving media:', error);
    throw error;
  }
};

// Add media to upload queue for offline handling
export const addToMediaUploadQueue = async (
  mediaFile: MediaFile,
  incidentId: string | null
): Promise<void> => {
  try {
    // Get current queue
    const queueString = await AsyncStorage.getItem(MEDIA_UPLOAD_QUEUE_KEY);
    const queue: MediaUploadQueueItem[] = queueString ? JSON.parse(queueString) : [];

    // Add new item to queue
    const queueItem: MediaUploadQueueItem = {
      id: uuid.v4().toString(),
      mediaFile,
      incidentId,
      timestamp: Date.now(),
      attempts: 0,
    };

    queue.push(queueItem);

    // Save updated queue
    await AsyncStorage.setItem(MEDIA_UPLOAD_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error adding media to upload queue:', error);
    throw error;
  }
};

// Get the current media upload queue
export const getMediaUploadQueue = async (): Promise<MediaUploadQueueItem[]> => {
  try {
    const queueString = await AsyncStorage.getItem(MEDIA_UPLOAD_QUEUE_KEY);
    return queueString ? JSON.parse(queueString) : [];
  } catch (error) {
    console.error('Error getting media upload queue:', error);
    return [];
  }
};

// Upload a media file to the server
export const uploadMediaFile = async (
  mediaFile: MediaFile,
  incidentId?: string
): Promise<string> => {
  try {
    // Create form data for the upload
    const formData = new FormData();

    // Add the file
    formData.append('file', {
      uri: mediaFile.uri,
      name: mediaFile.uri.split('/').pop() || `${uuid.v4()}.${mediaFile.type === 'image' ? 'jpg' : 'mp4'}`,
      type: mediaFile.type === 'image' ? 'image/jpeg' : 'video/mp4',
    } as any);

    // Add incident ID if provided
    if (incidentId) {
      formData.append('incidentId', incidentId);
    }

    // Make the upload request
    const response = await apiClient.post('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.data || !response.data.url) {
      throw new Error('Invalid response from server');
    }

    return response.data.url;
  } catch (error) {
    console.error('Error uploading media:', error);
    // Add to offline queue if upload fails
    await addToMediaUploadQueue(mediaFile, incidentId || null);
    // Create AppError and throw it
    const appError = handleApiError(error);
    throw appError;
  }
};

/**
 * Process the media upload queue when connectivity is restored
 * This function will attempt to upload all queued media files
 */
export const processMediaUploadQueue = async (): Promise<{
  success: number;
  failed: number;
  total: number;
}> => {
  try {
    // Check if device is online
    const online = await isOnline();
    if (!online) {
      console.log('Device is offline, skipping media upload queue processing');
      return { success: 0, failed: 0, total: 0 };
    }

    // Get the upload queue
    const queue = await getMediaUploadQueue();
    const total = queue.length;

    if (total === 0) {
      return { success: 0, failed: 0, total: 0 };
    }

    console.log(`Processing media upload queue with ${total} items`);

    let success = 0;
    let failed = 0;

    // Sort queue by timestamp (oldest first)
    const sortedQueue = [...queue].sort((a, b) => a.timestamp - b.timestamp);

    // Process each item
    for (const item of sortedQueue) {
      try {
        // Skip items that have been attempted too many times
        if (item.attempts >= 3) {
          console.log(`Skipping item ${item.id} after ${item.attempts} failed attempts`);
          failed++;
          continue;
        }

        // Update attempt count
        item.attempts += 1;

        // Upload the media file
        const mediaFile = item.mediaFile;
        const incidentId = item.incidentId;

        // Upload and get URL
        const uploadUrl = await uploadMediaFile(mediaFile, incidentId || undefined);

        // If we have an incidentId, update the incident with the media URL
        if (incidentId && uploadUrl) {
          await addMediaToIncident(incidentId, [uploadUrl]);
        }

        // Remove the item from the queue
        const updatedQueue = queue.filter(q => q.id !== item.id);
        await AsyncStorage.setItem(MEDIA_UPLOAD_QUEUE_KEY, JSON.stringify(updatedQueue));

        // Delete the local copy if it was created for offline storage
        if (mediaFile.uri.includes(OFFLINE_MEDIA_DIR)) {
          await FileSystem.deleteAsync(mediaFile.uri, { idempotent: true });
        }

        success++;
        console.log(`Successfully uploaded queued media: ${item.id}`);
      } catch (error) {
        console.error(`Error processing queue item ${item.id}:`, error);
        failed++;

        // Update the attempts count in the queue
        const updatedQueue = queue.map(q =>
          q.id === item.id ? { ...q, attempts: q.attempts + 1 } : q
        );
        await AsyncStorage.setItem(MEDIA_UPLOAD_QUEUE_KEY, JSON.stringify(updatedQueue));
      }
    }

    console.log(`Media queue processing completed: ${success} successful, ${failed} failed, ${total} total`);
    return { success, failed, total };
  } catch (error) {
    console.error('Error processing media upload queue:', error);
    return { success: 0, failed: 0, total: 0 };
  }
};

// Delete media from the device
export const deleteMedia = async (mediaFile: MediaFile): Promise<void> => {
  try {
    if (typeof mediaFile.uri === 'string' && mediaFile.uri !== null && mediaFile.uri.startsWith(FileSystem.documentDirectory)) {
      await FileSystem.deleteAsync(mediaFile.uri);
    } else {
      // For media saved in the media library
      try {
        // Find the asset with this URI
        const asset = await MediaLibrary.getAssetInfoAsync(mediaFile.uri);
        if (asset) {
          await MediaLibrary.deleteAssetsAsync([asset]);
        }
      } catch (error) {
        console.error('Error deleting media from media library:', error);
      }
    }
  } catch (error) {
    console.error('Error deleting media:', error);
    throw error;
  }
};

// Clean up the media upload queue - remove successfully uploaded items
export const cleanupMediaUploadQueue = async (): Promise<void> => {
  try {
    const queue = await getMediaUploadQueue();
    if (queue.length === 0) return;

    // Filter out items that have been successfully uploaded
    const newQueue = queue.filter(item => !item.mediaFile.isUploaded);

    // Save the updated queue
    await AsyncStorage.setItem(MEDIA_UPLOAD_QUEUE_KEY, JSON.stringify(newQueue));
  } catch (error) {
    console.error('Error cleaning up media upload queue:', error);
  }
};

// Export main functions
export default {
  uploadMedia,
  compressImage,
  queueMediaForUpload,
  processQueuedUploads,
  setupQueueProcessingOnConnectivity,
  getPendingUploadsCount,
  saveMediaToDevice,
  addToMediaUploadQueue,
  getMediaUploadQueue,
  uploadMediaFile,
  processMediaUploadQueue,
  deleteMedia,
  cleanupMediaUploadQueue
};