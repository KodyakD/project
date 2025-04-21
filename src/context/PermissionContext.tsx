// filepath: mobile-app/project/src/context/PermissionContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as Camera from 'expo-camera';

interface PermissionState {
  location: {
    foreground: boolean;
    background: boolean;
  };
  notifications: boolean;
  camera: boolean;
}

interface PermissionContextType {
  permissions: PermissionState;
  requestLocationPermission: () => Promise<boolean>;
  requestNotificationPermission: () => Promise<boolean>;
  requestCameraPermission: () => Promise<boolean>;
}

const PermissionContext = createContext<PermissionContextType>({
  permissions: {
    location: { foreground: false, background: false },
    notifications: false,
    camera: false,
  },
  requestLocationPermission: async () => false,
  requestNotificationPermission: async () => false,
  requestCameraPermission: async () => false,
});

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [permissions, setPermissions] = useState<PermissionState>({
    location: { foreground: false, background: false },
    notifications: false,
    camera: false,
  });

  const checkPermissions = async () => {
    // Check location permissions
    const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();
    const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();
    
    // Check notification permissions
    const { status: notificationStatus } = await Notifications.getPermissionsAsync();
    
    // Check camera permissions
    const { status: cameraStatus } = await Camera.getCameraPermissionsAsync();
    
    setPermissions({
      location: {
        foreground: foregroundStatus === 'granted',
        background: backgroundStatus === 'granted',
      },
      notifications: notificationStatus === 'granted',
      camera: cameraStatus === 'granted',
    });
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      let backgroundStatus = { status: 'undetermined' };
      
      if (foregroundStatus === 'granted') {
        backgroundStatus = await Location.requestBackgroundPermissionsAsync();
      }
      
      setPermissions(prev => ({
        ...prev,
        location: {
          foreground: foregroundStatus === 'granted',
          background: backgroundStatus.status === 'granted',
        }
      }));
      
      return foregroundStatus === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      
      setPermissions(prev => ({
        ...prev,
        notifications: status === 'granted',
      }));
      
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      
      setPermissions(prev => ({
        ...prev,
        camera: status === 'granted',
      }));
      
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return false;
    }
  };

  return (
    <PermissionContext.Provider
      value={{
        permissions,
        requestLocationPermission,
        requestNotificationPermission,
        requestCameraPermission,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => useContext(PermissionContext);