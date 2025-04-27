import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../../constants/Colors';
import { useColorScheme } from 'react-native';

type StatusType = 'critical' | 'high' | 'medium' | 'low' | 'resolved';

type Props = {
  status: StatusType;
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
};

const statusLabels: Record<StatusType, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  resolved: 'Resolved',
};

export default function StatusBadge({ status, size = 'medium', showText = true }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const backgroundColor = Colors.status[status];
  
  // Determine dot size based on the size prop
  const dotSize = size === 'small' ? 8 : size === 'medium' ? 12 : 16;
  
  // Determine font size based on the size prop
  const fontSize = size === 'small' ? 12 : size === 'medium' ? 14 : 16;
  
  return (
    <View style={styles.container}>
      <View 
        style={[
          styles.dot, 
          { 
            backgroundColor, 
            width: dotSize, 
            height: dotSize,
          }
        ]} 
      />
      {showText && (
        <Text 
          style={[
            styles.text, 
            { 
              color: colors.text,
              fontSize,
            }
          ]}
        >
          {statusLabels[status]}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    borderRadius: 50,
  },
  text: {
    fontFamily: 'Inter-Medium',
  },
});