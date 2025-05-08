import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import Colors from '../../constants/Colors';
import { useToast } from '../../context/ToastContext';

// Replace lucide imports with Expo Vector Icons
import { Feather } from '@expo/vector-icons';

// Safety status types
export type SafetyStatusLevel = 'normal' | 'advisory' | 'warning' | 'critical' | 'emergency';

interface SafetyStatus {
  level: SafetyStatusLevel;
  title: string;
  message: string;
  updatedAt: Date;
  actionUrl?: string;
}

interface SafetyStatusIndicatorProps {
  onPress?: () => void;
}

export default function SafetyStatusIndicator({ onPress }: SafetyStatusIndicatorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const toast = useToast();
  
  // In a real app, this would come from a Firebase subscription
  // For now, we'll simulate it with static data
  const [status, setStatus] = useState<SafetyStatus>({
    level: 'normal',
    title: 'All Systems Normal',
    message: 'No safety concerns or active incidents on campus.',
    updatedAt: new Date(),
  });

  // Replace getStatusIcon function
  const getStatusIcon = (level: SafetyStatusLevel) => {
    const size = 24;
    
    switch (level) {
      case 'normal':
        return <Feather name="check-circle" size={size} color={colors.success} />;
      case 'advisory':
        return <Feather name="info" size={size} color={colors.info} />;
      case 'warning':
        return <Feather name="alert-triangle" size={size} color={colors.warning} />;
      case 'critical':
        return <Feather name="alert-circle" size={size} color={colors.error} />;
      case 'emergency':
        return <Feather name="x-circle" size={size} color={colors.error} />;
      default:
        return <Feather name="check-circle" size={size} color={colors.success} />;
    }
  };

  // Get background color based on status level
  const getBackgroundColor = (level: SafetyStatusLevel) => {
    switch (level) {
      case 'normal':
        return colors.success + '15'; // 15% opacity
      case 'advisory':
        return colors.info + '15';
      case 'warning':
        return colors.warning + '15';
      case 'critical':
        return colors.error + '15';
      case 'emergency':
        return colors.error + '15';
      default:
        return colors.success + '15';
    }
  };

  // Get border color based on status level
  const getBorderColor = (level: SafetyStatusLevel) => {
    switch (level) {
      case 'normal':
        return colors.success;
      case 'advisory':
        return colors.info;
      case 'warning':
        return colors.warning;
      case 'critical':
        return colors.error;
      case 'emergency':
        return colors.error;
      default:
        return colors.success;
    }
  };

  // Format the updated time
  const formatUpdatedTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    
    const hours = Math.floor(diffMins / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  // Handle press on the status indicator
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (status.actionUrl) {
      router.push(status.actionUrl);
    } else {
      toast?.showToast({
        type: status.level === 'normal' ? 'success' : status.level === 'advisory' ? 'info' : 'warning',
        message: status.title,
        description: status.message,
      });
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(status.level),
          borderColor: getBorderColor(status.level),
        },
      ]}
      onPress={handlePress}
    >
      <View style={styles.iconContainer}>
        {getStatusIcon(status.level)}
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: colors.text }]}>
          {status.title}
        </Text>
        
        <Text style={[styles.message, { color: colors.textSecondary }]} numberOfLines={2}>
          {status.message}
        </Text>
        
        <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
          Updated {formatUpdatedTime(status.updatedAt)}
        </Text>
      </View>
      
      <View style={styles.actionContainer}>
        <Feather name="chevron-right" size={20} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  iconContainer: {
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
  },
  actionContainer: {
    marginLeft: 8,
  },
});