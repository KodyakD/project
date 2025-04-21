import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';
import { FloorType } from '@/types/map.types';
import Colors from '@/constants/Colors';
import { FLOORS } from '@/constants/floors';

interface FloorSelectorProps {
  currentFloor: FloorType;
  onFloorChange: (floor: FloorType) => void;
  style?: object;
}

const FloorSelector: React.FC<FloorSelectorProps> = ({
  currentFloor,
  onFloorChange,
  style
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, style, { backgroundColor: colors.card }]}>
      {FLOORS.map((floor) => (
        <TouchableOpacity
          key={floor.id}
          style={[
            styles.floorButton,
            currentFloor === floor.id && { backgroundColor: colors.primary }
          ]}
          onPress={() => onFloorChange(floor.id as FloorType)}
        >
          <Text
            style={[
              styles.floorText,
              { color: currentFloor === floor.id ? colors.background : colors.text }
            ]}
          >
            {floor.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 8,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  floorButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  floorText: {
    fontWeight: '500',
    fontSize: 14,
  }
});

export default FloorSelector;