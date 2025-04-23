import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DeepLinkTester from '../../utils/deepLinkTester';
import notificationService from '../../services/notificationService';
import { COLORS } from '../../constants';

const DeepLinkTestScreen: React.FC = () => {
  const router = useRouter();
  const [customPath, setCustomPath] = useState('');
  const [showQrCode, setShowQrCode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const exampleLinks = DeepLinkTester.getExampleDeepLinks();

  const handleCustomPathTest = async () => {
    if (!customPath) return;
    await DeepLinkTester.testDeepLink(customPath);
  };

  const handleExampleLinkPress = async (path: string) => {
    await DeepLinkTester.testDeepLink(path);
  };

  const generateQrCode = (path: string) => {
    const url = DeepLinkTester.getQRCodeURL(path);
    setQrCodeUrl(url);
    setShowQrCode(true);
  };

  const testNotification = async (type: string) => {
    // Generate a random ID for testing
    const id = Math.floor(Math.random() * 1000).toString();
    
    // Create mock notification data
    const title = `Test ${type.charAt(0).toUpperCase() + type.slice(1)} Notification`;
    const body = `This is a test notification for ${type} with ID ${id}`;
    const data: Record<string, any> = { type };
    
    // Add appropriate ID field based on type
    switch (type) {
      case 'emergency':
        data.emergencyId = id;
        break;
      case 'incident_updated':
        data.incidentId = id;
        break;
      case 'maintenance_alert':
        data.maintenanceId = id;
        break;
      case 'system_announcement':
        data.announcementId = id;
        break;
    }
    
    // Show a local notification
    await notificationService.showLocalNotification(title, body, data);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deep Link Tester</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Custom Deep Link</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={customPath}
              onChangeText={setCustomPath}
              placeholder="Enter path (e.g. /incidents/123)"
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={styles.button}
              onPress={handleCustomPathTest}
              disabled={!customPath}
            >
              <Text style={styles.buttonText}>Test</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.button, styles.qrButton]}
            onPress={() => generateQrCode(customPath)}
            disabled={!customPath}
          >
            <Ionicons name="qr-code" size={16} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Generate QR</Text>
          </TouchableOpacity>
        </View>

        {showQrCode && (
          <View style={styles.qrContainer}>
            <Text style={styles.qrTitle}>Scan this QR code to test your deep link</Text>
            <Image source={{ uri: qrCodeUrl }} style={styles.qrCode} />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowQrCode(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Example Deep Links</Text>
          <FlatList
            data={exampleLinks}
            keyExtractor={(item) => item.path}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.linkItem}
                onPress={() => handleExampleLinkPress(item.path)}
              >
                <Text style={styles.linkText}>{item.name}</Text>
                <Text style={styles.linkPath}>{item.path}</Text>
                <Ionicons name="open-outline" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Notifications</Text>
          <View style={styles.notificationButtons}>
            <TouchableOpacity
              style={[styles.notificationButton, { backgroundColor: COLORS.error }]}
              onPress={() => testNotification('emergency')}
            >
              <Ionicons name="warning" size={20} color="#fff" />
              <Text style={styles.notificationButtonText}>Emergency</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.notificationButton, { backgroundColor: COLORS.primary }]}
              onPress={() => testNotification('incident_updated')}
            >
              <Ionicons name="alert-circle" size={20} color="#fff" />
              <Text style={styles.notificationButtonText}>Incident</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.notificationButton, { backgroundColor: COLORS.warning }]}
              onPress={() => testNotification('maintenance_alert')}
            >
              <Ionicons name="construct" size={20} color="#fff" />
              <Text style={styles.notificationButtonText}>Maintenance</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.notificationButton, { backgroundColor: COLORS.info }]}
              onPress={() => testNotification('system_announcement')}
            >
              <Ionicons name="megaphone" size={20} color="#fff" />
              <Text style={styles.notificationButtonText}>Announcement</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    color: COLORS.dark,
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: COLORS.dark,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    marginRight: 8,
    fontSize: 16,
    color: COLORS.dark,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.secondary,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  linkText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.dark,
    flex: 1,
  },
  linkPath: {
    fontSize: 14,
    color: COLORS.textLight,
    flex: 1,
  },
  qrContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  qrTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
    color: COLORS.dark,
    textAlign: 'center',
  },
  qrCode: {
    width: 200,
    height: 200,
    marginBottom: 16,
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f2f2f2',
    borderRadius: 4,
  },
  closeButtonText: {
    color: COLORS.dark,
    fontWeight: '500',
  },
  notificationButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  notificationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 8,
    width: '48%',
  },
  notificationButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default DeepLinkTestScreen; 