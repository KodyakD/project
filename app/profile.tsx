import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuthContext } from '../src/context/AuthContext';
import { tokenService } from '../src/services';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, isAuthenticated, tokenExpiryTime, refreshToken, logout } = useAuthContext();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tokenExpiry, setTokenExpiry] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Fetch token data on mount
  useEffect(() => {
    updateTokenData();
  }, []);

  // Update token information
  const updateTokenData = async () => {
    try {
      setLoading(true);
      
      // Get current access token
      const token = await tokenService.getAccessToken();
      setAccessToken(token ? `${token.substring(0, 20)}...` : 'No token found');
      
      // Get token expiry time
      const expiry = await tokenService.getTokenExpiryTime();
      setTokenExpiry(expiry);
    } catch (error) {
      console.error('Error fetching token data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle manual token refresh
  const handleRefreshToken = async () => {
    try {
      setLoading(true);
      await refreshToken();
      await updateTokenData();
    } catch (error) {
      console.error('Error refreshing token:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
      router.replace('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'User Profile',
          headerStyle: { backgroundColor: '#007AFF' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16 }}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Information</Text>
          
          {isAuthenticated ? (
            <>
              <InfoItem label="User ID" value={user?.uid || 'Unknown'} />
              <InfoItem label="Email" value={user?.email || 'No email'} />
              <InfoItem label="Display Name" value={user?.displayName || 'No name'} />
              <InfoItem label="Role" value={user?.role || 'No role'} />
              <InfoItem label="Email Verified" value={user?.isEmailVerified ? 'Yes' : 'No'} />
            </>
          ) : (
            <Text style={styles.emptyText}>Not authenticated</Text>
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Token Information</Text>
          <InfoItem label="Access Token" value={accessToken || 'No token'} />
          <InfoItem label="Token Expiry" value={tokenExpiry} />
          <InfoItem label="Is Authenticated" value={isAuthenticated ? 'Yes' : 'No'} />
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.refreshButton]} 
            onPress={handleRefreshToken}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Refresh Token</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.logoutButton]} 
            onPress={handleLogout}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Information item component
interface InfoItemProps {
  label: string;
  value: string;
}

const InfoItem: React.FC<InfoItemProps> = ({ label, value }) => (
  <View style={styles.infoItem}>
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  infoItem: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ececec',
  },
  infoLabel: {
    flex: 1,
    fontWeight: '600',
    color: '#555',
  },
  infoValue: {
    flex: 2,
    color: '#333',
  },
  emptyText: {
    fontStyle: 'italic',
    color: '#999',
    textAlign: 'center',
    paddingVertical: 16,
  },
  buttonContainer: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 