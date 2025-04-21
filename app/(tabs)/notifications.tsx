import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { AlertTriangle, Bell, Calendar, Layers, Info } from '@expo/vector-icons/Feather';
import Colors from '../../src/constants/Colors';
import Card from '../../src/components/ui/Card';
import { Loading } from '../../src/components/ui/Loading';
import { ErrorDisplay } from '../../src/components/ui/ErrorDisplay';

type NotificationType = 'alert' | 'info' | 'schedule' | 'update';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: string;
  read: boolean;
}

// Mock data for notifications
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Emergency: Fire Alarm in Engineering Building',
    message: 'Fire alarm has been triggered on floor 2. Please evacuate immediately following safety protocols.',
    type: 'alert',
    timestamp: '2 minutes ago',
    read: false,
  },
  {
    id: '2',
    title: 'Evacuation Drill Next Week',
    message: 'A scheduled evacuation drill will take place on Monday at 10:00 AM. Please review evacuation routes.',
    type: 'schedule',
    timestamp: '2 hours ago',
    read: true,
  },
  {
    id: '3',
    title: 'New Safety Protocol Available',
    message: 'Updated safety protocols for chemical handling have been published. Please review the changes.',
    type: 'update',
    timestamp: '1 day ago',
    read: true,
  },
  {
    id: '4',
    title: 'System Maintenance',
    message: 'Emergency alerts system will undergo maintenance tonight from 2 AM to 4 AM.',
    type: 'info',
    timestamp: '2 days ago',
    read: true,
  },
  {
    id: '5',
    title: 'Weather Alert: Heavy Rainfall',
    message: 'Heavy rainfall expected this afternoon. Be cautious of potential flooding in lower campus areas.',
    type: 'alert',
    timestamp: '3 days ago',
    read: true,
  },
];

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<NotificationType | 'all'>('all');

  useEffect(() => {
    // Simulate loading data from an API
    const timer = setTimeout(() => {
      setNotifications(MOCK_NOTIFICATIONS);
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate refreshing data
    setTimeout(() => {
      setNotifications(MOCK_NOTIFICATIONS);
      setRefreshing(false);
    }, 1500);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
  };

  const viewNotification = (notification: Notification) => {
    markAsRead(notification.id);
    router.push(`/notifications/${notification.id}`);
  };

  const getFilteredNotifications = () => {
    if (filter === 'all') return notifications;
    return notifications.filter(notification => notification.type === filter);
  };

  const getTypeIcon = (type: NotificationType, size: number = 20) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle size={size} color={colors.critical} />;
      case 'info':
        return <Info size={size} color={colors.info} />;
      case 'schedule':
        return <Calendar size={size} color={colors.warning} />;
      case 'update':
        return <Layers size={size} color={colors.success} />;
      default:
        return <Bell size={size} color={colors.primary} />;
    }
  };

  const filterButtons = [
    { label: 'All', value: 'all' },
    { label: 'Alerts', value: 'alert' },
    { label: 'Updates', value: 'update' },
    { label: 'Scheduled', value: 'schedule' },
    { label: 'Info', value: 'info' },
  ];

  if (loading) {
    return <Loading fullScreen message="Loading notifications..." />;
  }

  if (error) {
    return <ErrorDisplay fullScreen message={error} onRetry={() => setError(null)} />;
  }

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;

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
      
      <View style={styles.content}>
        {/* Filter Tabs */}
        <ScrollableFilterTabs 
          activeFilter={filter} 
          onFilterChange={setFilter} 
          filters={filterButtons} 
          colors={colors} 
        />
        
        {/* Notifications List */}
        {filteredNotifications.length > 0 ? (
          <FlatList
            data={filteredNotifications}
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
              />
            )}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Bell size={50} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No notifications
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              {filter === 'all' 
                ? 'You don\'t have any notifications yet'
                : `You don't have any ${filter} notifications`}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// Filter tabs component
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
    <View style={styles.filterContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersScroll}
      >
        {filters.map(filter => (
          <TouchableOpacity
            key={filter.value}
            style={[
              styles.filterButton,
              activeFilter === filter.value && { 
                backgroundColor: colors.primary + '20',  // 20% opacity
                borderColor: colors.primary
              },
              activeFilter !== filter.value && { borderColor: colors.border }
            ]}
            onPress={() => onFilterChange(filter.value)}
          >
            <Text style={[
              styles.filterText, 
              { color: activeFilter === filter.value ? colors.primary : colors.textSecondary }
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// Notification card component
function NotificationCard({ 
  notification, 
  onPress, 
  getTypeIcon,
  colors
}: { 
  notification: Notification; 
  onPress: () => void; 
  getTypeIcon: (type: NotificationType) => React.ReactNode;
  colors: any;
}) {
  return (
    <Card style={[
      styles.notificationCard, 
      !notification.read && { borderLeftColor: colors.primary, borderLeftWidth: 3 }
    ]}>
      <TouchableOpacity style={styles.notificationItem} onPress={onPress}>
        <View style={styles.notificationIcon}>
          {getTypeIcon(notification.type)}
        </View>
        <View style={styles.notificationContent}>
          <Text 
            style={[
              styles.notificationTitle, 
              { color: colors.text },
              !notification.read && { fontWeight: '700' }
            ]}
            numberOfLines={1}
          >
            {notification.title}
          </Text>
          <Text 
            style={[styles.notificationMessage, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {notification.message}
          </Text>
          <Text style={[styles.notificationTime, { color: colors.textMuted }]}>
            {notification.timestamp}
          </Text>
        </View>
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
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
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filtersScroll: {
    paddingRight: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  notificationsList: {
    padding: 16,
    paddingTop: 0,
  },
  notificationCard: {
    marginBottom: 12,
    overflow: 'hidden',
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
});