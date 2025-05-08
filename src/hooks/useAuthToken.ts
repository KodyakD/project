import { useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import { useAuth } from '../context/AuthContext';

/**
 * Hook to get and manage auth tokens for API requests
 * Handles automatic token refresh when needed
 */
export const useAuthToken = () => {
  const { authState, refreshToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get initial token on mount
  useEffect(() => {
    const initializeToken = async () => {
      try {
        const currentToken = await authService.getAccessToken();
        setToken(currentToken);
      } catch (err) {
        console.error('Error initializing token:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize token');
      } finally {
        setLoading(false);
      }
    };

    if (authState.isAuthenticated) {
      initializeToken();
    } else {
      setToken(null);
      setLoading(false);
    }
  }, [authState.isAuthenticated]);

  /**
   * Get a valid auth token for API requests
   * Refreshes token if necessary
   */
  const getValidToken = useCallback(async (): Promise<string | null> => {
    try {
      // If we don't have a token and user is not authenticated, return null
      if (!authState.isAuthenticated) {
        return null;
      }
      
      // If we already have a token, return it
      if (token) {
        return token;
      }
      
      // Try to refresh the token
      const refreshedToken = await refreshToken();
      setToken(refreshedToken);
      return refreshedToken;
    } catch (err) {
      console.error('Error getting valid token:', err);
      setError(err instanceof Error ? err.message : 'Failed to get valid token');
      return null;
    }
  }, [token, authState.isAuthenticated, refreshToken]);

  /**
   * Force token refresh
   */
  const forceRefresh = useCallback(async (): Promise<string | null> => {
    try {
      setLoading(true);
      const refreshedToken = await refreshToken();
      setToken(refreshedToken);
      setLoading(false);
      return refreshedToken;
    } catch (err) {
      setLoading(false);
      console.error('Error refreshing token:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh token');
      return null;
    }
  }, [refreshToken]);

  /**
   * Clear the token
   */
  const clearToken = useCallback(() => {
    setToken(null);
  }, []);

  return {
    token,
    loading,
    error,
    getValidToken,
    forceRefresh,
    clearToken,
  };
}; 