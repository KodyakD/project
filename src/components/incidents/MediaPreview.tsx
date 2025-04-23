import React from 'react';
import { 
  View, 
  Image, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Text 
} from 'react-native';
import { Video } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';

interface MediaItem {
  uri: string;
  type: 'image' | 'video';
}

interface MediaPreviewProps {
  media: MediaItem[];
  onRemove: (index: number) => void;
}

const MediaPreview: React.FC<MediaPreviewProps> = ({ media, onRemove }) => {
  if (!media.length) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {media.map((item, index) => (
          <View key={item.uri} style={styles.mediaItem}>
            {item.type === 'image' ? (
              <Image
                source={{ uri: item.uri }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
            ) : (
              <Video
                source={{ uri: item.uri }}
                style={styles.thumbnail}
                resizeMode="cover"
                useNativeControls={false}
                isLooping={false}
                shouldPlay={false}
                isMuted={true}
              />
            )}
            <View style={styles.iconOverlay}>
              <MaterialIcons 
                name={item.type === 'image' ? 'photo' : 'videocam'} 
                size={18} 
                color="#FFFFFF" 
              />
            </View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => onRemove(index)}
            >
              <MaterialIcons name="close" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      <Text style={styles.mediaCount}>
        {media.length} {media.length === 1 ? 'attachment' : 'attachments'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  scrollContent: {
    paddingVertical: 8,
  },
  mediaItem: {
    width: 100,
    height: 100,
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F0F0',
  },
  iconOverlay: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 4,
    padding: 4,
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaCount: {
    marginTop: 8,
    marginLeft: 4,
    fontSize: 14,
    color: '#666666',
  },
});

export default MediaPreview; 