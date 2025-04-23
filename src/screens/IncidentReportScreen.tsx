import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { 
  createIncident, 
  IncidentType, 
  IncidentSeverity 
} from '../services/incidentService';
import { MediaPicker } from '../components/MediaPicker';
import { LocationSelector } from '../components/LocationSelector';
import { theme } from '../styles/theme';

interface IncidentReportScreenParams {
  buildingId?: string;
  floorId?: string;
  x?: number;
  y?: number;
  locationDescription?: string;
}

export const IncidentReportScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as IncidentReportScreenParams || {};

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<IncidentType>('maintenance');
  const [severity, setSeverity] = useState<IncidentSeverity>('medium');
  const [location, setLocation] = useState({
    buildingId: params.buildingId || '',
    floorId: params.floorId || '',
    x: params.x || 0,
    y: params.y || 0,
    description: params.locationDescription || ''
  });
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation state
  const [errors, setErrors] = useState({
    title: '',
    description: '',
    location: ''
  });

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      title: '',
      description: '',
      location: ''
    };

    if (!title.trim()) {
      newErrors.title = 'Title is required';
      isValid = false;
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
      isValid = false;
    }

    if (!location.buildingId || !location.floorId) {
      newErrors.location = 'Location is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Create incident object
      const incident = {
        title,
        description,
        type,
        severity,
        status: 'reported' as const,
        location,
        mediaUrls
      };

      // Call service to create incident
      const incidentId = await createIncident(incident);
      
      // Show success message
      Alert.alert(
        'Success',
        'Incident reported successfully',
        [
          { 
            text: 'View Details', 
            onPress: () => navigation.navigate('IncidentDetail', { incidentId }) 
          },
          { 
            text: 'Report Another', 
            onPress: () => {
              setTitle('');
              setDescription('');
              setMediaUrls([]);
              // Keep location, type and severity as they were
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error submitting incident:', error);
      Alert.alert('Error', 'Failed to submit incident. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMediaChange = (urls: string[]) => {
    setMediaUrls(urls);
  };

  const handleLocationSelect = (newLocation: {
    buildingId: string;
    floorId: string;
    x: number;
    y: number;
    description?: string;
  }) => {
    setLocation(newLocation);
    setErrors(prev => ({ ...prev, location: '' }));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Report an Incident</Text>
        
        {/* Title input */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={[styles.input, errors.title ? styles.inputError : null]}
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              if (text.trim()) setErrors(prev => ({ ...prev, title: '' }));
            }}
            placeholder="Brief title of the incident"
          />
          {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}
        </View>
        
        {/* Description input */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.textArea, errors.description ? styles.inputError : null]}
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              if (text.trim()) setErrors(prev => ({ ...prev, description: '' }));
            }}
            placeholder="Describe the incident in detail"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}
        </View>
        
        {/* Incident type picker */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Incident Type *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={type}
              onValueChange={(itemValue) => setType(itemValue as IncidentType)}
              style={styles.picker}
            >
              <Picker.Item label="Maintenance" value="maintenance" />
              <Picker.Item label="Security" value="security" />
              <Picker.Item label="Safety" value="safety" />
              <Picker.Item label="Environmental" value="environmental" />
              <Picker.Item label="Other" value="other" />
            </Picker>
          </View>
        </View>
        
        {/* Severity picker */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Severity *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={severity}
              onValueChange={(itemValue) => setSeverity(itemValue as IncidentSeverity)}
              style={styles.picker}
            >
              <Picker.Item label="Low" value="low" />
              <Picker.Item label="Medium" value="medium" />
              <Picker.Item label="High" value="high" />
              <Picker.Item label="Critical" value="critical" />
            </Picker>
          </View>
        </View>
        
        {/* Location selector */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Location *</Text>
          <LocationSelector 
            initialLocation={location}
            onLocationSelected={handleLocationSelect}
          />
          {errors.location ? <Text style={styles.errorText}>{errors.location}</Text> : null}
        </View>
        
        {/* Media picker */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Media (Optional)</Text>
          <MediaPicker 
            mediaUrls={mediaUrls}
            onChange={handleMediaChange}
            maxFiles={5}
          />
        </View>
        
        {/* Submit button */}
        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting ? styles.submitButtonDisabled : null]} 
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Report</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  scrollContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: theme.colors.primary
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
    color: theme.colors.text
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: theme.colors.surface,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  textArea: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    backgroundColor: theme.colors.surface,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden'
  },
  picker: {
    height: 50,
    width: '100%',
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 14,
    marginTop: 4
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40
  },
  submitButtonDisabled: {
    opacity: 0.7
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  }
}); 