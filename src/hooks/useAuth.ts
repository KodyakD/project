import { useState, useEffect } from 'react';
import { UserData, UserRole } from '../services/authService';
import authService from '../services/authService';

export const useAuth = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tokenExpiryTime, setTokenExpiryTime] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize authentication state
  useEffect(() => {
    const initAuth = async () => {
      try {
        setIsLoading(true);
        // Get current user data
        const userData = await authService.getCurrentUser();
        setUser(userData);
        setIsAuthenticated(!!userData);
        setIsAnonymous(userData?.isAnonymous || false);
        
        // Get token expiry time if authenticated
        if (userData) {
          const expiry = await authService.getTokenExpiryTime();
          setTokenExpiryTime(expiry);
        }
        
        setInitialized(true);
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Set up auth state listener
    const removeListener = authService.addAuthStateListener((state) => {
      setUser(state.user);
      setIsAuthenticated(state.isAuthenticated);
      setIsAnonymous(state.isAnonymous);
      setInitialized(state.initialized);
    });
    
    initAuth();
    
    // Cleanup listener on unmount
    return () => {
      removeListener();
    };
  }, []);

  // Login with email and password
  const login = async (email: string, password: string): Promise<UserData> => {
    try {
      setIsLoading(true);
      setError(null);
      const userData = await authService.signInWithEmailAndPassword(email, password);
      setUser(userData);
      setIsAuthenticated(true);
      setIsAnonymous(userData.isAnonymous || false);
      return userData;
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Register new user
  const register = async (email: string, password: string, displayName: string, role?: UserRole): Promise<UserData> => {
    try {
      setIsLoading(true);
      setError(null);
      const userData = await authService.register(email, password, displayName, role);
      setUser(userData);
      setIsAuthenticated(true);
      setIsAnonymous(false);
      return userData;
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.signOut();
      setUser(null);
      setIsAuthenticated(false);
      setIsAnonymous(false);
    } catch (err: any) {
      setError(err.message || 'Logout failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Login with Google
  const loginWithGoogle = async (): Promise<UserData> => {
    try {
      setIsLoading(true);
      setError(null);
      const userData = await authService.signInWithGoogle();
      setUser(userData);
      setIsAuthenticated(true);
      setIsAnonymous(false);
      return userData;
    } catch (err: any) {
      setError(err.message || 'Google login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Login with QR code
  const loginWithQrCode = async (qrData: string): Promise<UserData> => {
    try {
      setIsLoading(true);
      setError(null);
      const userData = await authService.loginWithQRCode(qrData);
      setUser(userData);
      setIsAuthenticated(true);
      setIsAnonymous(userData.isAnonymous || false);
      return userData;
    } catch (err: any) {
      setError(err.message || 'QR login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.sendPasswordResetEmail(email);
    } catch (err: any) {
      setError(err.message || 'Password reset failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm password reset
  const confirmPasswordReset = async (code: string, newPassword: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.confirmPasswordReset(code, newPassword);
    } catch (err: any) {
      setError(err.message || 'Password reset confirmation failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh token
  const refreshToken = async (): Promise<string | null> => {
    try {
      setError(null);
      return await authService.refreshToken();
    } catch (err: any) {
      setError(err.message || 'Token refresh failed');
      throw err;
    }
  };

  // Check if user has a role
  const hasRole = async (roles: UserRole | UserRole[]): Promise<boolean> => {
    try {
      return await authService.hasRole(roles);
    } catch (err) {
      return false;
    }
  };

  // Update token expiry time
  const updateTokenExpiryTime = async (): Promise<void> => {
    try {
      const expiry = await authService.getTokenExpiryTime();
      setTokenExpiryTime(expiry);
    } catch (err) {
      console.error('Failed to update token expiry time:', err);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  return {
    user,
    initialized,
    isAnonymous,
    isAuthenticated,
    tokenExpiryTime,
    isLoading,
    error,
    login,
    register,
    logout,
    loginWithGoogle,
    loginWithQrCode, // Now properly implemented
    resetPassword,
    confirmPasswordReset,
    refreshToken,
    hasRole,
    updateTokenExpiryTime,
    clearError
  };
};