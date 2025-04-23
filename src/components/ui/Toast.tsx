import React, { createContext, useContext, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertCircle,
  CheckCircle2,
  Info,
  X,
  AlertTriangle,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

// Types
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  type?: ToastType;
  message: string;
  description?: string;
  duration?: number;
  onClose?: () => void;
  position?: 'top' | 'bottom';
  action?: {
    text: string;
    onPress: () => void;
  };
}

// Context
interface ToastContextType {
  showToast: (options: ToastOptions) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
  hideToast: () => {},
});

export const useToast = () => useContext(ToastContext);

// Provider Component
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<ToastOptions>({
    message: '',
    type: 'info',
    duration: 3000,
    position: 'top',
  });
  
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(
    new Animated.Value(options.position === 'top' ? -100 : 100)
  ).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (newOptions: ToastOptions) => {
    // Cancel any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // If toast is already visible, hide it first
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
    // Update options
    const mergedOptions = {
      ...options,
      ...newOptions,
    };
    setOptions(mergedOptions);
    
    // Reset animation values
    slideAnim.setValue(mergedOptions.position === 'top' ? -100 : 100);
    
    // Show the toast
    setVisible(true);
    
    // Animate in
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
    
    // Auto-hide after duration if set
    if (mergedOptions.duration && mergedOptions.duration > 0) {
      timeoutRef.current = setTimeout(() => {
        hideToast();
      }, mergedOptions.duration);
    }
  };

  const hideToast = (callback?: () => void) => {
    // Cancel any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Animate out
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

  const getToastIcon = () => {
    const iconSize = 20;
    const iconColor = getToastColor();
    
    switch (options.type) {
      case 'success':
        return <CheckCircle2 size={iconSize} color={iconColor} />;
      case 'error':
        return <AlertCircle size={iconSize} color={iconColor} />;
      case 'warning':
        return <AlertTriangle size={iconSize} color={iconColor} />;
      case 'info':
      default:
        return <Info size={iconSize} color={iconColor} />;
    }
  };

  const getToastColor = () => {
    switch (options.type) {
      case 'success':
        return colors.success || '#10b981';
      case 'error':
        return colors.error || '#ef4444';
      case 'warning':
        return colors.warning || '#f59e0b';
      case 'info':
      default:
        return colors.info || '#3b82f6';
    }
  };

  const getToastBackgroundColor = () => {
    const baseColor = getToastColor();
    // Create a lighter version for the background
    return Platform.OS === 'ios' 
      ? `${baseColor}15` // 15% opacity (iOS)
      : `${baseColor}10`; // 10% opacity (Android)
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      
      {visible && (
        <SafeAreaView 
          style={[
            styles.safeArea, 
            options.position === 'top' 
              ? { top: insets.top } 
              : { bottom: insets.bottom }
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
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </Animated.View>
        </SafeAreaView>
      )}
    </ToastContext.Provider>
  );
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