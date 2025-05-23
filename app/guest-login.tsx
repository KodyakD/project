import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useColorScheme } from 'react-native';
import Button from '../src/components/ui/Button';
import Colors from '../src/constants/Colors';
import { Camera, CameraType } from 'expo-camera';

export default function GuestLoginScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [scannerAvailable, setScannerAvailable] = useState(true);
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
    
    const checkScannerAvailability = async () => {
      try {
        // Check if we're running on web (where camera access is restricted)
        if (Platform.OS === 'web') {
          if (mounted) {
            setScannerAvailable(false);
            setError('QR code scanning is not available on web.');
          }
          return;
        }
        
        // Check camera permissions instead of barcode scanner
        const { status } = await Camera.requestCameraPermissionsAsync();
        if (mounted) {
          setScannerAvailable(true);
          setHasPermission(status === 'granted');
        }
      } catch (e) {
        console.log('Error checking camera:', e);
        if (mounted) {
          setScannerAvailable(false);
          setError('Camera is not available on this device.');
        }
      }
    };
    
    checkScannerAvailability();
    
    return () => {
      mounted = false;
    };
  }, []);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    setLoading(true);
    setError('');

    try {
      // Validate QR code format
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

  const handleManualCodeSubmit = async () => {
    if (!manualCode) {
      setError('Please enter a valid access code');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Similar validation as your QR code logic
      if (!manualCode.startsWith('FIRERESCUE-GUEST-')) {
        throw new Error('Invalid access code format');
      }
      
      await loginAsGuest(manualCode);
      
      Alert.alert(
        'Success',
        'Guest access granted. You will have limited access to the app.',
        [{ text: 'OK' }]
      );
    } catch (e: any) {
      setError(e.message || 'Failed to authenticate as guest');
    } finally {
      setLoading(false);
    }
  };

  const navigateBack = () => {
    router.back();
  };

  // If scanner is not available, only show manual entry
  if (!scannerAvailable) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Guest Access
          </Text>
          <Text style={[styles.subtitle, { color: colors.neutral }]}>
            Enter your guest access code below
          </Text>
        </View>
        
        {error ? (
          <View style={[styles.errorContainer, { backgroundColor: colorScheme === 'dark' ? colors.danger + '20' : colors.danger + '10' }]}>
            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          </View>
        ) : null}
        
        <View style={styles.manualEntryContainer}>
          <Text style={[styles.manualEntryLabel, { color: colors.text }]}>
            Enter access code
          </Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.codeInput,
                {
                  color: colors.text,
                  backgroundColor: colorScheme === 'dark' ? '#333' : '#f0f0f0',
                  borderColor: error ? colors.danger : colors.border
                }
              ]}
              value={manualCode}
              onChangeText={setManualCode}
              placeholder="FIRERESCUE-GUEST-XXXXX"
              placeholderTextColor={colors.textSecondary}
            />
            <Button
              title="Submit"
              onPress={handleManualCodeSubmit}
              variant="primary"
              loading={loading}
              style={styles.submitButton}
            />
          </View>
        </View>
        
        <View style={styles.buttonContainer}>
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
          Conditionally render the camera to prevent errors
          when it's not properly initialized
        */}
        {Platform.OS !== 'web' && hasPermission ? (
          <>
            {/* We'll load the Camera only when needed to prevent errors */}
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
              Camera preview (unavailable in this environment)
            </Text>
          </View>
        )}
      </View>

      {error ? (
        <View style={[styles.errorContainer, { backgroundColor: colorScheme === 'dark' ? colors.danger + '20' : colors.danger + '10' }]}>
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={[styles.dividerText, { color: colors.textSecondary }]}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.manualEntryContainer}>
        <Text style={[styles.manualEntryLabel, { color: colors.text }]}>
          Enter access code manually
        </Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[
              styles.codeInput,
              {
                color: colors.text,
                backgroundColor: colorScheme === 'dark' ? '#333' : '#f0f0f0',
                borderColor: error ? colors.danger : colors.border
              }
            ]}
            value={manualCode}
            onChangeText={setManualCode}
            placeholder="FIRERESCUE-GUEST-XXXXX"
            placeholderTextColor={colors.textSecondary}
          />
          <Button
            title="Submit"
            onPress={handleManualCodeSubmit}
            variant="primary"
            loading={loading}
            style={styles.submitButton}
          />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        {scanned && (
          <Button 
            title="Scan Again"
            onPress={() => setScanned(false)} 
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

// Separate component to load the camera instead of barcode scanner
function BarCodeScannerComponent({ onScan }: { onScan: any }) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    let mounted = true;
    
    const setupCamera = async () => {
      try {
        const { status } = await Camera.requestCameraPermissionsAsync();
        if (mounted) {
          setHasPermission(status === 'granted');
        }
      } catch (err) {
        console.error('Error setting up camera:', err);
        if (mounted) {
          setError('Could not access camera');
        }
      }
    };
    
    setupCamera();
    
    return () => {
      mounted = false;
    };
  }, []);
  
  if (error) {
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#fff' }}>Camera error: {error}</Text>
      </View>
    );
  }
  
  if (hasPermission === null) {
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#fff' }}>Requesting camera permission...</Text>
      </View>
    );
  }
  
  if (hasPermission === false) {
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#fff' }}>No access to camera</Text>
      </View>
    );
  }
  
  return (
    <Camera
      onBarCodeScanned={onScan}
      style={StyleSheet.absoluteFill}
      type={CameraType.back}
      barCodeScannerSettings={{
        barCodeTypes: ['qr'],
      }}
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
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
  },
  manualEntryContainer: {
    padding: 24,
    paddingTop: 0,
  },
  manualEntryLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  submitButton: {
    height: 44,
  },
});