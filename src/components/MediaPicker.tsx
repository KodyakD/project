import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import storage from '@react-native-firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { theme } from '../constants/theme'; 

interface MediaPickerProps {
  mediaUrls: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
}

export const MediaPicker: React.FC<MediaPickerProps> = ({
  mediaUrls = [],
  onChange,
  maxFiles = 5
}) => {
  const [uploading, setUploading] = useState(false);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraPermission.status !== 'granted' || libraryPermission.status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant camera and media library permissions to use this feature.',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
    return true;
  };

  const compressImage = async (uri: string): Promise<string> => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      
      // If file size is less than 1MB, no need to compress
      if (fileInfo.size && fileInfo.size < 1024 * 1024) {
        return uri;
      }
      
      // Compress the image
      const compressedUri = await ImagePicker.manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }],
        { compress: 0.7, format: ImagePicker.SaveFormat.JPEG }
      );
      
      return compressedUri.uri;
    } catch (error) {
      console.error('Error compressing image:', error);
      // Return original if compression fails
      return uri;
    }
  };

  const uploadMedia = async (uri: string, mimeType: string): Promise<string> => {
    try {
      // For images, compress before uploading
      const finalUri = mimeType.startsWith('image/')
        ? await compressImage(uri)
        : uri;
      
      // Generate unique file name
      const extension = mimeType.split('/')[1];
      const fileName = `incidents/${uuidv4()}.${extension}`;
      
      // Create a reference to the Firebase Storage location
      const storageRef = storage().ref(fileName);
      
      // Upload file to Firebase Storage using React Native Firebase
      await storageRef.putFile(finalUri);
      
      // Get download URL
      const downloadUrl = await storageRef.getDownloadURL();
      return downloadUrl;
    } catch (error) {
      console.error('Error uploading media:', error);
      throw error;
    }
  };

  const handleTakePhoto = async () => {
    if (!(await requestPermissions())) return;
    
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        await handleUpload(result.assets[0].uri, 'image/jpeg');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleTakeVideo = async () => {
    if (!(await requestPermissions())) return;
    
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        videoMaxDuration: 60,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        await handleUpload(result.assets[0].uri, 'video/mp4');
      }
    } catch (error) {
      console.error('Error recording video:', error);
      Alert.alert('Error', 'Failed to record video. Please try again.');
    }
  };

  const handlePickMedia = async () => {
    if (!(await requestPermissions())) return;
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const mimeType = asset.type || (asset.uri.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg');
        await handleUpload(asset.uri, mimeType);
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Failed to select media. Please try again.');
    }
  };

  const handleUpload = async (uri: string, mimeType: string) => {
    if (mediaUrls.length >= maxFiles) {
      Alert.alert('Maximum Files', `You can only upload a maximum of ${maxFiles} files.`);
      return;
    }
    
    setUploading(true);
    try {
      const downloadUrl = await uploadMedia(uri, mimeType);
      onChange([...mediaUrls, downloadUrl]);
    } catch (error) {
      console.error('Error in handleUpload:', error);
      Alert.alert('Upload Error', 'Failed to upload media. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveMedia = (index: number) => {
    const newMediaUrls = [...mediaUrls];
    newMediaUrls.splice(index, 1);
    onChange(newMediaUrls);
  };

  const renderMediaItem = ({ item, index }: { item: string; index: number }) => {
    const isVideo = item.includes('video') || item.endsWith('.mp4');
    
    return (
      <View style={styles.mediaItem}>
        {isVideo ? (
          <View style={styles.videoThumbnail}>
            <Ionicons name="videocam" size={36} color={theme.colors.primary} />
            <Text style={styles.videoText}>Video</Text>
          </View>
        ) : (
          <Image source={{ uri: item }} style={styles.thumbnail} />
        )}
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveMedia(index)}
        >
          <Ionicons name="close-circle" size={24} color={theme.colors.error} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.mediaList}>
        {mediaUrls.length > 0 && (
          <FlatList
            data={mediaUrls}
            renderItem={renderMediaItem}
            keyExtractor={(item, index) => `media-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        )}
      </View>
      
      {uploading ? (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.uploadingText}>Uploading...</Text>
        </View>
      ) : (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleTakePhoto}
            disabled={mediaUrls.length >= maxFiles}
          >
            <Ionicons name="camera" size={24} color="white" />
            <Text style={styles.buttonText}>Take Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.button}
            onPress={handleTakeVideo}
            disabled={mediaUrls.length >= maxFiles}
          >
            <Ionicons name="videocam" size={24} color="white" />
            <Text style={styles.buttonText}>Record Video</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.button}
            onPress={handlePickMedia}
            disabled={mediaUrls.length >= maxFiles}
          >
            <Ionicons name="images" size={24} color="white" />
            <Text style={styles.buttonText}>Gallery</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {mediaUrls.length >= maxFiles && (
        <Text style={styles.maxFilesText}>
          Maximum of {maxFiles} files reached
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  mediaList: {
    minHeight: 100,
    marginBottom: 16,
  },
  mediaItem: {
    marginRight: 8,
    position: 'relative',
  },
  thumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  videoThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoText: {
    marginTop: 4,
    color: theme.colors.primary,
  },
  removeButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 10,
    flex: 1,
    marginHorizontal: 4,
  },
  buttonText: {
    color: 'white',
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  uploadingText: {
    marginLeft: 8,
    fontSize: 16,
    color: theme.colors.primary,
  },
  maxFilesText: {
    marginTop: 8,
    color: theme.colors.text,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});