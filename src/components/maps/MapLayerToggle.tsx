import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

interface MapLayerToggleProps {
  icon: string;
  label: string;
  isActive: boolean;
  onToggle: () => void;
}

const MapLayerToggle: React.FC<MapLayerToggleProps> = ({
  icon,
  label,
  isActive,
  onToggle,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: isActive ? colors.primary : colors.card },
      ]}
      onPress={onToggle}
    >
      <MaterialIcons
        name={icon as any}
        size={18}
        color={isActive ? '#fff' : colors.text}
      />
      <Text
        style={[
          styles.label,
          { color: isActive ? '#fff' : colors.text },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
  },
  label: {
    marginLeft: 6,
    fontWeight: '500',
    fontSize: 14,
  },
});

export default MapLayerToggle;