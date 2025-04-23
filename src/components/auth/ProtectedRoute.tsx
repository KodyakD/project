import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS } from '../../constants';
import { UserRole } from '../../services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  redirectTo?: string;
}

/**
 * ProtectedRoute component
 * Renders children only if user is authenticated and has the required roles
 * Otherwise redirects to the specified route
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  redirectTo = '/login',
}) => {
  const { authState, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If auth not initialized yet, wait
    if (!authState.initialized) {
      return;
    }

    const checkAuth = async () => {
      // If not authenticated, redirect to login
      if (!authState.isAuthenticated) {
        router.replace(redirectTo);
        return;
      }

      // If roles are required, check them
      if (requiredRoles.length > 0) {
        const hasRequiredRole = await hasRole(requiredRoles);
        if (!hasRequiredRole) {
          // User doesn't have required role, redirect
          router.replace('/unauthorized');
        }
      }
    };

    checkAuth();
  }, [authState.initialized, authState.isAuthenticated, redirectTo, requiredRoles, router, hasRole]);

  // Show loading while authentication is being initialized
  if (!authState.initialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // If authenticated and roles are met, render the children
  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});

export default ProtectedRoute; 