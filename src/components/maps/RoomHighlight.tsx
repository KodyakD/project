import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';
import Colors from '../../constants/Colors';
import { roomCoordinates } from '../../data/roomCoordinates';
import { FloorType } from '../../types/map.types';

interface RoomHighlightProps {
  floorId?: FloorType;
  highlightedRoomId: string | null;
  onRoomPress?: (roomId: string) => void;
}

const RoomHighlight: React.FC<RoomHighlightProps> = ({ 
  floorId = 'rdc', 
  highlightedRoomId, 
  onRoomPress 
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const rooms = roomCoordinates[floorId] || [];
  
  return (
    <>
      {rooms.map(room => {
        const isHighlighted = room.id === highlightedRoomId;
        
        return (
          <TouchableOpacity
            key={room.id}
            style={[
              styles.room,
              {
                left: room.x,
                top: room.y,
                width: room.width,
                height: room.height,
                borderColor: isHighlighted ? colors.primary : 'transparent',
                backgroundColor: isHighlighted ? `${colors.primary}33` : 'transparent',
              }
            ]}
            onPress={() => onRoomPress && onRoomPress(room.id)}
          >
            {isHighlighted && (
              <Text style={[styles.roomLabel, { color: colors.primary }]}>
                {room.label}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </>
  );
};

const styles = StyleSheet.create({
  room: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 4,
    borderRadius: 4,
  }
});

export default RoomHighlight;