const fs = require('fs');
const path = require('path');

module.exports = ({ config }) => {
  // Default to development environment
  const env = process.env.APP_ENV || 'development';
  const envPath = path.resolve(__dirname, `.env.${env}`);
  
  // Load environment variables manually instead of requiring the file
  const envConfig = {};
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      // Skip comments and empty lines
      if (line.trim() && !line.startsWith('//')) {
        const [key, value] = line.split('=');
        if (key && value) {
          envConfig[key.trim()] = value.trim();
        }
      }
    });
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
      bundleIdentifier: "com.yourcompany.firerescueexpert"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#e53e3e"
      },
      package: "com.yourcompany.firerescueexpert"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      firebaseApiKey: envConfig.FIREBASE_API_KEY,
      firebaseAuthDomain: envConfig.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: envConfig.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: envConfig.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: envConfig.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: envConfig.FIREBASE_APP_ID,
      eas: {
        projectId: process.env.EAS_PROJECT_ID,
      },
    },
    plugins: [
      "expo-router",
      [
        "expo-build-properties",
        {
          android: {
            usesCleartextTraffic: true,
          },
        },
      ],
    ],
  };
};