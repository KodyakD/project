import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, RefreshControl, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Colors from '../../src/constants/Colors';
import Card from '../../src/components/ui/Card';
import { Loading } from '../../src/components/ui/Loading';
import { ErrorDisplay } from '../../src/components/ui/ErrorDisplay';
import { useNotifications } from '../../src/hooks/useNotifications';
import { NotificationType, NotificationData } from '../../src/services/notificationService';
import Button from '../../src/components/ui/Button';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../src/context/AuthContext';

export default function NotificationsScreen() {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    badge: {
      marginLeft: 8,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
    },
    badgeText: {
      color: 'white',
      fontSize: 12,
      fontWeight: 'bold',
    },
    actionBar: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginLeft: 8,
    },
    actionButtonText: {
      fontSize: 12,
      marginLeft: 4,
    },
    content: {
      flex: 1,
    },
    filtersContainer: {
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    filterButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 16,
      marginRight: 8,
      borderWidth: 2,
    },
    activeFilterButton: {
      borderWidth: 2,
    },
    filterText: {
      fontSize: 14,
    },
    activeFilterText: {
      fontWeight: '600',
    },
    notificationsList: {
      paddingHorizontal: 16,
      paddingBottom: 24,
    },
    notificationCard: {
      marginBottom: 12,
      padding: 14,
      borderRadius: 12,
    },
    unreadCard: {
      borderLeftWidth: 3,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    notificationTime: {
      fontSize: 12,
    },
    notificationTitle: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 4,
    },
    unreadTitle: {
      fontWeight: '600',
    },
    notificationBody: {
      fontSize: 14,
      lineHeight: 20,
    },
    unreadIndicator: {
      position: 'absolute',
      width: 8,
      height: 8,
      borderRadius: 4,
      top: 14,
      left: 14,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '500',
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 14,
      textAlign: 'center',
      marginTop: 8,
      paddingHorizontal: 24,
    },
    refreshButton: {
      marginTop: 24,
      minWidth: 120,
    },
  });

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { user } = useAuth();

  const { 
    notifications, 
    unreadCount, 
    loading, 
    refreshNotifications, 
    markAsRead, 
    markAllAsRead, 
    clearAll 
  } = useNotifications();
  
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<NotificationType | 'all'>('all');

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleClearAll = () => {
    Alert.alert(
      "Clear All Notifications",
      "Are you sure you want to clear all notifications? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear All", 
          style: "destructive", 
          onPress: async () => {
            await clearAll();
          }
        }
      ]
    );
  };

  const viewNotification = (notification: NotificationData) => {
    handleMarkAsRead(notification.id);
    
    // Navigate based on notification type
    if (notification.data?.incidentId) {
      // Update to match your file structure - likely /report/details/[id]
      router.push(`/report/details/${notification.data.incidentId}`);
    } else if (notification.data?.emergencyId) {
      // Update if you have a specific emergency detail screen
      router.push(`/emergency/${notification.data.emergencyId}`);
    } else {
      // Default fallback
      console.log('No specific route for this notification type');
    }
  };

  const getFilteredNotifications = useMemo(() => {
    if (filter === 'all') return notifications;
    return notifications.filter(notification => notification.type === filter);
  }, [notifications, filter]);

  const getTypeIcon = (type: NotificationType, size: number = 20) => {
    switch (type) {
      case 'emergency':
        return <Feather name="alert-triangle" size={size} color={colors.emergencyRed} />;
      case 'system_announcement':
        return <Feather name="info" size={size} color={colors.primary} />;
      case 'maintenance_alert':
        return <Feather name="layers" size={size} color={colors.warning} />;
      case 'incident_assigned':
      case 'incident_updated':
      case 'incident_resolved':
        return <Feather name="layers" size={size} color={colors.success} />;
      case 'user_mention':
        return <Feather name="bell" size={size} color={colors.primary} />;
      default:
        return <Feather name="bell" size={size} color={colors.primary} />;
    }
  };

  const filterButtons = [
    { label: 'All', value: 'all' },
    { label: 'Emergency', value: 'emergency' },
    { label: 'Incidents', value: 'incident_updated' },
    { label: 'Maintenance', value: 'maintenance_alert' },
    { label: 'System', value: 'system_announcement' },
  ];

  if (loading && !refreshing) {
    return <Loading fullScreen message="Loading notifications..." />;
  }

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (e) {
      return timestamp;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
        {unreadCount > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.actionBar}>
        {unreadCount > 0 && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.card }]} 
            onPress={handleMarkAllAsRead}
          >
            <Feather name="check" size={16} color={colors.success} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>
              Mark all read
            </Text>
          </TouchableOpacity>
        )}
        
        {notifications.length > 0 && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.card }]} 
            onPress={handleClearAll}
          >
            <Feather name="trash-2" size={16} color={colors.error} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>
              Clear all
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.content}>
        {/* Filter Tabs */}
        <ScrollableFilterTabs 
          activeFilter={filter} 
          onFilterChange={setFilter} 
          filters={filterButtons} 
          colors={colors} 
        />
        
        {/* Notifications List */}
        {getFilteredNotifications.length > 0 ? (
          <FlatList
            data={getFilteredNotifications}
            keyExtractor={item => item.id}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh} 
                colors={[colors.primary]} 
              />
            }
            contentContainerStyle={styles.notificationsList}
            renderItem={({ item }) => (
              <NotificationCard 
                notification={item} 
                onPress={() => viewNotification(item)} 
                getTypeIcon={getTypeIcon}
                colors={colors}
                formatTime={formatTime}
              />
            )}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Feather name="bell" size={50} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No notifications
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              {filter !== 'all' 
                ? `No ${filter.replace('_', ' ')} notifications found` 
                : 'You currently have no notifications'}
            </Text>
            <Button 
              title="Refresh" 
              onPress={onRefresh} 
              variant="outline"
              style={styles.refreshButton}
              loading={refreshing}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function ScrollableFilterTabs({ 
  activeFilter, 
  onFilterChange, 
  filters, 
  colors 
}: { 
  activeFilter: string; 
  onFilterChange: (filter: any) => void; 
  filters: Array<{ label: string; value: string }>;
  colors: any;
}) {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false} 
      contentContainerStyle={styles.filtersContainer}
    >
      {filters.map((filter) => (
        <TouchableOpacity
          key={filter.value}
          style={[
            styles.filterButton,
            activeFilter === filter.value && styles.activeFilterButton,
            { 
              backgroundColor: colors.card,
              borderColor: activeFilter === filter.value ? colors.primary : 'transparent'
            }
          ]}
          onPress={() => onFilterChange(filter.value)}
        >
          <Text 
            style={[
              styles.filterText,
              activeFilter === filter.value && styles.activeFilterText,
              { 
                color: activeFilter === filter.value ? colors.primary : colors.textSecondary
              }
            ]}
          >
            {filter.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function NotificationCard({ 
  notification, 
  onPress, 
  getTypeIcon,
  colors,
  formatTime
}: { 
  notification: NotificationData; 
  onPress: () => void; 
  getTypeIcon: (type: NotificationType, size?: number) => React.ReactNode;
  colors: any;
  formatTime: (timestamp: string) => string;
}) {
  return (
    <TouchableOpacity onPress={onPress}>
      <Card style={StyleSheet.flatten([
        styles.notificationCard, 
        !notification.read && styles.unreadCard,
        { backgroundColor: colors.card }
      ])}>
        <View style={styles.cardHeader}>
          {getTypeIcon(notification.type, 16)}
          <Text style={[
            styles.notificationTime,
            { color: colors.textSecondary }
          ]}>
            {formatTime(notification.createdAt)}
          </Text>
        </View>
        
        <Text 
          style={[
            styles.notificationTitle,
            !notification.read && styles.unreadTitle,
            { color: colors.text }
          ]}
          numberOfLines={2}
        >
          {notification.title}
        </Text>
        
        <Text 
          style={[
            styles.notificationBody,
            { color: colors.textSecondary }
          ]}
          numberOfLines={3}
        >
          {notification.body}
        </Text>
        
        {!notification.read && (
          <View style={[styles.unreadIndicator, { backgroundColor: colors.primary }]} />
        )}
      </Card>
    </TouchableOpacity>
  );
}