const fs = require('fs');
const path = require('path');

module.exports = ({ config }) => {
  // Load environment variables
  const env = process.env.APP_ENV || 'development';
  const envPath = path.resolve(__dirname, `.env.${env}`);
  
  const envConfig = {};
  if (fs.existsSync(envPath)) {
    try {
      // Read the file as a string
      const envFile = fs.readFileSync(envPath, 'utf8');
      
      // Process each line, filtering out comments and empty lines
      envFile.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, value] = trimmedLine.split('=');
          if (key && value) {
            envConfig[key.trim()] = value.trim();
          }
        }
      });
      
      console.log('Loaded environment variables:', Object.keys(envConfig));
    } catch (error) {
      console.error('Error loading environment variables:', error);
    }
  } else {
    console.log(`Environment file not found: ${envPath}`);
  }
  
  return {
    ...config,
    name: "Fire Rescue Expert",
    slug: "fire-rescue-expert",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#e53e3e"
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.firerescue.expertapp",
      infoPlist: {
        NSCameraUsageDescription: "This app uses the camera to scan barcodes for guest login and to capture images for incident reports.",
        NSLocationWhenInUseUsageDescription: "This app uses your location to show your position on emergency maps and to geo-tag incident reports.",
        NSPhotoLibraryUsageDescription: "This app accesses your photo library to upload images for incident documentation."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#e53e3e"
      },
      package: "com.firerescue.expertapp",
      permissions: [
        "CAMERA",
        "ACCESS_FINE_LOCATION",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      ...envConfig,
      eas: {
        projectId: process.env.EAS_PROJECT_ID || "your-project-id",
      },
      // Workaround for "Cannot find native module" errors in Expo Go
      skipNativeModulesInExpoGo: true
    },
    // Simplified plugins section in app.config.js
    plugins: [
      "expo-router",
      "expo-barcode-scanner",
      "expo-location",
      "expo-media-library",
      "expo-image-picker",
      "expo-device"
    ],
    experiments: {
      // Enable these if needed for newer features
      tsconfigPaths: true,
      typedRoutes: true
    }
  };
};