import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { DeviceData } from '../../types/device';

interface SensorPosition {
  id: string;
  x: number;
  y: number;
  name: string;
  deviceId: string;
  data?: DeviceData;
}

interface SensorOverlayProps {
  sensors: SensorPosition[];
  mapWidth: number;
  mapHeight: number;
  containerWidth: number;
  containerHeight: number;
  onSensorPress: (sensorId: string) => void;
}

const SensorOverlay: React.FC<SensorOverlayProps> = ({
  sensors,
  mapWidth,
  mapHeight,
  containerWidth,
  containerHeight,
  onSensorPress,
}) => {
  // Calculate scaling factors for positioning sensors correctly
  const scaleX = containerWidth / mapWidth;
  const scaleY = containerHeight / mapHeight;

  // Determine color based on sensor status
  const getSensorColor = (data?: DeviceData) => {
    if (!data) return '#CCCCCC'; // Gray for unknown/no data

    // Check for alerts in the sensor data
    if (data.status === 'error' || data.status === 'alert') {
      return '#FF4136'; // Red for error/alert
    }
    
    if (data.status === 'warning') {
      return '#FF851B'; // Orange for warning
    }
    
    if (data.status === 'offline') {
      return '#999999'; // Dark gray for offline
    }
    
    return '#2ECC40'; // Green for normal
  };

  // Get size based on sensor importance/status
  const getSensorSize = (data?: DeviceData) => {
    if (!data) return 12;
    
    if (data.status === 'error' || data.status === 'alert') {
      return 16; // Larger for important alerts
    }
    
    return 12; // Default size
  };

  return (
    <View style={styles.overlay}>
      {sensors.map((sensor) => {
        // Calculate position based on scaling factors
        const sensorX = sensor.x * scaleX;
        const sensorY = sensor.y * scaleY;
        
        const color = getSensorColor(sensor.data);
        const size = getSensorSize(sensor.data);
        
        return (
          <TouchableOpacity
            key={sensor.id}
            style={[
              styles.sensor,
              {
                left: sensorX - size / 2,
                top: sensorY - size / 2,
                width: size,
                height: size,
                backgroundColor: color,
              },
            ]}
            onPress={() => onSensorPress(sensor.id)}
          >
            {(sensor.data?.status === 'error' || sensor.data?.status === 'alert') && (
              <View style={styles.pulseEffect} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'box-none',
  },
  sensor: {
    position: 'absolute',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  sensorLabel: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: '#FFFFFF',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 10,
    top: 14,
    left: 10,
  },
  pulseEffect: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#FF4136',
    borderRadius: 50,
    width: 24,
    height: 24,
    opacity: 0.5,
  },
});

export default SensorOverlay; 