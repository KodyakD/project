import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { IncidentStatus } from '../../services/incidentService';

interface StatusTimelineProps {
  status: IncidentStatus;
}

const StatusTimeline: React.FC<StatusTimelineProps> = ({ status }) => {
  // Define steps in the incident lifecycle
  const steps = [
    { 
      id: 'reported', 
      label: 'Reported', 
      icon: 'report-problem',
      active: true, // Always active as all incidents start as reported
      completed: true
    },
    { 
      id: 'in-progress', 
      label: 'In Progress', 
      icon: 'pending-actions',
      active: status === 'in-progress' || status === 'resolved',
      completed: status === 'in-progress' || status === 'resolved' 
    },
    { 
      id: 'resolved', 
      label: 'Resolved', 
      icon: 'check-circle',
      active: status === 'resolved',
      completed: status === 'resolved'
    }
  ];

  return (
    <View style={styles.container}>
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          {/* Step item */}
          <View style={styles.stepItem}>
            {/* Step icon */}
            <View 
              style={[
                styles.iconContainer,
                step.active && styles.activeIconContainer,
                step.completed && styles.completedIconContainer
              ]}
            >
              <MaterialIcons 
                name={step.icon as any} 
                size={20} 
                color={step.active ? '#FFFFFF' : '#999999'} 
              />
            </View>
            
            {/* Step label */}
            <Text 
              style={[
                styles.stepLabel,
                step.active && styles.activeStepLabel
              ]}
            >
              {step.label}
            </Text>
          </View>
          
          {/* Connector line - don't render after the last step */}
          {index < steps.length - 1 && (
            <View 
              style={[
                styles.connector,
                steps[index + 1].active && styles.activeConnector
              ]} 
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  stepItem: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeIconContainer: {
    backgroundColor: '#007AFF',
  },
  completedIconContainer: {
    backgroundColor: '#34C759',
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    textAlign: 'center',
  },
  activeStepLabel: {
    color: '#333333',
    fontWeight: '600',
  },
  connector: {
    flex: 1,
    height: 3,
    backgroundColor: '#E5E5EA',
  },
  activeConnector: {
    backgroundColor: '#34C759',
  },
});

export default StatusTimeline; 