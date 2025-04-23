import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Circle, G, Path } from 'react-native-svg';
import { Incident } from '@/services/incidentService';
import { Ionicons } from '@expo/vector-icons';

interface IncidentOverlayProps {
  incidents: Incident[];
  mapWidth: number;
  mapHeight: number;
  scale: number;
  onIncidentPress?: (incident: Incident) => void;
}

const IncidentOverlay: React.FC<IncidentOverlayProps> = ({
  incidents,
  mapWidth,
  mapHeight,
  scale,
  onIncidentPress,
}) => {
  // Skip rendering if no incidents available
  if (!incidents?.length) return null;

  // Determine color based on incident severity
  const getIncidentColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return '#EF4444'; // Red
      case 'high':
        return '#F97316'; // Orange
      case 'medium':
        return '#F59E0B'; // Amber
      case 'low':
        return '#10B981'; // Green
      default:
        return '#6B7280'; // Gray
    }
  };

  // Get icon name based on incident type (if included in incident data)
  const getIncidentIcon = (incident: Incident): string => {
    // Extract incident type from metadata or infer from description
    const type = incident.metadata?.type || '';
    
    if (type.includes('fire') || incident.description?.toLowerCase().includes('fire')) {
      return 'flame';
    }
    if (type.includes('water') || incident.description?.toLowerCase().includes('water')) {
      return 'water';
    }
    if (type.includes('gas') || incident.description?.toLowerCase().includes('gas')) {
      return 'warning';
    }
    if (type.includes('power') || incident.description?.toLowerCase().includes('power')) {
      return 'flash';
    }
    if (type.includes('injury') || incident.description?.toLowerCase().includes('injury')) {
      return 'medical';
    }
    
    // Default icon
    return 'alert-circle';
  };
  
  // Pulse effect for critical incidents
  const renderPulseEffect = (x: number, y: number, color: string) => {
    return (
      <Circle
        cx={x}
        cy={y}
        r={20 / scale}
        fill={color}
        opacity={0.3}
        stroke={color}
        strokeWidth={1 / scale}
      >
        <animate
          attributeName="r"
          from="15"
          to="30"
          dur="1.5s"
          begin="0s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          from="0.6"
          to="0"
          dur="1.5s"
          begin="0s"
          repeatCount="indefinite"
        />
      </Circle>
    );
  };

  return (
    <G>
      {incidents.map((incident) => {
        // Skip if no coordinates
        if (!incident.location?.coordinates) return null;
        
        const { x, y } = incident.location.coordinates;
        const color = getIncidentColor(incident.severity);
        const size = incident.severity === 'critical' ? 12 : 8;
        const scaledSize = size / scale;
        
        return (
          <G key={incident.id} onPress={() => onIncidentPress?.(incident)}>
            {/* Background pulse for critical incidents */}
            {incident.severity === 'critical' && renderPulseEffect(x, y, color)}
            
            {/* Incident marker */}
            <Circle
              cx={x}
              cy={y}
              r={scaledSize}
              fill={color}
              stroke="#FFFFFF"
              strokeWidth={1 / scale}
            />
            
            {/* Marker for 'in-progress' incidents */}
            {incident.status === 'in-progress' && (
              <Circle
                cx={x}
                cy={y}
                r={scaledSize * 1.5}
                fill="transparent"
                stroke="#3B82F6"
                strokeWidth={2 / scale}
                strokeDasharray={[4 / scale, 2 / scale]}
              />
            )}
          </G>
        );
      })}
    </G>
  );
};

export default IncidentOverlay; 