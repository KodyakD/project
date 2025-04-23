import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
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
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useLocation } from '@/services/locationService';
import { createIncident, IncidentSeverity, IncidentStatus } from '@/services/incidentService';
import { uploadIncidentMedia } from '@/services/mediaService';
import { FloorType } from '@/types/map.types';
import { FLOORS } from '@/constants/floors';
import MediaPreview from '@/components/incidents/MediaPreview';
import { auth } from '@/config/firebase';
import Colors from '@/constants/Colors';

interface RouteParams {
  initialFloor?: FloorType;
  initialX?: number;
  initialY?: number;
}

const ReportIncidentScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { initialFloor, initialX, initialY } = route.params as RouteParams || {};
  const { floor, location } = useLocation();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFloor, setSelectedFloor] = useState<FloorType>(initialFloor || floor);
  const [coordinates, setCoordinates] = useState<{ x: number, y: number } | null>(
    initialX && initialY ? { x: initialX, y: initialY } : null
  );
  const [severity, setSeverity] = useState<IncidentSeverity>('medium');
  const [media, setMedia] = useState<Array<{ uri: string, type: 'image' | 'video' }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // Check for camera permissions
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'We need camera access to allow you to capture incident photos or videos.'
        );
      }
    })();
  }, []);
  
  // Validation function
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!title.trim()) {
      newErrors.title = 'Incident title is required';
    } else if (title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }
    
    if (!description.trim()) {
      newErrors.description = 'Incident description is required';
    } else if (description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }
    
    if (!coordinates) {
      newErrors.location = 'Please select a location on the map';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Pick image from camera
  const takePicture = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        setMedia([...media, { uri: result.assets[0].uri, type: 'image' }]);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    }
  };
  
  // Pick video from camera
  const takeVideo = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        quality: 0.8,
        allowsEditing: true,
        aspect: [16, 9],
        videoMaxDuration: 60,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        setMedia([...media, { uri: result.assets[0].uri, type: 'video' }]);
      }
    } catch (error) {
      console.error('Error taking video:', error);
      Alert.alert('Error', 'Failed to take video. Please try again.');
    }
  };
  
  // Pick image from gallery
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        setMedia([...media, { uri: result.assets[0].uri, type: 'image' }]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };
  
  // Open map for location selection
  const selectLocationOnMap = () => {
    navigation.navigate('LocationPicker', {
      onLocationSelected: (floor: FloorType, x: number, y: number) => {
        setSelectedFloor(floor);
        setCoordinates({ x, y });
      },
      initialFloor: selectedFloor,
    });
  };
  
  // Remove media item
  const removeMedia = (index: number) => {
    const updatedMedia = [...media];
    updatedMedia.splice(index, 1);
    setMedia(updatedMedia);
  };
  
  // Submit the incident report
  const submitIncident = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsUploading(true);
    try {
      // Upload media files if any
      const mediaUrls: string[] = [];
      if (media.length > 0) {
        for (const item of media) {
          const url = await uploadIncidentMedia(item.uri, item.type);
          if (url) {
            mediaUrls.push(url);
          }
        }
      }
      
      // Create the incident
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const incidentData = {
        title,
        description,
        location: {
          coordinates: coordinates || undefined,
          floor: selectedFloor,
        },
        severity,
        status: 'reported' as IncidentStatus,
        reportedBy: user.uid,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
      };
      
      const incidentId = await createIncident(incidentData);
      
      if (incidentId) {
        Alert.alert(
          'Incident Reported',
          'Your incident has been successfully reported.',
          [
            { 
              text: 'View Incidents', 
              onPress: () => navigation.navigate('IncidentsList') 
            },
            { 
              text: 'OK', 
              onPress: () => navigation.goBack() 
            }
          ]
        );
      } else {
        throw new Error('Failed to create incident');
      }
    } catch (error) {
      console.error('Error reporting incident:', error);
      Alert.alert('Error', 'Failed to report incident. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };
  
  // Get selected floor name
  const getFloorName = (floorId: FloorType) => {
    const floor = FLOORS.find(f => f.id === floorId);
    return floor ? floor.fullName : floorId;
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formContainer}>
            <Text style={styles.title}>Report an Incident</Text>
            
            {/* Title Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title*</Text>
              <TextInput
                style={[styles.input, errors.title ? styles.inputError : null]}
                placeholder="Brief title of the incident"
                value={title}
                onChangeText={setTitle}
                maxLength={50}
              />
              {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}
            </View>
            
            {/* Description Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description*</Text>
              <TextInput
                style={[styles.inputMultiline, errors.description ? styles.inputError : null]}
                placeholder="Detailed description of the incident"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                maxLength={500}
              />
              {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}
            </View>
            
            {/* Severity Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Severity</Text>
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
            
            {/* Location Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location*</Text>
              <TouchableOpacity 
                style={[styles.locationButton, errors.location ? styles.inputError : null]}
                onPress={selectLocationOnMap}
              >
                <MaterialIcons name="place" size={22} color="#0066CC" style={styles.locationIcon} />
                <Text style={styles.locationText}>
                  {coordinates 
                    ? `Floor: ${getFloorName(selectedFloor)} (x: ${Math.round(coordinates.x)}, y: ${Math.round(coordinates.y)})` 
                    : "Select location on map"}
                </Text>
              </TouchableOpacity>
              {errors.location ? <Text style={styles.errorText}>{errors.location}</Text> : null}
            </View>
            
            {/* Media Attachments */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Attachments ({media.length})</Text>
              <View style={styles.mediaButtons}>
                <TouchableOpacity style={styles.mediaButton} onPress={takePicture}>
                  <FontAwesome5 name="camera" size={20} color="#FFFFFF" />
                  <Text style={styles.mediaButtonText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.mediaButton} onPress={takeVideo}>
                  <FontAwesome5 name="video" size={20} color="#FFFFFF" />
                  <Text style={styles.mediaButtonText}>Record Video</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.mediaButton} onPress={pickImage}>
                  <FontAwesome5 name="images" size={20} color="#FFFFFF" />
                  <Text style={styles.mediaButtonText}>Gallery</Text>
                </TouchableOpacity>
              </View>
              
              {/* Media Preview */}
              {media.length > 0 && (
                <MediaPreview media={media} onRemove={removeMedia} />
              )}
            </View>
            
            {/* Submit Button */}
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={submitIncident}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <MaterialIcons name="send" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Submit Report</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 16,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333333',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  inputMultiline: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    height: 120,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FAFAFA',
  },
  locationIcon: {
    marginRight: 8,
  },
  locationText: {
    fontSize: 16,
    color: '#333333',
  },
  mediaButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066CC',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginHorizontal: 4,
  },
  mediaButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 14,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 8,
  },
});

export default ReportIncidentScreen; 