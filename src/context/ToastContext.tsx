import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from './ThemeContext';

// Types
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  message: string;
  description?: string;
  type?: ToastType;
  duration?: number;
  position?: 'top' | 'bottom';
  action?: {
    text: string;
    onPress: () => void;
  };
  onClose?: () => void;
}

// Context
interface ToastContextType {
  showToast: (options: ToastOptions) => void;
  hideToast: (callback?: () => void) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Provider Component
export const ToastProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<ToastOptions>({ 
    message: '',
    type: 'info',
    duration: 3000
  });
  
  // Fixed insets that work on most devices rather than using useSafeAreaInsets
  const FIXED_INSETS = { top: 50, bottom: 34 };
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  const { colors } = useTheme();
  
  const showToast = (newOptions: ToastOptions) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (visible) {
      hideToast(() => {
        setTimeout(() => {
          displayToast(newOptions);
        }, 300);
      });
    } else {
      displayToast(newOptions);
    }
  };

  const displayToast = (newOptions: ToastOptions) => {
    const mergedOptions = {
      ...options,
      ...newOptions,
    };
    setOptions(mergedOptions);

    slideAnim.setValue(mergedOptions.position === 'top' ? -100 : 100);

    setVisible(true);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    if (mergedOptions.duration && mergedOptions.duration > 0) {
      timeoutRef.current = setTimeout(() => {
        hideToast();
      }, mergedOptions.duration);
    }
  };

  const hideToast = (callback?: () => void) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: options.position === 'top' ? -100 : 100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      options.onClose?.();
      callback?.();
    });
  };
  
  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      
      {visible && (
        <View
          style={[
            styles.safeArea,
            options.position === 'top'
              ? { top: FIXED_INSETS.top }
              : { bottom: FIXED_INSETS.bottom },
          ]}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[
              styles.container,
              {
                backgroundColor: getToastBackgroundColor(),
                borderColor: getToastColor(),
                transform: [{ translateY: slideAnim }],
                opacity: fadeAnim,
              },
              options.position === 'top'
                ? styles.containerTop
                : styles.containerBottom,
            ]}
          >
            <View style={styles.iconContainer}>{getToastIcon()}</View>

            <View style={styles.contentContainer}>
              <Text style={[styles.message, { color: colors.text }]}>
                {options.message}
              </Text>

              {options.description && (
                <Text style={[styles.description, { color: colors.textSecondary }]}>
                  {options.description}
                </Text>
              )}

              {options.action && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    options.action?.onPress();
                    hideToast();
                  }}
                >
                  <Text style={[styles.actionText, { color: getToastColor() }]}>
                    {options.action.text}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={() => hideToast()}>
              <Feather name="x" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </ToastContext.Provider>
  );
  
  function getToastIcon() {
    const iconSize = 20;
    const iconColor = getToastColor();

    switch (options.type) {
      case 'success':
        return <Feather name="check-circle" size={iconSize} color={iconColor} />;
      case 'error':
        return <Feather name="alert-circle" size={iconSize} color={iconColor} />;
      case 'warning':
        return <Feather name="alert-triangle" size={iconSize} color={iconColor} />;
      case 'info':
      default:
        return <Feather name="info" size={iconSize} color={iconColor} />;
    }
  }

  function getToastColor() {
    switch (options.type) {
      case 'success':
        return colors.success;
      case 'error':
        return colors.error;
      case 'warning':
        return colors.warning;
      case 'info':
      default:
        return colors.info;
    }
  }

  function getToastBackgroundColor() {
    const baseColor = getToastColor();
    return Platform.OS === 'ios' 
      ? `${baseColor}15` 
      : `${baseColor}10`;
  }
};

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'box-none',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    maxWidth: 500,
    width: '100%',
  },
  containerTop: {
    marginTop: 16,
  },
  containerBottom: {
    marginBottom: 16,
  },
  iconContainer: {
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
  },
  description: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
  actionButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});