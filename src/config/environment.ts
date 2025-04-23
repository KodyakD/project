import Constants from 'expo-constants';

/**
 * Environment configuration for the application
 * Environments: development, staging, production
 */

type Environment = 'development' | 'staging' | 'production';

interface EnvironmentConfig {
  apiUrl: string;
  firebaseConfig: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
  };
  ssoConfig: {
    clientId: string;
    redirectUri: string;
    discoveryUrl: string;
  };
  mapsConfig: {
    baseUrl: string;
    apiKey?: string;
  };
}

// Get the environment from app.json extra or default to development
const getEnvironment = (): Environment => {
  try {
    // Try to get environment from Constants.expoConfig?.extra
    const env = Constants.expoConfig?.extra?.environment as Environment;
    if (env) return env;
    
    // Fallback to process.env if available
    if (process.env.APP_ENV) {
      return process.env.APP_ENV as Environment;
    }
    
    // Default to development
    return 'development';
  } catch (error) {
    console.warn('Error getting environment:', error);
    return 'development';
  }
};

// Firebase configuration - hardcoded to avoid API key issues
const firebaseConfig = {
  apiKey: 'AIzaSyAqJkaSAV04ljQWsZ-Q7J5mU-O0KysAcgs',
  authDomain: 'fire-rescue-expert-app.firebaseapp.com',
  projectId: 'fire-rescue-expert-app',
  storageBucket: 'fire-rescue-expert-app.firebasestorage.app',
  messagingSenderId: '381153036555',
  appId: '1:381153036555:web:79873a9a3f56e32201ba0e',
};

// Configuration for different environments
const configs: Record<Environment, EnvironmentConfig> = {
  development: {
    apiUrl: 'https://dev-api.firerescueapp.com',
    firebaseConfig,
    ssoConfig: {
      clientId: process.env.EXPO_PUBLIC_SSO_CLIENT_ID || '',
      redirectUri: 'com.firerescueapp:/auth/callback',
      discoveryUrl: process.env.EXPO_PUBLIC_SSO_DISCOVERY_URL || '',
    },
    mapsConfig: {
      baseUrl: 'https://dev-maps.firerescueapp.com',
    }
  },
  staging: {
    apiUrl: 'https://staging-api.firerescueapp.com',
    firebaseConfig,
    ssoConfig: {
      clientId: process.env.EXPO_PUBLIC_SSO_CLIENT_ID || '',
      redirectUri: 'com.firerescueapp:/auth/callback',
      discoveryUrl: process.env.EXPO_PUBLIC_SSO_DISCOVERY_URL || '',
    },
    mapsConfig: {
      baseUrl: 'https://staging-maps.firerescueapp.com',
    }
  },
  production: {
    apiUrl: 'https://api.firerescueapp.com',
    firebaseConfig,
    ssoConfig: {
      clientId: process.env.EXPO_PUBLIC_SSO_CLIENT_ID || '',
      redirectUri: 'com.firerescueapp:/auth/callback',
      discoveryUrl: process.env.EXPO_PUBLIC_SSO_DISCOVERY_URL || '',
    },
    mapsConfig: {
      baseUrl: 'https://maps.firerescueapp.com',
      apiKey: process.env.EXPO_PUBLIC_MAPS_API_KEY || '',
    }
  }
};

// Export current environment configuration
const currentEnvironment = getEnvironment();
console.log('Current environment:', currentEnvironment);
console.log('Firebase config:', configs[currentEnvironment].firebaseConfig);

export const config = configs[currentEnvironment];
export const environmentName = currentEnvironment;
export const isDevelopment = currentEnvironment === 'development';
export const isStaging = currentEnvironment === 'staging';
export const isProduction = currentEnvironment === 'production';