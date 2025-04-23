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
import * as Yup from 'yup';

import { useAuth } from '../src/contexts/AuthContext';
import { COLORS, FONTS, SIZES } from '../src/constants';
import Colors from '../src/constants/Colors';
import { USER_ROLES } from '../src/constants/roles';

// Validation schema
const registrationSchema = Yup.object().shape({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
  role: Yup.string().oneOf(
    [USER_ROLES.FIRE_FIGHTER, USER_ROLES.TECHNICIAN, USER_ROLES.SUPERVISOR],
    'Please select a valid role'
  ).required('Role is required'),
});

const RegisterScreen = () => {
  const { register, error, clearError } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: USER_ROLES.FIRE_FIGHTER,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  // Handle input changes
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear field error when user starts typing again
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  // Validate a single field
  const validateField = async (field: string) => {
    try {
      await registrationSchema.validateAt(field, formData);
      setFormErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
      return true;
    } catch (error) {
      if (error instanceof Yup.ValidationError) {
        setFormErrors((prev) => ({
          ...prev,
          [field]: error.message,
        }));
        return false;
      }
      return true;
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      clearError();

      // Validate all fields
      await registrationSchema.validate(formData, { abortEarly: false });

      // Register user
      await register(
        formData.email,
        formData.password,
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
        }
      );

      // Navigate to success page
      router.replace('/registration-success');
    } catch (error) {
      if (error instanceof Yup.ValidationError) {
        // Handle validation errors
        const errors: Record<string, string> = {};
        error.inner.forEach((err) => {
          if (err.path) {
            errors[err.path] = err.message;
          }
        });
        setFormErrors(errors);
      } else {
        // Error is already handled by auth context
        console.error('Registration error:', error);
      }
    } finally {
      setIsSubmitting(false);
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
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
              disabled={isSubmitting}
            >
              <Ionicons 
                name="arrow-back" 
                size={24} 
                color={colors.text}
              />
            </TouchableOpacity>
            
              <Image 
                source={require('../assets/images/logo.png')} 
                style={styles.logo} 
                resizeMode="contain" 
              />
            
            <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Join the Fire Rescue team by registering below
              </Text>
            </View>

          {/* Display any auth errors */}
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: `${colors.error}20` }]}>
              <Ionicons name="alert-circle" size={20} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              </View>
          )}
          
          <View style={styles.formContainer}>
            {/* First Name & Last Name Row */}
            <View style={styles.nameRow}>
              <View style={styles.nameField}>
                <Text style={[styles.label, { color: colors.text }]}>First Name</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.card, color: colors.text, borderColor: formErrors.firstName ? colors.error : colors.border },
                  ]}
                  placeholder="First Name"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.firstName}
                  onChangeText={(text) => handleChange('firstName', text)}
                  onBlur={() => validateField('firstName')}
                  editable={!isSubmitting}
                />
                {formErrors.firstName && (
                  <Text style={[styles.fieldError, { color: colors.error }]}>
                    {formErrors.firstName}
                  </Text>
                )}
              </View>

              <View style={styles.nameField}>
                <Text style={[styles.label, { color: colors.text }]}>Last Name</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.card, color: colors.text, borderColor: formErrors.lastName ? colors.error : colors.border },
                  ]}
                  placeholder="Last Name"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.lastName}
                  onChangeText={(text) => handleChange('lastName', text)}
                  onBlur={() => validateField('lastName')}
                  editable={!isSubmitting}
                />
                {formErrors.lastName && (
                  <Text style={[styles.fieldError, { color: colors.error }]}>
                    {formErrors.lastName}
                  </Text>
                )}
              </View>
            </View>
            
            {/* Email */}
            <Text style={[styles.label, { color: colors.text }]}>Email</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.card, color: colors.text, borderColor: formErrors.email ? colors.error : colors.border },
              ]}
              placeholder="Enter your email"
              placeholderTextColor={colors.textSecondary}
              value={formData.email}
              onChangeText={(text) => handleChange('email', text)}
              onBlur={() => validateField('email')}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isSubmitting}
            />
            {formErrors.email && (
              <Text style={[styles.fieldError, { color: colors.error }]}>
                {formErrors.email}
              </Text>
            )}
            
            {/* Password */}
            <Text style={[styles.label, { color: colors.text }]}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.card, color: colors.text, borderColor: formErrors.password ? colors.error : colors.border },
                ]}
                    placeholder="Create a password"
                placeholderTextColor={colors.textSecondary}
                value={formData.password}
                onChangeText={(text) => handleChange('password', text)}
                onBlur={() => validateField('password')}
                secureTextEntry={!showPassword}
                    autoCapitalize="none"
                editable={!isSubmitting}
                  />
                  <TouchableOpacity
                    style={styles.visibilityIcon}
                onPress={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
                  >
                    <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                      size={24}
                  color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
            {formErrors.password && (
              <Text style={[styles.fieldError, { color: colors.error }]}>
                {formErrors.password}
              </Text>
            )}
            
            {/* Confirm Password */}
            <Text style={[styles.label, { color: colors.text }]}>Confirm Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.card, color: colors.text, borderColor: formErrors.confirmPassword ? colors.error : colors.border },
                ]}
                    placeholder="Confirm your password"
                placeholderTextColor={colors.textSecondary}
                value={formData.confirmPassword}
                onChangeText={(text) => handleChange('confirmPassword', text)}
                onBlur={() => validateField('confirmPassword')}
                secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                editable={!isSubmitting}
                  />
                  <TouchableOpacity
                    style={styles.visibilityIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isSubmitting}
                  >
                    <Ionicons
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                      size={24}
                  color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
            {formErrors.confirmPassword && (
              <Text style={[styles.fieldError, { color: colors.error }]}>
                {formErrors.confirmPassword}
              </Text>
            )}
            
            {/* Role Selection */}
            <Text style={[styles.label, { color: colors.text }]}>Select Your Role</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  formData.role === USER_ROLES.FIRE_FIGHTER && styles.selectedRole,
                  { 
                    backgroundColor: formData.role === USER_ROLES.FIRE_FIGHTER ? `${colors.primary}20` : colors.card,
                    borderColor: formData.role === USER_ROLES.FIRE_FIGHTER ? colors.primary : colors.border 
                  }
                ]}
                onPress={() => handleChange('role', USER_ROLES.FIRE_FIGHTER)}
                disabled={isSubmitting}
              >
                <Ionicons 
                  name="flame" 
                  size={24} 
                  color={formData.role === USER_ROLES.FIRE_FIGHTER ? colors.primary : colors.textSecondary} 
                />
                <Text style={[
                  styles.roleText,
                  { color: formData.role === USER_ROLES.FIRE_FIGHTER ? colors.primary : colors.text }
                ]}>
                  Fire Fighter
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  formData.role === USER_ROLES.TECHNICIAN && styles.selectedRole,
                  { 
                    backgroundColor: formData.role === USER_ROLES.TECHNICIAN ? `${colors.primary}20` : colors.card,
                    borderColor: formData.role === USER_ROLES.TECHNICIAN ? colors.primary : colors.border 
                  }
                ]}
                onPress={() => handleChange('role', USER_ROLES.TECHNICIAN)}
                disabled={isSubmitting}
              >
                <Ionicons 
                  name="build" 
                  size={24} 
                  color={formData.role === USER_ROLES.TECHNICIAN ? colors.primary : colors.textSecondary} 
                />
                <Text style={[
                  styles.roleText,
                  { color: formData.role === USER_ROLES.TECHNICIAN ? colors.primary : colors.text }
                ]}>
                  Technician
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  formData.role === USER_ROLES.SUPERVISOR && styles.selectedRole,
                  { 
                    backgroundColor: formData.role === USER_ROLES.SUPERVISOR ? `${colors.primary}20` : colors.card,
                    borderColor: formData.role === USER_ROLES.SUPERVISOR ? colors.primary : colors.border 
                  }
                ]}
                onPress={() => handleChange('role', USER_ROLES.SUPERVISOR)}
                disabled={isSubmitting}
              >
                <Ionicons 
                  name="shield" 
                  size={24} 
                  color={formData.role === USER_ROLES.SUPERVISOR ? colors.primary : colors.textSecondary} 
                />
                <Text style={[
                  styles.roleText,
                  { color: formData.role === USER_ROLES.SUPERVISOR ? colors.primary : colors.text }
                ]}>
                  Supervisor
                </Text>
              </TouchableOpacity>
            </View>
            {formErrors.role && (
              <Text style={[styles.fieldError, { color: colors.error }]}>
                {formErrors.role}
              </Text>
            )}
            
            {/* Terms and Conditions */}
            <View style={styles.termsContainer}>
              <Text style={[styles.termsText, { color: colors.textSecondary }]}>
                By registering, you agree to our{' '}
                <Text 
                  style={[styles.termsLink, { color: colors.primary }]}
                  onPress={() => router.push('/terms')}
                >
                  Terms & Conditions
                </Text>
                {' '}and{' '}
                <Text 
                  style={[styles.termsLink, { color: colors.primary }]}
                  onPress={() => router.push('/privacy')}
                >
                  Privacy Policy
                </Text>
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.registerButton, { backgroundColor: colors.primary }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>
            
            <View style={styles.loginContainer}>
              <Text style={[styles.loginText, { color: colors.textSecondary }]}>
                Already have an account?
              </Text>
              <Link href="/login" asChild>
                <TouchableOpacity disabled={isSubmitting}>
                <Text style={[styles.loginLink, { color: colors.primary }]}>
                    Log In
                </Text>
              </TouchableOpacity>
              </Link>
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
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SIZES.padding,
    paddingTop: SIZES.padding,
    paddingBottom: SIZES.padding * 2,
  },
  header: {
    alignItems: 'center',
    marginTop: SIZES.padding / 2,
    marginBottom: SIZES.padding,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
    zIndex: 1,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: SIZES.margin / 2,
  },
  title: {
    ...FONTS.h2,
    marginBottom: SIZES.margin / 4,
  },
  subtitle: {
    ...FONTS.body3,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nameField: {
    width: '48%',
  },
  label: {
    ...FONTS.body3,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    height: SIZES.inputHeight,
    borderWidth: 1,
    borderRadius: SIZES.radius,
    paddingHorizontal: 12,
    ...FONTS.body2,
  },
  fieldError: {
    ...FONTS.caption,
    marginTop: 4,
  },
  passwordContainer: {
    position: 'relative',
  },
  visibilityIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  roleOption: {
    width: '32%',
    padding: 12,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  selectedRole: {
    borderWidth: 2,
  },
  roleText: {
    ...FONTS.body3,
    fontWeight: '500',
    textAlign: 'center',
  },
  termsContainer: {
    marginTop: SIZES.margin * 1.5,
    marginBottom: SIZES.margin,
  },
  termsText: {
    ...FONTS.caption,
    textAlign: 'center',
  },
  termsLink: {
    fontWeight: '500',
  },
  registerButton: {
    height: SIZES.buttonHeight,
    borderRadius: SIZES.radius,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.margin * 1.5,
  },
  registerButtonText: {
    color: '#FFFFFF',
    ...FONTS.button,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  loginText: {
    ...FONTS.body3,
  },
  loginLink: {
    ...FONTS.body3,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.margin,
  },
  errorText: {
    ...FONTS.body3,
    marginLeft: 8,
    flex: 1,
  },
});

export default RegisterScreen;