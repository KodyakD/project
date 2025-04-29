import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/context/AuthContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import { ToastProvider } from '../src/context/ToastContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View } from 'react-native';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={{ flex: 1 }}>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen 
                    name="(tabs)" 
                    options={{ 
                      headerShown: false,
                      animation: 'slide_from_right'
                    }} 
                  />
                  {/* Add specific routes that should be modals */}
                  <Stack.Screen 
                    name="report/incident"
                    options={{ 
                      presentation: 'modal',
                      animation: 'slide_from_bottom'
                    }} 
                  />
                  <Stack.Screen 
                    name="settings/index"
                    options={{ 
                      animation: 'slide_from_right'
                    }} 
                  />
                </Stack>
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}