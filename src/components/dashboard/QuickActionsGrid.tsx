import React from 'react';
import { StyleSheet, View, Text, FlatList, useWindowDimensions } from 'react-native';
import { useColorScheme } from 'react-native';
import Colors from '../../constants/Colors';
import QuickActionButton from './QuickActionButton';
import Card from '../ui/Card';
// Change the import pattern for Feather icons
import { Feather } from '@expo/vector-icons';

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
  
  // Calculate item size based on grid columns and screen width
  const itemSize = (width - 32 - (columns * 16)) / columns;
  
  // Default actions if none provided
  const defaultActions: QuickAction[] = [
    {
      id: 'maps',
      title: 'Campus Map',
      icon: <Feather name="map" size={24} color="#3772FF" />,
      route: '/maps',
      color: '#3772FF',
    },
    {
      id: 'incidents',
      title: 'Incidents',
      icon: <Feather name="alert-triangle" size={24} color="#FF6B6B" />,
      route: '/incidents',
      color: '#FF6B6B',
    },
    {
      id: 'emergency',
      title: 'Emergency',
      icon: <Feather name="phone" size={24} color="#FF9F1C" />,
      route: '/emergency',
      color: '#FF9F1C',
    },
    {
      id: 'safety',
      title: 'Safety Plans',
      icon: <Feather name="shield" size={24} color="#FFD166" />,
      route: '/safety-plans',
      color: '#FFD166',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: <Feather name="bell" size={24} color="#6A0572" />,
      route: '/notifications',
      badge: 3,
      color: '#6A0572',
    },
    {
      id: 'profile',
      title: 'My Profile',
      icon: <Feather name="user" size={24} color="#F0C808" />,
      route: '/profile',
      color: '#F0C808',
    },
  ];

  const displayActions = actions || defaultActions;
  
  // Render content with or without title
  const renderContent = () => (
    <>
      {title && (
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      )}
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
    marginBottom: 24,
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
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
  },
});