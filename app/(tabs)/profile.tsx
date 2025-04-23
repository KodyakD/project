import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Bell, ChevronRight, LogOut, Moon, Settings, Shield, User as UserIcon, Globe, Accessibility } from '@expo/vector-icons/Feather';
import Colors from '../../src/constants/Colors';
import Card from '../../src/components/ui/Card';
import { Loading } from '../../src/components/ui/Loading';
import { ErrorDisplay } from '../../src/components/ui/ErrorDisplay';

// Mock user data
const USER = {
  id: '1',
  name: 'Alex Johnson',
  email: 'alex.johnson@example.com',
  role: 'Fire Safety Officer',
  department: 'Campus Safety',
  image: 'https://randomuser.me/api/portraits/men/32.jpg',
};

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState(USER);
  const [darkModeEnabled, setDarkModeEnabled] = useState(isDarkMode);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  useEffect(() => {
    // Simulate loading user data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    // Handle logout logic here
    alert('Logout functionality would go here');
  };

  if (loading) {
    return <Loading fullScreen message="Loading profile..." />;
  }

  if (error) {
    return <ErrorDisplay fullScreen message={error} onRetry={() => setError(null)} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with user info */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
        </View>
        
        {/* User Card */}
        <Card style={styles.userCard}>
          <View style={styles.userInfo}>
            <Image 
              source={{ uri: user.image }} 
              style={styles.userImage} 
            />
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
              <Text style={[styles.userRole, { color: colors.textSecondary }]}>{user.role}</Text>
              <Text style={[styles.userDepartment, { color: colors.textMuted }]}>{user.department}</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.editButton, { borderColor: colors.primary }]} 
            onPress={() => router.push('/profile/edit')}
          >
            <Text style={[styles.editButtonText, { color: colors.primary }]}>Edit Profile</Text>
          </TouchableOpacity>
        </Card>
        
        {/* Settings Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Settings</Text>
        </View>
        
        <Card style={styles.settingsCard}>
          {/* Appearance */}
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Moon size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingMain}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Dark Mode</Text>
                <Switch
                  value={darkModeEnabled}
                  onValueChange={setDarkModeEnabled}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Switch between light and dark themes
              </Text>
            </View>
          </View>
          
          {/* Notifications */}
          <View style={[styles.settingItem, styles.settingItemBorder]}>
            <View style={styles.settingIconContainer}>
              <Bell size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingMain}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Notifications</Text>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Enable push notifications
              </Text>
            </View>
          </View>
          
          {/* Notification Settings */}
          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => router.push('/profile/notification-settings')}
          >
            <View style={styles.settingIconContainer}>
              <Settings size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingMain}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Notification Settings</Text>
                <ChevronRight size={18} color={colors.textSecondary} />
              </View>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Configure which notifications you receive
              </Text>
            </View>
          </TouchableOpacity>

          {/* Language */}
          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => router.push('/settings')}
          >
            <View style={styles.settingIconContainer}>
              <Settings size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingMain}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>All Settings</Text>
                <ChevronRight size={18} color={colors.textSecondary} />
              </View>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                View all app settings
              </Text>
            </View>
          </TouchableOpacity>

          {/* Accessibility */}
          <TouchableOpacity 
            style={[styles.settingItem, styles.settingItemBorder]} 
            onPress={() => router.push('/settings/accessibility')}
          >
            <View style={styles.settingIconContainer}>
              <Accessibility size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingMain}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Accessibility</Text>
                <ChevronRight size={18} color={colors.textSecondary} />
              </View>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Configure text size, contrast and more
              </Text>
            </View>
          </TouchableOpacity>
        </Card>
        
        {/* Account Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
        </View>
        
        <Card style={styles.settingsCard}>
          {/* Account Settings */}
          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => router.push('/profile/account-settings')}
          >
            <View style={styles.settingIconContainer}>
              <UserIcon size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingMain}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Account Settings</Text>
                <ChevronRight size={18} color={colors.textSecondary} />
              </View>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Manage your account details
              </Text>
            </View>
          </TouchableOpacity>
          
          {/* Privacy & Security */}
          <TouchableOpacity 
            style={[styles.settingItem, styles.settingItemBorder]} 
            onPress={() => router.push('/profile/privacy-security')}
          >
            <View style={styles.settingIconContainer}>
              <Shield size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingMain}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Privacy & Security</Text>
                <ChevronRight size={18} color={colors.textSecondary} />
              </View>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Manage your privacy settings
              </Text>
            </View>
          </TouchableOpacity>
        </Card>
        
        {/* Logout Button */}
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: colors.errorLight }]} 
          onPress={handleLogout}
        >
          <LogOut size={18} color={colors.error} style={styles.logoutIcon} />
          <Text style={[styles.logoutText, { color: colors.error }]}>Log Out</Text>
        </TouchableOpacity>
        
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.textMuted }]}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  userCard: {
    marginBottom: 24,
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    marginBottom: 2,
  },
  userDepartment: {
    fontSize: 14,
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  settingsCard: {
    marginBottom: 24,
  },
  settingItem: {
    flexDirection: 'row',
    padding: 16,
  },
  settingItemBorder: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingDescription: {
    fontSize: 14,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  versionContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  versionText: {
    fontSize: 12,
  },
});