// filepath: mobile-app/project/src/context/AuthContext.tsx
import * as React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

// Define the auth state type
interface AuthState {
  initialized: boolean;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  user: any | null;
}

// Define the auth context type
interface AuthContextType {
  authState: AuthState;
  login: (email: string, password: string) => Promise<void>;
  loginWithQrCode: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

// Create the auth context with default values
const defaultState: AuthState = {
  initialized: false,
  isAuthenticated: false,
  isAnonymous: false,
  user: null,
};

const defaultContext: AuthContextType = {
  authState: defaultState,
  login: async () => {},
  loginWithQrCode: async () => {},
  logout: async () => {},
  error: null,
  clearError: () => {},
};

// Create context
const AuthContext = React.createContext<AuthContextType>(defaultContext);

// Auth Provider component - class-based to avoid hooks issues
export class AuthProvider extends React.Component<{children: React.ReactNode}, {authState: AuthState, error: string | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = {
      authState: defaultState,
      error: null
    };

    // Bind methods
    this.login = this.login.bind(this);
    this.loginWithQrCode = this.loginWithQrCode.bind(this);
    this.logout = this.logout.bind(this);
    this.clearError = this.clearError.bind(this);
  }

  componentDidMount() {
    this.initializeAuth();
  }

  async initializeAuth() {
    try {
      // Check if user data exists in storage
      const userData = await AsyncStorage.getItem('user_data');
      
      if (userData) {
        // User is logged in
        const user = JSON.parse(userData);
        this.setState({
          authState: {
            initialized: true,
            isAuthenticated: true,
            isAnonymous: user.isAnonymous || false,
            user,
          }
        });
      } else {
        // No user logged in
        this.setState({
          authState: {
            initialized: true,
            isAuthenticated: false,
            isAnonymous: false,
            user: null,
          }
        });
      }
    } catch (err) {
      console.error('Error initializing auth:', err);
      this.setState({
        authState: {
          initialized: true,
          isAuthenticated: false,
          isAnonymous: false,
          user: null,
        }
      });
    }
  }

  async login(email: string, password: string) {
    try {
      // For now, just a mock implementation
      if (email && password) {
        const mockUser = {
          id: '123',
          email,
          displayName: email.split('@')[0],
          isAnonymous: false,
        };
        
        // Store user data
        await AsyncStorage.setItem('user_data', JSON.stringify(mockUser));
        
        // Update auth state
        this.setState({
          authState: {
            initialized: true,
            isAuthenticated: true,
            isAnonymous: false,
            user: mockUser,
          },
          error: null
        });
      } else {
        throw new Error('Email and password are required');
      }
    } catch (err: any) {
      this.setState({ error: err.message || 'Login failed' });
      throw err;
    }
  }

  async loginWithQrCode(code: string) {
    try {
      // For now, just a mock implementation
      if (code) {
        const mockUser = {
          id: 'guest-' + Date.now(),
          displayName: 'Guest User',
          isAnonymous: true,
          guestCode: code,
        };
        
        // Store user data
        await AsyncStorage.setItem('user_data', JSON.stringify(mockUser));
        
        // Update auth state
        this.setState({
          authState: {
            initialized: true,
            isAuthenticated: true,
            isAnonymous: true,
            user: mockUser,
          },
          error: null
        });
      } else {
        throw new Error('Invalid QR code');
      }
    } catch (err: any) {
      this.setState({ error: err.message || 'QR code login failed' });
      throw err;
    }
  }

  async logout() {
    try {
      // Clear user data
      await AsyncStorage.removeItem('user_data');
      
      // Update auth state
      this.setState({
        authState: {
          initialized: true,
          isAuthenticated: false,
          isAnonymous: false,
          user: null,
        },
        error: null
      });
    } catch (err: any) {
      this.setState({ error: err.message || 'Logout failed' });
      throw err;
    }
  }

  clearError() {
    this.setState({ error: null });
  }

  render() {
    const contextValue = {
      authState: this.state.authState,
      login: this.login,
      loginWithQrCode: this.loginWithQrCode,
      logout: this.logout,
      error: this.state.error,
      clearError: this.clearError,
    };

    return (
      <AuthContext.Provider value={contextValue}>
        {this.props.children}
      </AuthContext.Provider>
    );
  }
}

// Hook to use the auth context
export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Default export
export default useAuth;