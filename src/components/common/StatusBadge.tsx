import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IncidentStatus } from '../../types';

interface StatusBadgeProps {
  status: IncidentStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'reported':
        return styles.reportedBadge;
      case 'in-progress':
        return styles.inProgressBadge;
      case 'resolved':
        return styles.resolvedBadge;
      default:
        return styles.reportedBadge;
    }
  };

  const getTextStyle = () => {
    switch (status) {
      case 'reported':
        return styles.reportedText;
      case 'in-progress':
        return styles.inProgressText;
      case 'resolved':
        return styles.resolvedText;
      default:
        return styles.reportedText;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'reported':
        return 'Reported';
      case 'in-progress':
        return 'In Progress';
      case 'resolved':
        return 'Resolved';
      default:
        return 'Unknown';
    }
  };

  return (
    <View style={[styles.badge, getBadgeStyle()]}>
      <Text style={[styles.text, getTextStyle()]}>{getStatusText()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
  reportedBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  reportedText: {
    color: '#DC2626',
  },
  inProgressBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  inProgressText: {
    color: '#D97706',
  },
  resolvedBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  resolvedText: {
    color: '#16A34A',
  },
});