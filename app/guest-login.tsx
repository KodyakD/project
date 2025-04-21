import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useColorScheme } from 'react-native';
import Button from '../src/components/ui/Button';
import Colors from '../src/constants/Colors';

export default function GuestLoginScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  
  // Mock login function since we don't have AuthContext fully working yet
  const loginAsGuest = async (code: string) => {
    // In a real app, this would verify the code with your backend
    console.log('Guest login with code:', code);
    return new Promise<void>(resolve => setTimeout(resolve, 1000));
  };

  useEffect(() => {
    let mounted = true;
    
    const requestPermissions = async () => {
      try {
        // Try to dynamically import the barcode scanner to prevent errors
        // when the native module isn't available
        const { BarCodeScanner } = await import('expo-barcode-scanner');
        const { status } = await BarCodeScanner.requestPermissionsAsync();
        if (mounted) {
          setHasPermission(status === 'granted');
        }
      } catch (e) {
        console.log('Could not load barcode scanner:', e);
        if (mounted) {
          setHasPermission(false);
          setError('Barcode scanner is not available on this device.');
        }
      }
    };
    
    requestPermissions();
    
    return () => {
      mounted = false;
    };
  }, []);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    setLoading(true);
    setError('');

    try {
      // Validate QR code format (implement your own validation)
      if (!data.startsWith('FIRERESCUE-GUEST-')) {
        throw new Error('Invalid QR code. Please scan a valid Fire Rescue guest access code.');
      }

      // Process the QR code
      await loginAsGuest(data);
      
      // Success notification
      Alert.alert(
        'Success',
        'Guest access granted. You will have limited access to the app.',
        [{ text: 'OK' }]
      );
      
      // Navigation will be handled by the auth route guard
    } catch (e: any) {
      setError(e.message || 'Failed to authenticate as guest');
    } finally {
      setLoading(false);
    }
  };

  const handleScanAgain = () => {
    setScanned(false);
    setError('');
  };

  const navigateBack = () => {
    router.back();
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.content}>
          <Text style={[styles.message, { color: colors.text }]}>
            Requesting camera permission...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.content}>
          <Text style={[styles.message, { color: colors.text }]}>
            {error || 'Camera permission is required to scan the QR code.'}
          </Text>
          <Button 
            title="Go Back"
            onPress={navigateBack} 
            style={styles.button}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Scan Guest Access QR Code
        </Text>
        <Text style={[styles.subtitle, { color: colors.neutral }]}>
          Position the QR code within the frame to scan
        </Text>
      </View>

      <View style={styles.scannerContainer}>
        {/* 
          Conditionally render the barcode scanner to prevent errors
          when it's not properly initialized
        */}
        {Platform.OS !== 'web' && hasPermission ? (
          <>
            {/* We'll load the BarCodeScanner only when needed to prevent errors */}
            <BarCodeScannerComponent 
              onScan={scanned ? undefined : handleBarCodeScanned}
            />
            <View style={styles.overlay}>
              <View style={styles.scanFrame} />
            </View>
          </>
        ) : (
          <View style={[styles.mockScanner, { backgroundColor: '#333' }]}>
            <Text style={{ color: '#fff', textAlign: 'center' }}>
              QR scanner preview (unavailable in this environment)
            </Text>
          </View>
        )}
      </View>

      {error ? (
        <View style={[styles.errorContainer, { backgroundColor: colorScheme === 'dark' ? colors.danger + '20' : colors.danger + '10' }]}>
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.buttonContainer}>
        {scanned && (
          <Button 
            title="Scan Again"
            onPress={handleScanAgain} 
            loading={loading}
            variant="primary"
            style={styles.button}
          />
        )}
        <Button 
          title="Back to Login"
          onPress={navigateBack} 
          variant="secondary"
          style={styles.backButton}
        />
      </View>
    </SafeAreaView>
  );
}

// Separate component to load the barcode scanner dynamically
function BarCodeScannerComponent({ onScan }: { onScan: any }) {
  // Use React.lazy and Suspense to load the component only when needed
  const [BarCodeScanner, setBarCodeScanner] = useState<any>(null);
  
  useEffect(() => {
    // Dynamically import the barcode scanner
    import('expo-barcode-scanner').then(module => {
      setBarCodeScanner(() => module.BarCodeScanner);
    }).catch(error => {
      console.error('Error loading BarCodeScanner:', error);
    });
  }, []);
  
  if (!BarCodeScanner) {
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#fff' }}>Loading scanner...</Text>
      </View>
    );
  }
  
  return (
    <BarCodeScanner
      onBarCodeScanned={onScan}
      style={StyleSheet.absoluteFill}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  scanner: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    padding: 24,
  },
  button: {
    marginTop: 16,
  },
  backButton: {
    marginTop: 12,
  },
  errorContainer: {
    margin: 24,
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  mockScanner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});