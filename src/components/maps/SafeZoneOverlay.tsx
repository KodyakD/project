import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { FloorMapSafeZone } from '../../services/floorMapService';

interface SafeZoneOverlayProps {
  safeZones: FloorMapSafeZone[];
  scale: number;
  onZonePress?: (zone: FloorMapSafeZone) => void;
}

const SafeZoneOverlay: React.FC<SafeZoneOverlayProps> = ({ 
  safeZones, 
  scale,
  onZonePress
}) => {
  if (!safeZones || safeZones.length === 0) {
    return null;
  }

  return (
    <>
      {safeZones.map(zone => (
        <View
          key={zone.id}
          style={[
            styles.safeZone,
            {
              left: zone.x,
              top: zone.y,
              width: zone.width,
              height: zone.height,
              transform: [{ scale }]
            }
          ]}
          pointerEvents="box-none"
          onTouchEnd={() => onZonePress && onZonePress(zone)}
        >
          <Text style={styles.zoneLabel} numberOfLines={1}>
            {zone.label || 'Safe Zone'}
          </Text>
          <Text style={styles.zoneCapacity}>
            Cap: {zone.capacity}
          </Text>
        </View>
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  safeZone: {
    position: 'absolute',
    backgroundColor: 'rgba(16, 185, 129, 0.3)', // Green with transparency
    borderWidth: 2,
    borderColor: '#059669',
    borderStyle: 'dashed',
    borderRadius: 4,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneLabel: {
    color: '#065f46',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
  zoneCapacity: {
    color: '#065f46',
    fontSize: 10,
  }
});

export default SafeZoneOverlay; 