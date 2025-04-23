import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, FONTS, SIZES } from '../../constants';
import authService from '../../services/authService';
import { AppError } from '../../utils/errors';
import { validateEmail } from '../../utils/validators';
import { Colors, Typography, Spacing } from '../../styles';
import { SocialButton } from '../../components/UI/SocialButton';
import { QRCodeScanner } from '../../components/UI/QRCodeScanner';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { login, loginWithUniversitySso, authState } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({
    email: '',
    password: '',
  });
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [universities, setUniversities] = useState([
    'Harvard University',
    'MIT',
    'Stanford University',
    'Cambridge University',
    'Oxford University'
  ]);

  // Reset form errors when inputs change
  useEffect(() => {
    setFormErrors({
      email: '',
      password: '',
    });
  }, [email, password]);
  
  useEffect(() => {
    // Check if user is already logged in
    const checkAuthStatus = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          // Navigate to main app
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainApp' as never }],
          });
        }
      } catch (error) {
        console.log('Not logged in');
      }
    };

    checkAuthStatus();
  }, [navigation]);
  
  // Handle email/password login
  const handleLogin = async () => {
    setError(null);
    
    // Validate form
    let isValid = true;
    const errors = { email: '', password: '' };
    
    if (!email) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }
    
    if (!password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
      isValid = false;
    }
    
    if (!isValid) {
      setFormErrors(errors);
      return;
    }
    
    // Submit form
    setIsSubmitting(true);
    
    try {
      await authService.signInWithEmailAndPassword(email, password);
      
      // Navigate to main app on successful login
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainApp' as never }],
      });
    } catch (error: any) {
      setError(error.message || 'Failed to sign in');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle university SSO login
  const handleSsoLogin = async (university: string) => {
    try {
      setLoading(true);
      await authService.signInWithSSO(university);
    } catch (error: any) {
      setError(error.message || 'Failed to sign in with SSO');
      setLoading(false);
    }
  };
  
  // Navigate to forgot password screen
  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    setLoading(true);
    
    try {
      await authService.resetPassword(email);
      Alert.alert(
        'Password Reset',
        'If an account with this email exists, a password reset link has been sent.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      setError(error.message || 'Failed to request password reset');
    } finally {
      setLoading(false);
    }
  };
  
  // Navigate to register screen
  const handleRegister = () => {
    navigation.navigate('Register');
  };
  
  // Navigate to guest login (QR scanner)
  const handleGuestLogin = () => {
    setShowQRScanner(true);
  };

  // Handle QR code scanning for guest access
  const handleQRCodeScanned = async (qrCode: string) => {
    try {
      await authService.loginAsGuest(qrCode);
      setShowQRScanner(false);
      navigation.replace('Main');
    } catch (error) {
      console.error('QR login error:', error);
      Alert.alert('Guest Login Failed', 'Invalid QR code or error during login. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollView}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Technical Expert</Text>
            <Text style={styles.subtitle}>Login to your account</Text>
          </View>
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <MaterialIcons name="email" size={24} color={Colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
                autoCorrect={false}
                placeholderTextColor={Colors.grayMedium}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={24} color={Colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={Colors.grayMedium}
              />
              <TouchableOpacity
                style={styles.passwordVisibilityButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <MaterialIcons
                  name={showPassword ? 'visibility-off' : 'visibility'}
                  size={24}
                  color={Colors.grayDark}
                />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>
            
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>
            
            <Text style={styles.ssoTitle}>University SSO Login</Text>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.ssoContainer}
              contentContainerStyle={styles.ssoContentContainer}
            >
              {universities.map((university, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.ssoButton}
                  onPress={() => handleSsoLogin(university)}
                >
                  <Text style={styles.ssoButtonText}>{university}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity
              style={styles.qrLoginButton}
              onPress={handleGuestLogin}
            >
              <MaterialIcons name="qr-code-scanner" size={24} color={Colors.primary} />
              <Text style={styles.qrLoginText}>Scan QR for Guest Access</Text>
            </TouchableOpacity>
            
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={handleRegister}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    padding: Spacing.large,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.extraLarge,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: Spacing.medium,
  },
  title: {
    ...Typography.heading1,
    color: Colors.primary,
    marginBottom: Spacing.small,
  },
  subtitle: {
    ...Typography.subtitle,
    color: Colors.textSecondary,
  },
  errorContainer: {
    backgroundColor: Colors.errorLight,
    borderRadius: 8,
    padding: Spacing.medium,
    marginBottom: Spacing.medium,
  },
  errorText: {
    color: Colors.error,
    ...Typography.bodySmall,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.grayLight,
    borderRadius: 8,
    marginBottom: Spacing.medium,
    backgroundColor: Colors.white,
  },
  inputIcon: {
    padding: Spacing.medium,
  },
  input: {
    flex: 1,
    height: 50,
    ...Typography.body,
    color: Colors.textPrimary,
  },
  passwordVisibilityButton: {
    padding: Spacing.medium,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.large,
  },
  forgotPasswordText: {
    ...Typography.bodySmall,
    color: Colors.primary,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.large,
  },
  disabledButton: {
    backgroundColor: Colors.grayMedium,
  },
  loginButtonText: {
    color: Colors.white,
    ...Typography.buttonText,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.large,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.grayLight,
  },
  dividerText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginHorizontal: Spacing.medium,
  },
  ssoTitle: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
    marginBottom: Spacing.medium,
    textAlign: 'center',
  },
  ssoContainer: {
    maxHeight: 50,
    marginBottom: Spacing.large,
  },
  ssoContentContainer: {
    paddingRight: Spacing.medium,
  },
  ssoButton: {
    backgroundColor: Colors.secondaryLight,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    borderRadius: 8,
    marginRight: Spacing.small,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  ssoButtonText: {
    ...Typography.bodySmall,
    color: Colors.secondary,
  },
  qrLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.medium,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    marginBottom: Spacing.large,
  },
  qrLoginText: {
    ...Typography.body,
    color: Colors.primary,
    marginLeft: Spacing.small,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  signupLink: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: 'bold',
  },
});

export default LoginScreen; 