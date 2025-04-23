import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Camera, CameraType, BarCodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, FONTS } from '../../constants';

const QrCodeLoginScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { loginWithQrCode } = useAuth();
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Request camera permission on mount
  useEffect(() => {
    const getCameraPermission = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    
    getCameraPermission();
  }, []);
  
  // Handle QR code scan
  const handleBarCodeScanned = async (scanResult: BarCodeScanningResult) => {
    if (scanned || isProcessing) return;
    
    setScanned(true);
    setIsProcessing(true);
    
    const { data } = scanResult;
    
    try {
      // Check if QR code has the expected format
      if (!data.startsWith('firerescue://guest/')) {
        Alert.alert(
          'Invalid QR Code',
          'This QR code is not a valid guest access code. Please scan a valid Fire Rescue guest QR code.',
          [{ text: 'Try Again', onPress: () => setScanned(false) }]
        );
        setIsProcessing(false);
        return;
      }
      
      // Process QR code login
      await loginWithQrCode(data);
      // Navigation will be handled by the auth state listener in App.tsx
    } catch (error: any) {
      console.error('QR code login error:', error);
      Alert.alert(
        'Login Failed',
        error.message || 'Failed to login with guest QR code. Please try again.',
        [{ text: 'Try Again', onPress: () => setScanned(false) }]
      );
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Navigate back to login screen
  const handleBackToLogin = () => {
    navigation.goBack();
  };
  
  // Reset scanner
  const handleReset = () => {
    setScanned(false);
  };
  
  // Render based on permission state
  if (hasPermission === null) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }
  
  if (hasPermission === false) {
    return (
      <View style={styles.centeredContainer}>
        <Ionicons name="camera-off-outline" size={60} color={COLORS.error} />
        <Text style={styles.permissionText}>Camera access is required to scan QR codes</Text>
        <TouchableOpacity style={styles.actionButton} onPress={handleBackToLogin}>
          <Text style={styles.actionButtonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackToLogin}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Guest Login</Text>
      </View>
      
      {/* Scanner */}
      <View style={styles.cameraContainer}>
        <Camera
          style={styles.camera}
          type={CameraType.back}
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          barCodeScannerSettings={{
            barCodeTypes: ['qr'],
          }}
        >
          <View style={styles.overlay}>
            <View style={styles.scanArea}>
              <View style={styles.cornerTopLeft} />
              <View style={styles.cornerTopRight} />
              <View style={styles.cornerBottomLeft} />
              <View style={styles.cornerBottomRight} />
            </View>
            
            {/* Guide Text */}
            <Text style={styles.scanText}>Scan Guest QR Code</Text>
            
            {/* Processing Indicator */}
            {isProcessing && (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color={COLORS.white} />
                <Text style={styles.processingText}>Processing...</Text>
              </View>
            )}
          </View>
        </Camera>
      </View>
      
      {/* Bottom Area */}
      <View style={styles.bottomContainer}>
        <Text style={styles.instructionText}>
          Scan a guest QR code provided by your host or at the facility entrance
        </Text>
        
        {scanned && !isProcessing && (
          <TouchableOpacity style={styles.scanAgainButton} onPress={handleReset}>
            <Ionicons name="scan-outline" size={20} color={COLORS.white} />
            <Text style={styles.scanAgainButtonText}>Scan Again</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.loginButton} onPress={handleBackToLogin}>
          <Text style={styles.loginButtonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 20,
  },
  permissionText: {
    ...FONTS.body3,
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  actionButtonText: {
    ...FONTS.body3,
    color: COLORS.white,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    ...FONTS.h4,
    color: COLORS.white,
    marginLeft: 16,
  },
  cameraContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderRadius: 24,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: COLORS.white,
    borderTopLeftRadius: 12,
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: COLORS.white,
    borderTopRightRadius: 12,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: COLORS.white,
    borderBottomLeftRadius: 12,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: COLORS.white,
    borderBottomRightRadius: 12,
  },
  scanText: {
    ...FONTS.body3,
    color: COLORS.white,
    marginTop: 30,
    fontWeight: '600',
  },
  processingContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  processingText: {
    ...FONTS.body3,
    color: COLORS.white,
    marginTop: 16,
  },
  bottomContainer: {
    backgroundColor: COLORS.white,
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  instructionText: {
    ...FONTS.body3,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  scanAgainButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    height: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  scanAgainButtonText: {
    ...FONTS.body3,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: 8,
  },
  loginButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    ...FONTS.body3,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default QrCodeLoginScreen; 