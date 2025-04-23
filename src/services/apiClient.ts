import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { auth } from '../config/firebase';
import { Alert } from 'react-native';

// Define base URL for development and production
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api' // Development server URL
  : 'https://fire-rescue-expert-app.vercel.app/api'; // Production server URL

// Storage key for auth token
const AUTH_TOKEN_KEY = 'auth_token';

// Client configuration
const config: AxiosRequestConfig = {
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
};

// Create axios instance
const apiClient: AxiosInstance = axios.create(config);

// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    // Check network connection
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      // If no connection, we'll let the request proceed
      // but add a flag to identify it as offline
      config.headers = config.headers || {};
      config.headers['X-Offline-Request'] = 'true';
    }

    // Get auth token from AsyncStorage
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      
      // If no stored token, try to get from Firebase auth
      if (!token && auth.currentUser) {
        const idToken = await auth.currentUser.getIdToken(true);
        if (idToken) {
          await AsyncStorage.setItem(AUTH_TOKEN_KEY, idToken);
          config.headers = config.headers || {};
          config.headers['Authorization'] = `Bearer ${idToken}`;
        }
      } else if (token) {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error setting auth token:', error);
    }

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    if (error.response) {
      // Handle different HTTP error status codes
      switch (error.response.status) {
        case 401: // Unauthorized
          // Clear stored token
          await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
          
          // If Firebase user exists, refresh token and retry
          if (auth.currentUser) {
            try {
              const newToken = await auth.currentUser.getIdToken(true);
              await AsyncStorage.setItem(AUTH_TOKEN_KEY, newToken);
              
              // Clone the original request and set new token
              const originalRequest = error.config;
              if (originalRequest && originalRequest.headers) {
                originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                // Retry the request with new token
                return apiClient(originalRequest);
              }
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
              // Force logout if token refresh fails
              auth.signOut();
              Alert.alert('Session Expired', 'Please sign in again.');
            }
          }
          break;
          
        case 403: // Forbidden
          Alert.alert('Access Denied', 'You do not have permission to perform this action.');
          break;
          
        case 404: // Not Found
          console.warn('Resource not found:', error.config?.url);
          break;
          
        case 500: // Server Error
        case 502: // Bad Gateway
        case 503: // Service Unavailable
          Alert.alert('Server Error', 'There was a problem with the server. Please try again later.');
          break;
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      
      // Check if network is available
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        console.log('Network unavailable, queuing request for later');
        // Here you can implement logic to queue the request for later
        // when connection is restored
        return Promise.reject({
          ...error,
          isOffline: true,
          offlineRequest: error.config
        });
      }
    } else {
      // Something happened in setting up the request
      console.error('Error setting up request:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Helper function to refresh auth token
export const refreshAuthToken = async (): Promise<string | null> => {
  try {
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken(true);
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      return token;
    }
    return null;
  } catch (error) {
    console.error('Failed to refresh auth token:', error);
    return null;
  }
};

// Helper to check if a request can be made (network available)
export const canMakeRequest = async (): Promise<boolean> => {
  const netInfo = await NetInfo.fetch();
  return netInfo.isConnected === true;
};

// Interface for offline request queue
export interface QueuedRequest {
  id: string;
  config: AxiosRequestConfig;
  timestamp: number;
  retryCount: number;
}

// Maximum retry attempts for queued requests
const MAX_RETRY_ATTEMPTS = 3;

// Storage key for request queue
const REQUEST_QUEUE_KEY = 'offline_request_queue';

// Add request to offline queue
export const queueRequest = async (config: AxiosRequestConfig): Promise<string> => {
  try {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const queuedRequest: QueuedRequest = {
      id: requestId,
      config,
      timestamp: Date.now(),
      retryCount: 0
    };
    
    // Get current queue
    const queueString = await AsyncStorage.getItem(REQUEST_QUEUE_KEY);
    const queue: QueuedRequest[] = queueString ? JSON.parse(queueString) : [];
    
    // Add to queue
    queue.push(queuedRequest);
    
    // Save updated queue
    await AsyncStorage.setItem(REQUEST_QUEUE_KEY, JSON.stringify(queue));
    
    return requestId;
  } catch (error) {
    console.error('Error queueing request:', error);
    throw error;
  }
};

// Process offline request queue
export const processRequestQueue = async (): Promise<{
  success: number;
  failed: number;
  total: number;
}> => {
  try {
    // Check if online
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      console.log('Device is offline, cannot process request queue');
      return { success: 0, failed: 0, total: 0 };
    }
    
    // Get queue
    const queueString = await AsyncStorage.getItem(REQUEST_QUEUE_KEY);
    const queue: QueuedRequest[] = queueString ? JSON.parse(queueString) : [];
    
    if (queue.length === 0) {
      return { success: 0, failed: 0, total: 0 };
    }
    
    console.log(`Processing ${queue.length} queued requests`);
    
    let successCount = 0;
    let failedCount = 0;
    const remainingQueue: QueuedRequest[] = [];
    
    // Process each request
    for (const request of queue) {
      try {
        // Skip if too many retries
        if (request.retryCount >= MAX_RETRY_ATTEMPTS) {
          console.warn(`Skipping request ${request.id} after ${request.retryCount} failed attempts`);
          failedCount++;
          continue;
        }
        
        // Execute request
        await apiClient(request.config);
        successCount++;
        
      } catch (error) {
        console.error(`Error processing queued request ${request.id}:`, error);
        
        // Increment retry count and keep in queue
        request.retryCount++;
        remainingQueue.push(request);
        failedCount++;
      }
    }
    
    // Save remaining queue
    await AsyncStorage.setItem(REQUEST_QUEUE_KEY, JSON.stringify(remainingQueue));
    
    return {
      success: successCount,
      failed: failedCount,
      total: queue.length
    };
  } catch (error) {
    console.error('Error processing request queue:', error);
    return { success: 0, failed: 0, total: 0 };
  }
};

// Setup network change listener to process queue when online
export const setupQueueProcessingOnConnectivity = (): () => void => {
  return NetInfo.addEventListener(async state => {
    if (state.isConnected) {
      console.log('Connection restored, processing request queue');
      await processRequestQueue();
    }
  });
};

// Export modified client with offline support
export default {
  ...apiClient,
  get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    try {
      return await apiClient.get<T>(url, config);
    } catch (error: any) {
      if (error.isOffline) {
        // For GET requests, we don't queue them since they're usually fetching current data
        // Instead, throw a specific offline error
        throw new Error('Network unavailable for data retrieval');
      }
      throw error;
    }
  },
  post: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    try {
      return await apiClient.post<T>(url, data, config);
    } catch (error: any) {
      if (error.isOffline && error.offlineRequest) {
        // Queue POST request for later
        const requestId = await queueRequest(error.offlineRequest);
        console.log(`Request queued with ID: ${requestId}`);
        // Return a mock response
        return {
          data: { success: true, offlineQueued: true, requestId } as any,
          status: 200,
          statusText: 'OK (Offline Queued)',
          headers: {},
          config: error.offlineRequest
        };
      }
      throw error;
    }
  },
  put: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    try {
      return await apiClient.put<T>(url, data, config);
    } catch (error: any) {
      if (error.isOffline && error.offlineRequest) {
        // Queue PUT request for later
        const requestId = await queueRequest(error.offlineRequest);
        console.log(`Request queued with ID: ${requestId}`);
        // Return a mock response
        return {
          data: { success: true, offlineQueued: true, requestId } as any,
          status: 200,
          statusText: 'OK (Offline Queued)',
          headers: {},
          config: error.offlineRequest
        };
      }
      throw error;
    }
  },
  patch: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    try {
      return await apiClient.patch<T>(url, data, config);
    } catch (error: any) {
      if (error.isOffline && error.offlineRequest) {
        // Queue PATCH request for later
        const requestId = await queueRequest(error.offlineRequest);
        console.log(`Request queued with ID: ${requestId}`);
        // Return a mock response
        return {
          data: { success: true, offlineQueued: true, requestId } as any,
          status: 200,
          statusText: 'OK (Offline Queued)',
          headers: {},
          config: error.offlineRequest
        };
      }
      throw error;
    }
  },
  delete: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    try {
      return await apiClient.delete<T>(url, config);
    } catch (error: any) {
      if (error.isOffline && error.offlineRequest) {
        // Queue DELETE request for later
        const requestId = await queueRequest(error.offlineRequest);
        console.log(`Request queued with ID: ${requestId}`);
        // Return a mock response
        return {
          data: { success: true, offlineQueued: true, requestId } as any,
          status: 200,
          statusText: 'OK (Offline Queued)',
          headers: {},
          config: error.offlineRequest
        };
      }
      throw error;
    }
  },
  
  // Utility functions
  refreshAuthToken,
  canMakeRequest,
  queueRequest,
  processRequestQueue,
  setupQueueProcessingOnConnectivity
};