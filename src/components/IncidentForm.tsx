import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Image,
  ActivityIndicator
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { LocationSelector } from './LocationSelector';
import incidentService from '../services/incidentService';
import userService from '../services/userService';
import mediaService from '../services/mediaService';
import { Incident, IncidentType, IncidentSeverity } from '../types/incident';

interface IncidentFormProps {
  onSubmit?: (incident: Incident) => void;
  onCancel?: () => void;
  initialData?: Partial<Incident>;
}

const IncidentForm: React.FC<IncidentFormProps> = ({ 
  onSubmit, 
  onCancel,
  initialData = {} 
}) => {
  // Form state
  const [title, setTitle] = useState(initialData.title || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [type, setType] = useState<IncidentType>(initialData.type || 'maintenance');
  const [severity, setSeverity] = useState<IncidentSeverity>(initialData.severity || 'medium');
  const [location, setLocation] = useState(initialData.location || null);
  const [media, setMedia] = useState<Array<{uri: string, type: 'image' | 'video', uploaded?: boolean}>>(
    initialData.mediaUrls?.map(url => ({uri: url, type: 'image', uploaded: true})) || []
  );
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [locationSelectorVisible, setLocationSelectorVisible] = useState(false);

  // Get current user info
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const user = await userService.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    
    fetchUserInfo();
  }, []);
  
  // Request permissions for camera and image library
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        if (cameraStatus !== 'granted') {
          Alert.alert('Permission Required', 'Camera permission is required to capture photos and videos.');
        }
        
        const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (libraryStatus !== 'granted') {
          Alert.alert('Permission Required', 'Media library permission is required to select photos and videos.');
        }
      }
    })();
  }, []);
  
  // Validate form before submission
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }
    
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!location) {
      newErrors.location = 'Location is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle image capture from camera
  const handleCaptureImage = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setMedia([...media, { uri: result.assets[0].uri, type: 'image' }]);
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      Alert.alert('Error', 'Failed to capture image');
    }
  };
  
  // Handle video capture from camera
  const handleCaptureVideo = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        videoMaxDuration: 60,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setMedia([...media, { uri: result.assets[0].uri, type: 'video' }]);
      }
    } catch (error) {
      console.error('Error capturing video:', error);
      Alert.alert('Error', 'Failed to capture video');
    }
  };
  
  // Select images from gallery
  const handleSelectFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        selectionLimit: 5,
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newMedia = result.assets.map(asset => ({
          uri: asset.uri,
          type: asset.type === 'video' ? 'video' as const : 'image' as const
        }));
        
        setMedia([...media, ...newMedia]);
      }
    } catch (error) {
      console.error('Error selecting from gallery:', error);
      Alert.alert('Error', 'Failed to select media from gallery');
    }
  };
  
  // Remove media item
  const handleRemoveMedia = (index: number) => {
    const updatedMedia = [...media];
    updatedMedia.splice(index, 1);
    setMedia(updatedMedia);
  };
  
  // Get current location (GPS coordinates)
  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is required to detect your current location.');
        setLoading(false);
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      
      // This is a simplified version - in a real app, you would use
      // the coordinates to fetch the building/floor information from your backend
      Alert.alert(
        'Current Location',
        `Coordinates detected. Please use the location selector to choose a specific indoor location.`,
        [
          { text: 'OK', onPress: () => setLocationSelectorVisible(true) }
        ]
      );
      
      setLoading(false);
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Failed to get current location');
      setLoading(false);
    }
  };
  
  // Handle location selection
  const handleLocationSelect = (newLocation: any) => {
    setLocation(newLocation);
    setLocationSelectorVisible(false);
  };
  
  // Submit the incident
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Upload media files first
      const mediaUrls = [];
      
      for (const item of media) {
        if (!item.uploaded) { // Only upload new media
          const url = await mediaService.uploadMedia(item.uri, item.type);
          mediaUrls.push(url);
        } else {
          mediaUrls.push(item.uri);
        }
      }
      
      // Create incident object
      const incident: Partial<Incident> = {
        title,
        description,
        type,
        severity,
        location,
        mediaUrls,
        status: 'open',
        reportedBy: currentUser?.id,
        reportedAt: new Date().toISOString(),
      };
      
      // Submit incident
      const createdIncident = await incidentService.createIncident(incident);
      
      setLoading(false);
      
      // Call onSubmit callback if provided
      if (onSubmit) {
        onSubmit(createdIncident);
      }
      
      // Show success message
      Alert.alert(
        'Success',
        'Incident reported successfully',
        [{ text: 'OK' }]
      );
      
      // Reset form
      setTitle('');
      setDescription('');
      setType('maintenance');
      setSeverity('medium');
      setLocation(null);
      setMedia([]);
      
    } catch (error) {
      console.error('Error submitting incident:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to submit incident report');
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        {/* Title input */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Title*</Text>
          <TextInput
            style={[styles.input, errors.title ? styles.inputError : null]}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter incident title"
            maxLength={100}
          />
          {errors.title ? (
            <Text style={styles.errorText}>{errors.title}</Text>
          ) : null}
        </View>
        
        {/* Description input */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Description*</Text>
          <TextInput
            style={[styles.textArea, errors.description ? styles.inputError : null]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the incident"
            multiline
            numberOfLines={4}
            maxLength={500}
          />
          {errors.description ? (
            <Text style={styles.errorText}>{errors.description}</Text>
          ) : null}
        </View>
        
        {/* Incident type selection */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Incident Type*</Text>
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
        
        {/* Incident severity selection */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Severity*</Text>
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
        
        {/* Location selection */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Location*</Text>
          <View style={[styles.locationContainer, errors.location ? styles.inputError : null]}>
            {location ? (
              <View style={styles.selectedLocation}>
                <Text style={styles.locationText}>
                  {`${location.building.name}, Floor ${location.floor.name}`}
                  {location.coordinates ? ` (${location.coordinates.x.toFixed(2)}, ${location.coordinates.y.toFixed(2)})` : ''}
                </Text>
                <TouchableOpacity 
                  onPress={() => setLocationSelectorVisible(true)} 
                  style={styles.changeButton}
                >
                  <Text style={styles.changeButtonText}>Change</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.locationButtons}>
                <TouchableOpacity 
                  style={styles.locationButton}
                  onPress={() => setLocationSelectorVisible(true)}
                >
                  <Ionicons name="map-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.locationButtonText}>Select Location</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.locationButton}
                  onPress={getCurrentLocation}
                >
                  <Ionicons name="locate-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.locationButtonText}>Current Location</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          {errors.location ? (
            <Text style={styles.errorText}>{errors.location}</Text>
          ) : null}
        </View>
        
        {/* Media capture and display */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Media</Text>
          <View style={styles.mediaButtons}>
            <TouchableOpacity 
              style={styles.mediaButton}
              onPress={handleCaptureImage}
            >
              <Ionicons name="camera-outline" size={18} color={COLORS.white} />
              <Text style={styles.mediaButtonText}>Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.mediaButton}
              onPress={handleCaptureVideo}
            >
              <Ionicons name="videocam-outline" size={18} color={COLORS.white} />
              <Text style={styles.mediaButtonText}>Video</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.mediaButton}
              onPress={handleSelectFromGallery}
            >
              <Ionicons name="images-outline" size={18} color={COLORS.white} />
              <Text style={styles.mediaButtonText}>Gallery</Text>
            </TouchableOpacity>
          </View>
          
          {/* Media preview */}
          {media.length > 0 && (
            <View style={styles.mediaPreviewContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {media.map((item, index) => (
                  <View key={`${item.uri}-${index}`} style={styles.mediaPreview}>
                    <Image source={{ uri: item.uri }} style={styles.previewImage} />
                    <TouchableOpacity 
                      style={styles.removeMediaButton}
                      onPress={() => handleRemoveMedia(index)}
                    >
                      <Ionicons name="close-circle" size={24} color={COLORS.error} />
                    </TouchableOpacity>
                    {item.type === 'video' && (
                      <View style={styles.videoIndicator}>
                        <Ionicons name="videocam" size={16} color={COLORS.white} />
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
        
        {/* Submit and cancel buttons */}
        <View style={styles.buttonGroup}>
          {onCancel && (
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.button, styles.submitButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.submitButtonText}>Submit Report</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Location selector modal */}
      {locationSelectorVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Location</Text>
              <TouchableOpacity onPress={() => setLocationSelectorVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <LocationSelector
              value={location}
              onChange={handleLocationSelect}
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  form: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: COLORS.text,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginTop: 4,
  },
  pickerContainer: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  locationContainer: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
  },
  locationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    flex: 0.48,
    justifyContent: 'center',
  },
  locationButtonText: {
    color: COLORS.primary,
    marginLeft: 8,
    fontWeight: '500',
  },
  selectedLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
  },
  changeButton: {
    marginLeft: 8,
    padding: 6,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
  },
  changeButtonText: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  mediaButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 8,
    flex: 0.3,
    justifyContent: 'center',
  },
  mediaButtonText: {
    color: COLORS.white,
    marginLeft: 6,
    fontWeight: '500',
  },
  mediaPreviewContainer: {
    marginTop: 8,
  },
  mediaPreview: {
    position: 'relative',
    width: 100,
    height: 100,
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeMediaButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
  },
  videoIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 4,
    borderRadius: 4,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.lightGray,
    flex: 0.48,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    flex: onCancel ? 0.48 : 1,
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: COLORS.background,
    width: '90%',
    height: '80%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
});

export default IncidentForm; 