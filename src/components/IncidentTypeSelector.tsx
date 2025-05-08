import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

// Define incident types with categories
export const incidentTypes = {
  'Equipment': [
    'Equipment Failure',
    'Maintenance Required',
    'Electrical Issue',
    'Mechanical Issue',
    'Calibration Error',
  ],
  'Environment': [
    'Temperature Issue',
    'Humidity Problem',
    'Air Quality',
    'Water Leak',
    'HVAC Malfunction',
  ],
  'Security': [
    'Unauthorized Access',
    'Suspicious Activity',
    'Door/Window Issue',
    'Alarm Triggered',
    'Camera Malfunction',
  ],
  'Safety': [
    'Injury',
    'Hazardous Material',
    'Fire Hazard',
    'Structural Issue',
    'Obstruction',
  ],
  'Network/IT': [
    'Network Outage',
    'System Down',
    'Connectivity Issue',
    'Software Error',
    'Data Loss',
  ],
  'Other': [
    'Other'
  ]
};

// Flatten the categories for easy access
export const allIncidentTypes = Object.values(incidentTypes).flat();

interface IncidentTypeSelectorProps {
  value: string | null;
  onChange: (type: string) => void;
  required?: boolean;
}

export const IncidentTypeSelector: React.FC<IncidentTypeSelectorProps> = ({
  value,
  onChange,
  required = false
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customType, setCustomType] = useState('');

  const handleSelectType = (type: string) => {
    onChange(type);
    setModalVisible(false);
    
    // Reset search and custom type after selection
    setSearchQuery('');
    setCustomType('');
  };

  const handleSubmitCustomType = () => {
    if (customType.trim()) {
      onChange(customType.trim());
      setModalVisible(false);
      setCustomType('');
    }
  };

  const filteredCategories = () => {
    if (!searchQuery) return Object.keys(incidentTypes);
    
    const results: Record<string, string[]> = {};
    
    Object.entries(incidentTypes).forEach(([category, types]) => {
      const matchingTypes = types.filter(type => 
        type.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      if (matchingTypes.length > 0 || category.toLowerCase().includes(searchQuery.toLowerCase())) {
        results[category] = matchingTypes;
      }
    });
    
    return Object.keys(results);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Incident Type {required && <Text style={styles.required}>*</Text>}
      </Text>
      
      <TouchableOpacity 
        style={styles.selector}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.selectorText, !value && styles.placeholderText]}>
          {value || "Select incident type"}
        </Text>
        <Ionicons name="chevron-down" size={20} color={theme.colors.text} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => {
                setModalVisible(false);
                setSearchQuery('');
                setCustomType('');
              }}
            >
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Incident Type</Text>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search incident types"
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
          </View>

          <FlatList
            data={filteredCategories()}
            keyExtractor={(item) => item}
            renderItem={({ item: category }) => (
              <View>
                <Text style={styles.categoryHeader}>{category}</Text>
                {incidentTypes[category]
                  .filter(type => type.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={styles.typeItem}
                      onPress={() => handleSelectType(type)}
                    >
                      <Text style={styles.typeText}>{type}</Text>
                      {value === type && (
                        <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))
                }
              </View>
            )}
            ListFooterComponent={
              <View style={styles.customTypeContainer}>
                <Text style={styles.categoryHeader}>Custom Type</Text>
                <View style={styles.customTypeInputContainer}>
                  <TextInput
                    style={styles.customTypeInput}
                    placeholder="Enter custom incident type"
                    value={customType}
                    onChangeText={setCustomType}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmitCustomType}
                  />
                  <TouchableOpacity
                    style={[
                      styles.customTypeButton,
                      !customType.trim() && styles.customTypeButtonDisabled
                    ]}
                    disabled={!customType.trim()}
                    onPress={handleSubmitCustomType}
                  >
                    <Text style={styles.customTypeButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
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
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
  },
  selectorText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  placeholderText: {
    color: theme.colors.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
    color: theme.colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    margin: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  categoryHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    padding: 16,
    paddingBottom: 8,
    backgroundColor: theme.colors.backgroundLight,
    color: theme.colors.textSecondary,
  },
  typeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  typeText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  customTypeContainer: {
    marginBottom: 40,
  },
  customTypeInputContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  customTypeInput: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    marginRight: 8,
    fontSize: 16,
  },
  customTypeButton: {
    padding: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customTypeButtonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  customTypeButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
}); 