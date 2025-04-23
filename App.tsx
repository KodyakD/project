import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { NetworkProvider } from './src/contexts/NetworkContext';
import Navigation from './src/navigation';
import DeepLinkHandler from './src/components/DeepLinkHandler';
import { StatusBar } from 'expo-status-bar';
import linkingConfig from './src/config/linkingConfig';
import Constants from 'expo-constants';

export default function App() {
  // Log Firebase configuration to debug
  useEffect(() => {
    console.log('Firebase config from Constants:', Constants.expoConfig?.extra);
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <NetworkProvider>
            <StatusBar style="auto" />
            <Navigation linkingConfig={linkingConfig} />
            <DeepLinkHandler />
          </NetworkProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}