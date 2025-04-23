import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Bell, Info, Settings } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  showNotificationsButton?: boolean;
  showInfoButton?: boolean;
  showSettingsButton?: boolean;
  showThemeToggle?: boolean;
  onBackPress?: () => void;
  onNotificationsPress?: () => void;
  onInfoPress?: () => void;
  onSettingsPress?: () => void;
  rightContent?: React.ReactNode;
}

export default function Header({
  title,
  showBackButton = false,
  showNotificationsButton = false,
  showInfoButton = false,
  showSettingsButton = false,
  showThemeToggle = false,
  onBackPress,
  onNotificationsPress,
  onInfoPress,
  onSettingsPress,
  rightContent,
}: HeaderProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const handleNotificationsPress = () => {
    if (onNotificationsPress) {
      onNotificationsPress();
    } else {
      router.push('/notifications');
    }
  };

  const handleInfoPress = () => {
    if (onInfoPress) {
      onInfoPress();
    } else {
      router.push('/info');
    }
  };

  const handleSettingsPress = () => {
    if (onSettingsPress) {
      onSettingsPress();
    } else {
      router.push('/settings');
    }
  };

  return (
    <>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.background}
      />
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top > 0 ? insets.top : 20,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.content}>
          <View style={styles.leftContent}>
            {showBackButton && (
              <TouchableOpacity 
                style={styles.iconButton} 
                onPress={handleBackPress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <ChevronLeft size={24} color={colors.text} />
              </TouchableOpacity>
            )}
          </View>

          <Text 
            style={[
              styles.title, 
              { color: colors.text }
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>

          <View style={styles.rightContent}>
            {showNotificationsButton && (
              <TouchableOpacity 
                style={styles.iconButton} 
                onPress={handleNotificationsPress}
              >
                <Bell size={22} color={colors.text} />
              </TouchableOpacity>
            )}

            {showInfoButton && (
              <TouchableOpacity 
                style={styles.iconButton} 
                onPress={handleInfoPress}
              >
                <Info size={22} color={colors.text} />
              </TouchableOpacity>
            )}

            {showSettingsButton && (
              <TouchableOpacity 
                style={styles.iconButton} 
                onPress={handleSettingsPress}
              >
                <Settings size={22} color={colors.text} />
              </TouchableOpacity>
            )}

            {showThemeToggle && (
              <ThemeToggle />
            )}

            {rightContent}
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderBottomWidth: 1,
    paddingBottom: 12,
    elevation: 0,
    zIndex: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 40,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 40,
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
}); 