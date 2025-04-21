
import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { PermissionProvider } from '../src/context/PermissionContext';
import * as SplashScreen from 'expo-splash-screen';

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync();

// Root Layout with providers
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      // Hide splash screen once fonts are loaded
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PermissionProvider>
          <RootLayoutNav />
        </PermissionProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

// Auth protection and navigation management
function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  
  useEffect(() => {
    if (isLoading) return;
    
    const inAuthGroup = segments[0] === '(auth)';
    
    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated
      // We'll disable this for now during development
      // router.replace('/login');
    } else if (user && inAuthGroup) {
      // Redirect to home if already authenticated
      // We'll disable this for now during development
      // router.replace('/(tabs)');
    }
  }, [user, isLoading, segments]);

  return <Slot />;
}