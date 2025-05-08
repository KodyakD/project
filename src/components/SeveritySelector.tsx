import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

interface SeveritySelectorProps {
  value: SeverityLevel | null;
  onChange: (severity: SeverityLevel) => void;
  required?: boolean;
}

interface SeverityOption {
  value: SeverityLevel;
  label: string;
  color: string;
  icon: string;
  description: string;
}

const severityOptions: SeverityOption[] = [
  {
    value: 'low',
    label: 'Low',
    color: theme.colors.success,
    icon: 'information-circle',
    description: 'Minor issue, no immediate action required'
  },
  {
    value: 'medium',
    label: 'Medium',
    color: theme.colors.warning,
    icon: 'alert-circle',
    description: 'Moderate issue requiring attention'
  },
  {
    value: 'high',
    label: 'High',
    color: '#FFA500', // Orange
    icon: 'warning',
    description: 'Serious issue requiring prompt action'
  },
  {
    value: 'critical',
    label: 'Critical',
    color: theme.colors.error,
    icon: 'alert',
    description: 'Severe issue requiring immediate action'
  }
];

export const SeveritySelector: React.FC<SeveritySelectorProps> = ({
  value,
  onChange,
  required = false
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Severity {required && <Text style={styles.required}>*</Text>}
      </Text>
      
      <View style={styles.optionsContainer}>
        {severityOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              value === option.value && styles.selectedOption,
              { borderColor: option.color }
            ]}
            onPress={() => onChange(option.value)}
          >
            <View style={styles.optionContent}>
              <View style={[styles.iconContainer, { backgroundColor: option.color }]}>
                <Ionicons name={option.icon as any} size={20} color="white" />
              </View>
              <Text style={[
                styles.optionLabel,
                value === option.value && { color: option.color, fontWeight: 'bold' }
              ]}>
                {option.label}
              </Text>
            </View>
            <Text style={styles.optionDescription}>{option.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
    color: theme.colors.text,
  },
  required: {
    color: theme.colors.error,
  },
  optionsContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  optionButton: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 12,
    backgroundColor: theme.colors.background,
  },
  selectedOption: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  optionDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 36,
  },
}); 