import React from 'react';
import { StyleSheet, View, Text, FlatList, useWindowDimensions } from 'react-native';
import { useColorScheme } from 'react-native';
import Colors from '../../constants/Colors';
import QuickActionButton from './QuickActionButton';
import Card from '../ui/Card';
import { 
  Map, 
  Bell, 
  AlertTriangle, 
  Phone, 
  FileText, 
  User, 
  Shield, 
  Settings
} from '@expo/vector-icons/Feather';

export type QuickAction = {
  id: string;
  title: string;
  icon: React.ReactNode;
  route?: string;
  onPress?: () => void;
  color?: string;
  gradient?: string[];
  badge?: number | string;
  disabled?: boolean;
};

interface QuickActionsGridProps {
  actions?: QuickAction[];
  columns?: number;
  title?: string;
  showCard?: boolean;
}

export default function QuickActionsGrid({
  actions,
  columns = 3,
  title = 'Quick Actions',
  showCard = true,
}: QuickActionsGridProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { width } = useWindowDimensions();
  
  // Default actions if none provided
  const defaultActions: QuickAction[] = [
    {
      id: 'map',
      title: 'View Maps',
      icon: <Map size={24} color={colors.primary} />,
      route: '/maps',
      color: colors.primary,
    },
    {
      id: 'report',
      title: 'Report Incident',
      icon: <AlertTriangle size={24} color="#FF6B6B" />,
      route: '/report/incident',
      color: '#FF6B6B',
    },
    {
      id: 'emergency',
      title: 'Emergency Contacts',
      icon: <Phone size={24} color="#4ECDC4" />,
      route: '/emergency-contacts',
      color: '#4ECDC4',
    },
    {
      id: 'safety',
      title: 'Safety Plans',
      icon: <Shield size={24} color="#FFD166" />,
      route: '/safety-plans',
      color: '#FFD166',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: <Bell size={24} color="#6A0572" />,
      route: '/notifications',
      badge: 3,
      color: '#6A0572',
    },
    {
      id: 'profile',
      title: 'My Profile',
      icon: <User size={24} color="#F0C808" />,
      route: '/profile',
      color: '#F0C808',
    },
  ];

  const displayActions = actions || defaultActions;
  
  // Calculate item size based on screen width and columns
  const calculateItemSize = () => {
    const padding = 32; // Total horizontal padding
    const gap = 16 * (columns - 1); // Total gap between items
    const availableWidth = width - padding - gap;
    return availableWidth / columns;
  };
  
  const itemSize = calculateItemSize();

  // Render content with optional card wrapper
  const renderContent = () => (
    <>
      {title && <Text style={[styles.title, { color: colors.text }]}>{title}</Text>}
      <View style={styles.grid}>
        {displayActions.map((action) => (
          <QuickActionButton
            key={action.id}
            title={action.title}
            icon={action.icon}
            route={action.route}
            onPress={action.onPress}
            color={action.color}
            gradient={action.gradient}
            badge={action.badge}
            disabled={action.disabled}
            size="small"
            style={{ width: itemSize, height: itemSize, margin: 8 }}
          />
        ))}
      </View>
    </>
  );

  // Return content with or without card wrapper
  return showCard ? (
    <Card style={styles.card}>
      {renderContent()}
    </Card>
  ) : (
    <View style={styles.container}>
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  card: {
    marginVertical: 16,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginHorizontal: -8, // Offset item margins
  },
}); 