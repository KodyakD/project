// filepath: mobile-app/project/src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define user types
type UserRole = 'admin' | 'user' | 'guest';

interface User {
  id: string;
  email?: string;
  role: UserRole;
  name?: string;
}

// Auth context interface
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginAsGuest: (guestCode: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

// Storage key for persisting user data
const USER_STORAGE_KEY = '@fire_rescue_user';

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  error: null,
  login: async () => {},
  loginAsGuest: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
});

// Auth Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load stored user on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error('Failed to load user from storage', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock authentication - in a real app this would call your auth API
      if (email === 'admin@example.com' && password === 'password') {
        const userData: User = {
          id: '1',
          email,
          name: 'Admin User',
          role: 'admin',
        };
        
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
        setUser(userData);
      } else if (email === 'user@example.com' && password === 'password') {
        const userData: User = {
          id: '2',
          email,
          name: 'Regular User',
          role: 'user',
        };
        
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
        setUser(userData);
      } else {
        throw new Error('Invalid email or password');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Guest login function
  const loginAsGuest = async (guestCode: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!guestCode.startsWith('FIRERESCUE-GUEST-')) {
        throw new Error('Invalid guest code format');
      }
      
      const userData: User = {
        id: `guest-${Date.now()}`,
        role: 'guest',
      };
      
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
    } catch (err: any) {
      setError(err.message || 'Guest login failed');
      console.error('Guest login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Password reset function
  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Basic validation
      if (!email.includes('@')) {
        throw new Error('Invalid email address');
      }
      
      // In a real app, this would trigger a password reset email
      console.log('Password reset requested for:', email);
    } catch (err: any) {
      setError(err.message || 'Password reset failed');
      console.error('Password reset error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Provide auth context to children
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        loginAsGuest,
        logout,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;