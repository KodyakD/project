import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { FloorType } from '@/types/map.types';
import { FLOORS } from '@/constants/floors';
import Colors from '@/constants/Colors';

interface FloorSelectorProps {
  currentFloor: FloorType;
  onFloorChange: (floor: FloorType) => void;
  vertical?: boolean;
}

export const FloorSelector: React.FC<FloorSelectorProps> = ({
  currentFloor,
  onFloorChange,
  vertical = false,
}) => {
  return (
    <View style={[styles.container, vertical && styles.verticalContainer]}>
      <ScrollView
        horizontal={!vertical}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          vertical && styles.verticalScrollContent
        ]}
      >
        {FLOORS.map((floor) => (
          <TouchableOpacity
            key={floor.id}
            style={[
              styles.floorButton,
              floor.id === currentFloor && styles.activeFloorButton,
              vertical && styles.verticalFloorButton
            ]}
            onPress={() => onFloorChange(floor.id)}
          >
            <Text
              style={[
                styles.floorText,
                floor.id === currentFloor && styles.activeFloorText
              ]}
            >
              {floor.shortName}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    zIndex: 10,
  },
  verticalContainer: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -100 }],
    borderRadius: 8,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1000,
  },
  scrollContent: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  verticalScrollContent: {
    flexDirection: 'column',
    padding: 8,
  },
  floorButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  verticalFloorButton: {
    marginVertical: 4,
    marginHorizontal: 0,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  activeFloorButton: {
    backgroundColor: '#0066CC',
  },
  floorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  activeFloorText: {
    color: '#FFFFFF',
  },
});