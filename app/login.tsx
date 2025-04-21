// filepath: mobile-app/project/app/login.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '../src/components/ui/Button';
import { TextInput } from '../src/components/ui/TextInput';
import { useAuth } from '../src/context/AuthContext';
import { Colors } from '../src/constants/Colors';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await signIn(email, password);
      // Navigation will be handled by the auth route guard
    } catch (e: any) {
      setError(e.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const navigateToSignUp = () => {
    router.push('/register');
  };

  const navigateToGuestLogin = () => {
    router.push('/guest-login');
  };

  const navigateToForgotPassword = () => {
    router.push('/forgot-password');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/images/logo.png')} 
              style={styles.logo} 
              resizeMode="contain" 
            />
            <Text style={[styles.appName, { color: colors.text }]}>
              Fire Rescue Expert
            </Text>
            <Text style={[styles.tagline, { color: colors.textMuted }]}>
              Safety & emergency management
            </Text>
          </View>

          {error ? (
            <View style={[styles.errorContainer, { backgroundColor: colorScheme === 'dark' ? colors.error + '20' : colors.error + '10' }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Password</Text>
                <TouchableOpacity onPress={navigateToForgotPassword}>
                  <Text style={[styles.forgotPassword, { color: colors.primary }]}>
                    Forgot password?
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.passwordContainer}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry={!isPasswordVisible}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.passwordInput}
                />
                <TouchableOpacity
                  style={styles.visibilityIcon}
                  onPress={handleTogglePasswordVisibility}
                >
                  <Ionicons
                    name={isPasswordVisible ? 'eye-off' : 'eye'}
                    size={24}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <Button 
              onPress={handleLogin} 
              loading={loading}
              fullWidth
              style={styles.loginButton}
            >
              Sign In
            </Button>

            <View style={styles.dividerContainer}>
              <View style={[styles.divider, { backgroundColor: colors.divider }]} />
              <Text style={[styles.dividerText, { color: colors.textMuted }]}>
                OR
              </Text>
              <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            </View>

            <Button
              variant="outline"
              onPress={navigateToGuestLogin}
              fullWidth
              leftIcon={<Ionicons name="qr-code-outline" size={20} color={colors.primary} />}
            >
              Continue as Guest
            </Button>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textMuted }]}>
              Don't have an account?
            </Text>
            <TouchableOpacity onPress={navigateToSignUp}>
              <Text style={[styles.signUpLink, { color: colors.primary }]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotPassword: {
    fontSize: 14,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  visibilityIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  loginButton: {
    marginTop: 12,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
  },
  signUpLink: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
  },
});