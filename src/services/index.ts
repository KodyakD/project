// Export all services from this index file for easier imports
import authService from './authService';
import tokenService from './tokenService';
import StorageService from './storageService';
import { fcmService } from './fcmService';

// Re-export services
export {
  authService,
  tokenService,
  StorageService,
  fcmService
};

// Default export for named imports
export default {
  auth: authService,
  token: tokenService,
  storage: StorageService,
  fcm: fcmService
};