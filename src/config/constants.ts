/**
 * Application-wide constants
 */

// API configuration
export const API_URL = 'https://api.fire-rescue-expert.com';

// Environment configuration
export const IS_DEV = __DEV__;
export const APP_VERSION = '1.0.0';

// Network timeouts
export const API_TIMEOUT = 30000; // 30 seconds
export const NETWORK_RETRY_COUNT = 3;

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'auth_user_data',
  FCM_TOKEN: 'fcm_token',
  THEME: 'app_theme',
  LANGUAGE: 'app_language',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  LAST_NOTIFICATION_CHECK: 'last_notification_check',
};

// Notifications
export const NOTIFICATION_TYPES = {
  EMERGENCY: 'emergency',
  INCIDENT_ASSIGNED: 'incident_assigned',
  INCIDENT_UPDATED: 'incident_updated',
  INCIDENT_RESOLVED: 'incident_resolved',
  SYSTEM_ANNOUNCEMENT: 'system_announcement',
  MAINTENANCE_ALERT: 'maintenance_alert',
  USER_MENTION: 'user_mention',
};

// Date formats
export const DATE_FORMATS = {
  DISPLAY_DATE: 'MMM DD, YYYY',
  DISPLAY_TIME: 'h:mm A',
  DISPLAY_DATETIME: 'MMM DD, YYYY h:mm A',
  ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
};

// Map-related constants
export const MAP_CONSTANTS = {
  DEFAULT_ZOOM: 1.0,
  MIN_ZOOM: 0.5,
  MAX_ZOOM: 3.0,
};

// Media constants
export const MEDIA_CONSTANTS = {
  MAX_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB
  ACCEPTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
  ACCEPTED_VIDEO_TYPES: ['video/mp4', 'video/quicktime'],
  MAX_VIDEO_DURATION: 60, // 60 seconds
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

// Deep linking
export const DEEP_LINK_PREFIX = 'firerescueexpert://';