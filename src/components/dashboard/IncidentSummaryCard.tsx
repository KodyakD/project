import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import Colors from '../../constants/Colors';
import {
  AlertTriangle,
  Clock,
  MapPin,
  ChevronRight,
  User,
  AlertCircle,
} from '@expo/vector-icons/Feather';
import Card, { CardHeader, CardContent, CardFooter } from '../ui/Card';

export type IncidentSummary = {
  id: string;
  title: string;
  description: string;
  location: string;
  building?: string;
  floor?: string;
  timestamp: string | Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'reported' | 'in-progress' | 'resolved';
  reporter?: {
    name: string;
    role?: string;
    avatar?: string;
  };
  hasMedia?: boolean;
  assignedTo?: string;
};

interface IncidentSummaryCardProps {
  incident: IncidentSummary;
  onPress?: (incident: IncidentSummary) => void;
  compact?: boolean;
  showFooter?: boolean;
}

export default function IncidentSummaryCard({
  incident,
  onPress,
  compact = false,
  showFooter = true,
}: IncidentSummaryCardProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Format date for display
  const formattedDate = () => {
    const date = typeof incident.timestamp === 'string' 
      ? new Date(incident.timestamp) 
      : incident.timestamp;
    
    return date.toLocaleString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Get color for severity
  const getSeverityColor = () => {
    switch (incident.severity) {
      case 'low':
        return colors.info;
      case 'medium':
        return colors.warning;
      case 'high':
        return colors.error;
      case 'critical':
        return colors.critical;
      default:
        return colors.info;
    }
  };

  // Get color for status
  const getStatusColor = () => {
    switch (incident.status) {
      case 'reported':
        return colors.warning;
      case 'in-progress':
        return colors.info;
      case 'resolved':
        return colors.success;
      default:
        return colors.warning;
    }
  };

  // Get status label
  const getStatusLabel = () => {
    switch (incident.status) {
      case 'reported':
        return 'Reported';
      case 'in-progress':
        return 'In Progress';
      case 'resolved':
        return 'Resolved';
      default:
        return 'Reported';
    }
  };

  // Handle press on card
  const handlePress = () => {
    if (onPress) {
      onPress(incident);
    } else {
      router.push(`/report/details/${incident.id}`);
    }
  };

  // Get severity icon
  const getSeverityIcon = () => {
    switch (incident.severity) {
      case 'low':
        return <AlertCircle size={16} color={getSeverityColor()} />;
      case 'medium':
        return <AlertTriangle size={16} color={getSeverityColor()} />;
      case 'high':
        return <AlertTriangle size={16} color={getSeverityColor()} />;
      case 'critical':
        return <AlertCircle size={16} color={getSeverityColor()} />;
      default:
        return <AlertCircle size={16} color={getSeverityColor()} />;
    }
  };

  return (
    <Card style={styles.card}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        <CardContent style={styles.content}>
          {/* Header with severity indicator */}
          <View style={styles.header}>
            <View style={[styles.severityIndicator, { backgroundColor: getSeverityColor() + '20' }]}>
              {getSeverityIcon()}
              <Text style={[styles.severityText, { color: getSeverityColor() }]}>
                {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
              </Text>
            </View>
            
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {getStatusLabel()}
              </Text>
            </View>
          </View>

          {/* Title and Description */}
          <View style={styles.titleContainer}>
            <Text 
              style={[styles.title, { color: colors.text }]} 
              numberOfLines={compact ? 1 : 2}
            >
              {incident.title}
            </Text>
            
            {!compact && (
              <Text 
                style={[styles.description, { color: colors.textSecondary }]} 
                numberOfLines={2}
              >
                {incident.description}
              </Text>
            )}
          </View>

          {/* Location and Time Info */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <MapPin size={14} color={colors.textSecondary} style={styles.detailIcon} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={1}>
                {incident.building ? `${incident.building}, ` : ''}
                {incident.location}
                {incident.floor ? `, ${incident.floor}` : ''}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Clock size={14} color={colors.textSecondary} style={styles.detailIcon} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                {formattedDate()}
              </Text>
            </View>
          </View>

          {/* Reporter Info - Only show if not compact and has reporter */}
          {!compact && incident.reporter && (
            <View style={styles.reporterContainer}>
              {incident.reporter.avatar ? (
                <Image 
                  source={{ uri: incident.reporter.avatar }} 
                  style={styles.avatar} 
                />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.border }]}>
                  <User size={14} color={colors.textSecondary} />
                </View>
              )}
              
              <View style={styles.reporterInfo}>
                <Text style={[styles.reporterName, { color: colors.text }]}>
                  {incident.reporter.name}
                </Text>
                
                {incident.reporter.role && (
                  <Text style={[styles.reporterRole, { color: colors.textMuted }]}>
                    {incident.reporter.role}
                  </Text>
                )}
              </View>
            </View>
          )}
        </CardContent>

        {/* Footer with buttons */}
        {showFooter && (
          <CardFooter>
            <TouchableOpacity 
              style={[styles.footerButton, { borderColor: colors.border }]}
              onPress={handlePress}
            >
              <Text style={[styles.footerButtonText, { color: colors.primary }]}>View Details</Text>
              <ChevronRight size={16} color={colors.primary} />
            </TouchableOpacity>
          </CardFooter>
        )}
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    overflow: 'hidden',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  severityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  titleContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  detailsContainer: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailIcon: {
    marginRight: 6,
  },
  detailText: {
    fontSize: 12,
  },
  reporterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  avatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  reporterInfo: {
    flex: 1,
  },
  reporterName: {
    fontSize: 12,
    fontWeight: '500',
  },
  reporterRole: {
    fontSize: 10,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
}); 