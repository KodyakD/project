import React from 'react';
import { 
  Pressable, 
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity
} from 'react-native';
import { Sun, Moon, Monitor } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useTheme, ThemeType } from '../../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, isDark, colors, setTheme } = useTheme();
  const [modalVisible, setModalVisible] = React.useState(false);
  
  const iconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: withSequence(
            withTiming('0deg', { duration: 0 }),
            withDelay(
              150,
              withTiming(isDark ? '360deg' : '-360deg', {
                duration: 300,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
              })
            )
          ),
        },
        {
          scale: withSequence(
            withTiming(0.8, { duration: 150 }),
            withTiming(1, { duration: 150 })
          ),
        },
      ],
      opacity: withSequence(
        withTiming(0.5, { duration: 150 }),
        withTiming(1, { duration: 150 })
      ),
    };
  });

  const containerStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(
        isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        { duration: 200 }
      ),
    };
  });

  const toggleModal = () => {
    setModalVisible(!modalVisible);
  };

  const handleThemeChange = (newTheme: ThemeType) => {
    setTheme(newTheme);
    setModalVisible(false);
  };

  return (
    <>
      <Pressable onPress={toggleModal}>
        <Animated.View style={[styles.container, containerStyle]}>
          <Animated.View style={iconStyle}>
            {isDark ? (
              <Moon size={20} color={colors.text} />
            ) : (
              <Sun size={20} color={colors.text} />
            )}
          </Animated.View>
        </Animated.View>
      </Pressable>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable 
          style={styles.modalBackdrop}
          onPress={() => setModalVisible(false)}
        >
          <View 
            style={[
              styles.modalContent, 
              { backgroundColor: colors.cardBackground }
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Choose Theme
            </Text>
            
            <TouchableOpacity
              style={[
                styles.themeOption,
                theme === 'light' && styles.selectedOption,
                { borderColor: theme === 'light' ? colors.tint : colors.border }
              ]}
              onPress={() => handleThemeChange('light')}
            >
              <Sun size={20} color={theme === 'light' ? colors.tint : colors.text} />
              <Text 
                style={[
                  styles.themeOptionText, 
                  { color: theme === 'light' ? colors.tint : colors.text }
                ]}
              >
                Light
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.themeOption,
                theme === 'dark' && styles.selectedOption,
                { borderColor: theme === 'dark' ? colors.tint : colors.border }
              ]}
              onPress={() => handleThemeChange('dark')}
            >
              <Moon size={20} color={theme === 'dark' ? colors.tint : colors.text} />
              <Text 
                style={[
                  styles.themeOptionText, 
                  { color: theme === 'dark' ? colors.tint : colors.text }
                ]}
              >
                Dark
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.themeOption,
                theme === 'system' && styles.selectedOption,
                { borderColor: theme === 'system' ? colors.tint : colors.border }
              ]}
              onPress={() => handleThemeChange('system')}
            >
              <Monitor size={20} color={theme === 'system' ? colors.tint : colors.text} />
              <Text 
                style={[
                  styles.themeOptionText, 
                  { color: theme === 'system' ? colors.tint : colors.text }
                ]}
              >
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
  container: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginVertical: 6,
    borderWidth: 1,
    width: '100%',
  },
  selectedOption: {
    borderWidth: 2,
  },
  themeOptionText: {
    fontWeight: '500',
    marginLeft: 12,
    fontSize: 16,
  },
});