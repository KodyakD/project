import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useRouter } from 'expo-router';
import Colors from '../../../src/constants/Colors';
import incidentService from '../../../src/services/incidentService';
import { useTheme } from '../../../src/context/ThemeContext';
import type { Incident, IncidentStatus, IncidentSeverity, IncidentType } from '../../../src/types';

const { width: screenWidth } = Dimensions.get('window');

interface IncidentFormData {
  title: string;
  description: string;
  status: IncidentStatus;
  type: IncidentType;
  severity: IncidentSeverity;
  location?: {
    buildingId: string;
    floorId: string;
    x: number;
    y: number;
    description?: string;
  };
  priority: string;
}

export default function UpdateIncidentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [incident, setIncident] = useState<Partial<Incident> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<IncidentFormData>({
    title: '',
    description: '',
    status: 'reported' as IncidentStatus,
    severity: 'medium' as IncidentSeverity,
    type: 'maintenance' as IncidentType,
    location: undefined,
    priority: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    fetchIncident();
  }, []);

  const fetchIncident = async () => {
    try {
      const data = await incidentService.getIncident(String(id));
      setIncident({
        id: data.id,
        title: data.title,
        description: data.description,
        status: data.status as IncidentStatus,
        type: data.type as IncidentType,
        severity: data.severity as IncidentSeverity,
        reporterId: data.reporterId,
        location: data.location ? {
            buildingId: data.location.buildingId,
            floorId: data.location.floorId,
            coordinates: {
              latitude: data.location.x,
              longitude: data.location.y
            },
            description: data.location.description
          } : undefined,
        mediaUrls: data.mediaUrls,
        assignedTo: data.assignedTo?.name || '',
        updatedAt: data.updatedAt?.toDate() || new Date()
      });
      setFormData({
        ...formData,
        title: data.title,
        description: data.description,
        status: data.status as IncidentStatus,
        severity: data.severity,
        type: data.type as IncidentType,
        location: data.location ? {
          buildingId: data.location.buildingId,
          floorId: data.location.floorId,
          x: data.location.x,
          y: data.location.y,
          description: data.location.description
        } : undefined,
        priority: formData.priority

      });
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to fetch incident details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }
    
    if (!formData.status) {
      setError('Status is required');
      return;
    }

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    setError(null);
    setIsUpdating(true);

    try {
      await incidentService.updateIncident(String(id), formData);
      Alert.alert('Success', 'Incident updated successfully');
      router.back();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update incident');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back-outline" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Update Incident</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <TextInput
            style={[styles.input, { borderColor: colors.border }]}
            placeholder="Description"
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            multiline
            numberOfLines={4}
          />

          <View style={styles.selectContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Status</Text>
            <View style={[styles.select, { borderColor: colors.border }]}>
              <Text style={styles.selectText}>{formData.status || 'Select status'}</Text>
            </View>
          </View>

          <View style={styles.selectContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Priority</Text>
            <View style={[styles.select, { borderColor: colors.border }]}>
              <Text style={styles.selectText}>{formData.priority || 'Select priority'}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={handleUpdate}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Update Incident</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
  
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    padding: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.tint,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  form: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  selectContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  select: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  selectText: {
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: Colors.light.tint,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});