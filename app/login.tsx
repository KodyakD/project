// filepath: mobile-app/project/app/login.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  useColorScheme,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';

// Import auth hook
import { useAuth } from '../src/context/AuthContext';
import { COLORS, FONTS, SIZES } from '../src/constants'; 
import Colors from '../src/constants/Colors';

// Register web browser for SSO redirects (important for OAuth flows)
WebBrowser.maybeCompleteAuthSession();

// SSO configuration for university login
const SSO_CONFIG = {
  clientId: process.env.EXPO_PUBLIC_SSO_CLIENT_ID || 'your-client-id',
  discoveryUrl: process.env.EXPO_PUBLIC_SSO_DISCOVERY_URL || 'https://university-sso.example.com/.well-known/openid-configuration',
  scopes: ['openid', 'profile', 'email'],
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SIZES.padding,
    paddingTop: SIZES.padding,
    paddingBottom: SIZES.padding * 2,
  },
  header: {
    alignItems: 'center',
    marginTop: SIZES.padding,
    marginBottom: SIZES.padding * 1.5,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: SIZES.margin / 2,
  },
  appName: {
    ...FONTS.h2,
    marginBottom: SIZES.margin / 4,
  },
  tagline: {
    ...FONTS.body3,
    fontWeight: FONTS.body3.fontWeight as "normal" | "bold" | "400" | "500",
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: SIZES.margin * 1.5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    ...FONTS.body3,
    fontWeight: '500',
  },
  formContainer: {
    width: '100%',
  },
  label: {
    ...FONTS.body3,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: SIZES.inputHeight,
    borderWidth: 1,
    borderRadius: SIZES.radius,
    paddingHorizontal: 12,
    marginBottom: SIZES.margin,
    ...FONTS.body2,
  },
  rememberForgotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.margin * 1.5,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rememberMeText: {
    ...FONTS.body3,
    fontWeight: FONTS.body3.fontWeight as "normal" | "bold" | "400" | "500",
  },
  forgotPasswordText: {
    ...FONTS.body3,
    fontWeight: '500',
  },
  loginButton: {
    height: SIZES.buttonHeight,
    borderRadius: SIZES.radius,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.margin * 1.5,
  },
  loginButtonText: {
    color: '#FFFFFF',
    ...FONTS.button,
    fontWeight: FONTS.button.fontWeight as "normal" | "bold" | "400" | "500",
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  registerText: {
    ...FONTS.body3,
    fontWeight: FONTS.body3.fontWeight as "normal" | "bold" | "400" | "500",
  },
  registerLink: {
    ...FONTS.body3,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  errorText: {
    ...FONTS.body3,
    fontWeight: FONTS.body3.fontWeight as "normal" | "bold" | "400" | "500",
    marginLeft: 8,
    flex: 1,
  },
  // QR code scanner styles
  qrContainer: {
    alignItems: 'center',
  },
  scannerContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: SIZES.margin * 1.5,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerTarget: {
    width: 200,
    height: 200,
    borderWidth: 2,
  },
  qrInstructions: {
    ...FONTS.body3,
    fontWeight: FONTS.body3.fontWeight as "normal" | "bold" | "400" | "500",
    textAlign: 'center',
    marginBottom: SIZES.margin * 1.5,
    paddingHorizontal: SIZES.padding,
  },
  rescanButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: SIZES.radius,
  },
  rescanButtonText: {
    ...FONTS.buttonSmall,
    fontWeight: FONTS.buttonSmall.fontWeight as "normal" | "bold" | "400" | "500",
    color: '#FFFFFF',
  },
  cameraText: {
    ...FONTS.body2,
    fontWeight: FONTS.body2.fontWeight as "normal" | "bold" | "400" | "500",
    marginTop: SIZES.margin,
    marginBottom: SIZES.margin / 2,
    textAlign: 'center',
  },
  cameraSubtext: {
    ...FONTS.body3,
    fontWeight: FONTS.body3.fontWeight as "normal" | "bold" | "400" | "500",
    textAlign: 'center',
  },
  // SSO styles
  ssoContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  universityLogo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  ssoText: {
    ...FONTS.body2,
    fontWeight: '500',
    marginBottom: SIZES.margin / 2,
  },
  ssoSubtext: {
    ...FONTS.body3,
    fontWeight: FONTS.body3.fontWeight as "normal" | "bold" | "400" | "500",
    textAlign: 'center',
    marginBottom: SIZES.margin * 1.5,
  },
  ssoButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: SIZES.radius,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    flexDirection: 'row',
  },
  ssoButtonText: {
    color: '#FFFFFF',
    ...FONTS.button,
    fontWeight: FONTS.button.fontWeight as "normal" | "bold" | "400" | "500",
  },
});

export default function LoginScreen() {
  // Get auth functions and state from our AuthContext
  const { login, loginWithQrCode, isAuthenticated, signInWithGoogle, error, clearError } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'qr' | 'sso'>('email');
  
  // QR scanning state
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  
  // Success state for redirecting after login
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Check if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, router]);

  // Request QR code scanner permissions when QR mode is selected
  useEffect(() => {
    if (loginMethod === 'qr') {
      (async () => {
        const { status } = await BarCodeScanner.requestPermissionsAsync();
        setHasPermission(status === 'granted');
        
        if (status !== 'granted') {
          Alert.alert(
            'Camera Permission Required',
            'We need camera permission to scan QR codes for guest login.',
            [{ text: 'OK', onPress: () => setLoginMethod('email') }]
          );
        }
      })();
    }
  }, [loginMethod]);

  // Handle login redirect after successful login
  useEffect(() => {
    if (loginSuccess) {
      // Short delay to allow auth state to update
      const redirectTimer = setTimeout(() => {
        router.replace('/(tabs)');
      }, 500);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [loginSuccess, router]);

  // Handle email/password login
  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('Login Failed', 'Please enter both email and password');
      return;
    }

    try {
      setIsSubmitting(true);
      if (clearError) clearError();
      
      await login(email, password);
      setLoginSuccess(true);
    } catch (err) {
      console.error('Login error:', err);
      // No need to handle error here as it's already captured in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle university SSO login - using React Native Firebase credentials
  const handleSsoLogin = async () => {
    try {
      setIsSubmitting(true);
      if (clearError) clearError();
      
      // Use Google Sign-In (or other provider) as university sign-in
      await signInWithGoogle();
      setLoginSuccess(true);
    } catch (err) {
      console.error('SSO login error:', err);
      Alert.alert(
        'SSO Login Failed', 
        err instanceof Error ? err.message : 'Failed to login with university SSO'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle QR code scan for guest login
  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    
    try {
      setIsSubmitting(true);
      if (clearError) clearError();
      
      // Check if QR code has valid format for our system
      // The React Native Firebase SDK version expects format: "GUEST:institution:timestamp:token"
      if (!data.startsWith('GUEST:')) {
        Alert.alert('Invalid QR Code', 'This QR code is not valid for guest login');
        return;
      }
      
      await loginWithQrCode(data);
      setLoginSuccess(true);
    } catch (err) {
      console.error('QR login error:', err);
      Alert.alert(
        'Login Failed', 
        err instanceof Error ? err.message : 'Failed to login with QR code'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render login method content based on selected method
  const renderLoginContent = () => {
    switch (loginMethod) {
      case 'email':
        return (
          <View style={styles.formContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Email</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.card, 
                color: colors.text, 
                borderColor: colors.border 
              }]}
              placeholder="Enter your email"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isSubmitting}
              returnKeyType="next"
            />
            
            <Text style={[styles.label, { color: colors.text }]}>Password</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.card, 
                color: colors.text, 
                borderColor: colors.border 
              }]}
              placeholder="Enter your password"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isSubmitting}
              returnKeyType="done"
              onSubmitEditing={handleEmailLogin}
            />
            
            <View style={styles.rememberForgotRow}>
              <TouchableOpacity
                style={styles.rememberMeContainer}
                onPress={() => setRememberMe(!rememberMe)}
                disabled={isSubmitting}
              >
                <View style={[
                  styles.checkbox,
                  { borderColor: colors.primary },
                  rememberMe && { backgroundColor: colors.primary }
                ]}>
                  {rememberMe && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                </View>
                <Text style={[styles.rememberMeText, { color: colors.text }]}>Remember me</Text>
              </TouchableOpacity>
              
              <Link href="/forgot-password" asChild>
                <TouchableOpacity disabled={isSubmitting}>
                  <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
            
            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: colors.primary }]}
              onPress={handleEmailLogin}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>
            
            <View style={styles.registerContainer}>
              <Text style={[styles.registerText, { color: colors.textSecondary }]}>
                Don't have an account?
              </Text>
              <Link href="/register" asChild>
                <TouchableOpacity disabled={isSubmitting}>
                  <Text style={[styles.registerLink, { color: colors.primary }]}>
                    Register
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        );
        
      case 'qr':
        if (hasPermission === null) {
          return (
            <View style={styles.cameraContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.cameraText, { color: colors.text }]}>
                Requesting camera permission...
              </Text>
            </View>
          );
        }
        
        if (hasPermission === false) {
          return (
            <View style={styles.cameraContainer}>
              <Ionicons name="camera-off" size={64} color={colors.error} />
              <Text style={[styles.cameraText, { color: colors.error }]}>
                Camera permission denied
              </Text>
              <Text style={[styles.cameraSubtext, { color: colors.textSecondary }]}>
                Please enable camera access in your device settings to scan QR codes.
              </Text>
            </View>
          );
        }
        
        return (
          <View style={styles.qrContainer}>
            <View style={styles.scannerContainer}>
              <BarCodeScanner
                onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                style={StyleSheet.absoluteFillObject}
                barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}
              />
              <View style={styles.scannerOverlay}>
                <View style={styles.scannerTarget} />
              </View>
            </View>
            
            <Text style={[styles.qrInstructions, { color: colors.text }]}>
              Scan the QR code provided by your institution for guest access
            </Text>
            
            {scanned && (
              <TouchableOpacity
                style={[styles.rescanButton, { backgroundColor: colors.primary }]}
                onPress={() => setScanned(false)}
              >
                <Text style={styles.rescanButtonText}>Scan Again</Text>
              </TouchableOpacity>
            )}
          </View>
        );
        
      case 'sso':
        return (
          <View style={styles.ssoContainer}>
            <Image
              source={require('../assets/images/university-logo.png')}
              style={styles.universityLogo}
              resizeMode="contain"
            />
            
            <Text style={[styles.ssoText, { color: colors.text }]}>
              Log in with your university credentials
            </Text>
            
            <Text style={[styles.ssoSubtext, { color: colors.textSecondary }]}>
              You will be redirected to your university's login page
            </Text>
            
            <TouchableOpacity
              style={[styles.ssoButton, { backgroundColor: colors.primary }]}
              onPress={handleSsoLogin}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="school" size={20} color="#FFFFFF" />
                  <Text style={styles.ssoButtonText}>Login with University SSO</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        );
        
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Image 
              source={require('../assets/images/logo.png')} 
              style={styles.logo} 
              resizeMode="contain" 
            />
            <Text style={[styles.appName, { color: colors.text }]}>Fire Rescue</Text>
            <Text style={[styles.tagline, { color: colors.textSecondary }]}>
              Emergency Response & Safety Management
            </Text>
          </View>

          {/* Login method tabs */}
          <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.tab,
                loginMethod === 'email' && [styles.activeTab, { borderBottomColor: colors.primary }]
              ]}
              onPress={() => setLoginMethod('email')}
              disabled={isSubmitting}
            >
              <Ionicons
                name="mail"
                size={20}
                color={loginMethod === 'email' ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: loginMethod === 'email' ? colors.primary : colors.textSecondary }
                ]}
              >
                Email
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.tab,
                loginMethod === 'sso' && [styles.activeTab, { borderBottomColor: colors.primary }]
              ]}
              onPress={() => setLoginMethod('sso')}
              disabled={isSubmitting}
            >
              <Ionicons
                name="school"
                size={20}
                color={loginMethod === 'sso' ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: loginMethod === 'sso' ? colors.primary : colors.textSecondary }
                ]}
              >
                University
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.tab,
                loginMethod === 'qr' && [styles.activeTab, { borderBottomColor: colors.primary }]
              ]}
              onPress={() => setLoginMethod('qr')}
              disabled={isSubmitting}
            >
              <Ionicons
                name="qr-code"
                size={20}
                color={loginMethod === 'qr' ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: loginMethod === 'qr' ? colors.primary : colors.textSecondary }
                ]}
              >
                Guest
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Display any auth errors */}
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: `${colors.error}20` }]}>
              <Ionicons name="alert-circle" size={20} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          )}
          
          {/* Login content based on selected method */}
          {renderLoginContent()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

