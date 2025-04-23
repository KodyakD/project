import { AxiosError } from 'axios';
import { Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

// Error types for the application
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  OFFLINE = 'OFFLINE',
  UNKNOWN = 'UNKNOWN',
  TIMEOUT = 'TIMEOUT',
  MEDIA = 'MEDIA',
}
/**
 * Utility function to standardize API error handling
 * This is the basic version that was replaced by the more comprehensive version below
 */
// Removed duplicate function
// Custom error class for application
export class AppError extends Error {
  public type: ErrorType;
  public statusCode?: number;
  public isOffline: boolean;
  public originalError?: any;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    statusCode?: number,
    isOffline: boolean = false,
    originalError?: any
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.statusCode = statusCode;
    this.isOffline = isOffline;
    this.originalError = originalError;
  }
}

/**
 * Check if the device is connected to the internet
 */
export const isConnected = async (): Promise<boolean> => {
  const netInfo = await NetInfo.fetch();
  return !!netInfo.isConnected;
};

/**
 * Handle API errors from Axios and convert to AppError
 */
export const handleApiError = (error: any): AppError => {
  console.log('Handling API error:', error);

  // Check for offline state first
  if (error?.message?.includes('Network Error') || error?.isOffline) {
    return new AppError(
      'You appear to be offline. Please check your internet connection.',
      ErrorType.OFFLINE,
      undefined,
      true,
      error
    );
  }

  // If it's an Axios error
  if (error?.isAxiosError) {
    const axiosError = error as AxiosError;
    const statusCode = axiosError.response?.status;

    // Handle various HTTP status codes
    switch (statusCode) {
      case 400:
        return new AppError(
          getErrorMessage(axiosError) || 'Invalid request data',
          ErrorType.VALIDATION,
          statusCode,
          false,
          axiosError
        );

      case 401:
        return new AppError(
          'Your session has expired. Please sign in again.',
          ErrorType.AUTHENTICATION,
          statusCode,
          false,
          axiosError
        );

      case 403:
        return new AppError(
          'You do not have permission to perform this action.',
          ErrorType.AUTHORIZATION,
          statusCode,
          false,
          axiosError
        );

      case 404:
        return new AppError(
          'The requested resource was not found.',
          ErrorType.NOT_FOUND,
          statusCode,
          false,
          axiosError
        );

      case 408:
        return new AppError(
          'The request timed out. Please try again.',
          ErrorType.TIMEOUT,
          statusCode,
          false,
          axiosError
        );

      case 500:
      case 502:
      case 503:
      case 504:
        return new AppError(
          'A server error occurred. Please try again later.',
          ErrorType.SERVER,
          statusCode,
          false,
          axiosError
        );

      default:
        // For any other status code
        return new AppError(
          getErrorMessage(axiosError) || 'An unexpected error occurred',
          ErrorType.UNKNOWN,
          statusCode,
          false,
          axiosError
        );
    }
  }

  // Handle media-specific errors
  if (error?.message?.includes('media') || error?.message?.includes('image') || error?.message?.includes('video')) {
    return new AppError(
      error.message || 'There was a problem with the media file',
      ErrorType.MEDIA,
      undefined,
      false,
      error
    );
  }

  // For any other type of error
  return new AppError(
    error?.message || 'An unexpected error occurred',
    ErrorType.UNKNOWN,
    undefined,
    false,
    error
  );
};

/**
 * Extract error message from Axios error response
 */
const getErrorMessage = (error: AxiosError): string => {
  // Try to get error message from response data
  const responseData = error.response?.data as any;
  
  if (responseData) {
    if (typeof responseData === 'string') {
      return responseData;
    }
    
    if (responseData.message) {
      return responseData.message;
    }
    
    if (responseData.error) {
      return typeof responseData.error === 'string' 
        ? responseData.error 
        : responseData.error.message || JSON.stringify(responseData.error);
    }
  }
  
  // Fallback to standard error message
  return error.message || 'An unexpected error occurred';
};

/**
 * Show an error alert to the user
 */
export const showErrorAlert = (
  error: AppError | Error | string,
  title: string = 'Error'
): void => {
  let message: string;
  
  if (typeof error === 'string') {
    message = error;
  } else if (error instanceof AppError) {
    // For AppError, use the message and maybe add some type-specific handling
    message = error.message;
    
    // Customize title based on error type
    if (error.type === ErrorType.NETWORK || error.type === ErrorType.OFFLINE) {
      title = 'Connection Error';
    } else if (error.type === ErrorType.AUTHENTICATION) {
      title = 'Authentication Error';
    } else if (error.type === ErrorType.SERVER) {
      title = 'Server Error';
    }
  } else {
    // For standard Error objects
    message = error.message || 'An unexpected error occurred';
  }
  
  Alert.alert(title, message);
};

/**
 * Log error to console and potentially to a remote service
 */
export const logError = (
  error: any,
  context: string = 'unknown',
  userId?: string
): void => {
  console.error(`[${context}] Error:`, error);
  
  // Here you could implement integration with a remote logging service
  // For example, Firebase Crashlytics or other error tracking services
  
  // TODO: Implement remote error logging when needed
};

/**
 * Handle form validation errors
 */
export const handleValidationError = (errors: Record<string, string>): string => {
  const errorMessages = Object.values(errors).filter(Boolean);
  return errorMessages.length > 0 ? errorMessages.join(', ') : 'Please check your input and try again';
};

/**
 * Retry a function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 1000,
  factor: number = 2
): Promise<T> => {
  let attempt = 0;
  let delay = initialDelayMs;
  
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      
      // If we've used all retries, throw the error
      if (attempt >= maxRetries) {
        throw error;
      }
      
      // Check if we should retry based on error type
      const appError = handleApiError(error);
      
      // Don't retry for certain error types
      if (
        appError.type === ErrorType.AUTHENTICATION ||
        appError.type === ErrorType.AUTHORIZATION ||
        appError.type === ErrorType.VALIDATION
      ) {
        throw appError;
      }
      
      // For network errors, check if we're online before retrying
      if (appError.type === ErrorType.NETWORK || appError.type === ErrorType.OFFLINE) {
        const online = await isConnected();
        if (!online) {
          throw appError;
        }
      }
      
    console.log(`Retrying operation, attempt ${attempt} of ${maxRetries}...`);
    
    // Wait with exponential backoff
    await new Promise(resolve => setTimeout(resolve, delay));
    delay *= factor;
  }
}

// This should never happen due to the throw in the loop
  throw new AppError('Maximum retry attempts reached');
};