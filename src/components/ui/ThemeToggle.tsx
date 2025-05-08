import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  Pressable 
} from 'react-native';
// Replace lucide imports with Expo Vector Icons
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, colors, setTheme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <TouchableOpacity 
        style={[styles.iconButton, { backgroundColor: colors.card }]} 
        onPress={() => setModalVisible(true)}
      >
        {theme === 'dark' ? (
          <Feather name="moon" size={20} color={colors.text} />
        ) : theme === 'light' ? (
          <Feather name="sun" size={20} color={colors.text} />
        ) : (
          <Feather name="monitor" size={20} color={colors.text} />
        )}
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Theme</Text>
            
            <TouchableOpacity
              style={[
                styles.themeOption,
                { borderColor: colors.border },
                theme === 'light' && [styles.selectedOption, { borderColor: colors.primary }],
              ]}
              onPress={() => {
                setTheme('light');
                setModalVisible(false);
              }}
            >
              <Feather name="sun" size={20} color={theme === 'light' ? colors.primary : colors.text} />
              <Text style={[
                styles.optionText, 
                { color: theme === 'light' ? colors.primary : colors.text }
              ]}>
                Light
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.themeOption,
                { borderColor: colors.border },
                theme === 'dark' && [styles.selectedOption, { borderColor: colors.primary }],
              ]}
              onPress={() => {
                setTheme('dark');
                setModalVisible(false);
              }}
            >
              <Feather name="moon" size={20} color={theme === 'dark' ? colors.primary : colors.text} />
              <Text style={[
                styles.optionText, 
                { color: theme === 'dark' ? colors.primary : colors.text }
              ]}>
                Dark
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.themeOption,
                { borderColor: colors.border },
                theme === 'system' && [styles.selectedOption, { borderColor: colors.primary }],
              ]}
              onPress={() => {
                setTheme('system');
                setModalVisible(false);
              }}
            >
              <Feather name="monitor" size={20} color={theme === 'system' ? colors.primary : colors.text} />
              <Text style={[
                styles.optionText, 
                { color: theme === 'system' ? colors.primary : colors.text }
              ]}>
                System
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginVertical: 6,
    borderWidth: 1,
  },
  selectedOption: {
    backgroundColor: 'rgba(225, 29, 72, 0.1)', // Emergency red with opacity
  },
  optionText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  },
});