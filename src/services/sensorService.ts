import { collection, doc, query, where, onSnapshot, getDocs, getDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { DeviceData, SensorReading } from '../types/device';

// Firestore collection references
const devicesCollection = collection(db, 'devices');
const readingsCollection = collection(db, 'readings');

/**
 * Get a sensor by ID
 */
export const getSensor = async (sensorId: string): Promise<DeviceData | null> => {
  try {
    const docRef = doc(devicesCollection, sensorId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name,
      deviceId: data.deviceId,
      type: data.type,
      status: data.status,
      value: data.value,
      unit: data.unit,
      timestamp: data.timestamp?.toMillis() || Date.now(),
      batteryLevel: data.batteryLevel,
      location: data.location,
      metadata: data.metadata,
    };
  } catch (error) {
    console.error('Error getting sensor:', error);
    return null;
  }
};

/**
 * Subscribe to real-time sensor updates
 */
export const subscribeSensor = (
  sensorId: string,
  callback: (data: DeviceData) => void
): (() => void) => {
  try {
    const docRef = doc(devicesCollection, sensorId);
    
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        callback({
          id: docSnap.id,
          name: data.name,
          deviceId: data.deviceId,
          type: data.type,
          status: data.status,
          value: data.value,
          unit: data.unit,
          timestamp: data.timestamp?.toMillis() || Date.now(),
          batteryLevel: data.batteryLevel,
          location: data.location,
          metadata: data.metadata,
        });
      }
    }, (error) => {
      console.error('Error watching sensor:', error);
    });
  } catch (error) {
    console.error('Error setting up sensor watcher:', error);
    return () => {};
  }
};

/**
 * Get sensor readings for a specific sensor
 */
export const getSensorReadings = async (
  sensorId: string,
  limit: number = 20
): Promise<SensorReading[]> => {
  try {
    const q = query(
      readingsCollection,
      where('deviceId', '==', sensorId),
      orderBy('timestamp', 'desc'),
      limit(limit)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        deviceId: data.deviceId,
        type: data.type,
        value: data.value,
        timestamp: data.timestamp?.toMillis() || Date.now(),
        unit: data.unit,
      };
    });
  } catch (error) {
    console.error('Error getting sensor readings:', error);
    return [];
  }
};

/**
 * Get mock sensor data (for development/testing)
 */
export const getSensorData = (sensorId: string): DeviceData => {
  // Generate random status
  const statusOptions: ('normal' | 'warning' | 'error' | 'alert' | 'offline')[] = 
    ['normal', 'normal', 'normal', 'warning', 'error', 'offline'];
  const randomStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];
  
  // Generate matching sensor type and value
  let sensorType = 'temperature';
  let value = 22;
  let unit = '°C';
  
  // Extract sensor type from ID if available
  if (sensorId.includes('temp')) {
    sensorType = 'temperature';
    value = Math.floor(Math.random() * 15) + 15; // 15-30°C
    unit = '°C';
  } else if (sensorId.includes('humid')) {
    sensorType = 'humidity';
    value = Math.floor(Math.random() * 60) + 30; // 30-90%
    unit = '%';
  } else if (sensorId.includes('co2')) {
    sensorType = 'co2';
    value = Math.floor(Math.random() * 800) + 400; // 400-1200 ppm
    unit = 'ppm';
  } else if (sensorId.includes('smoke')) {
    sensorType = 'smoke';
    value = Math.floor(Math.random() * 50); // 0-50 (arbitrary)
    unit = 'ppm';
  } else if (sensorId.includes('motion')) {
    sensorType = 'occupancy';
    value = Math.random() > 0.7 ? 1 : 0; // Boolean as 1/0
    unit = '';
  }
  
  // If status is error, make the values more extreme
  if (randomStatus === 'error' || randomStatus === 'alert') {
    if (sensorType === 'temperature') value = Math.floor(Math.random() * 20) + 35; // 35-55°C
    if (sensorType === 'co2') value = Math.floor(Math.random() * 1000) + 1200; // 1200-2200 ppm
    if (sensorType === 'smoke') value = Math.floor(Math.random() * 100) + 100; // 100-200 ppm
  }
  
  return {
    id: sensorId,
    name: `${sensorType.charAt(0).toUpperCase() + sensorType.slice(1)} Sensor ${sensorId.substring(0, 4)}`,
    deviceId: `device-${sensorId}`,
    type: sensorType as any,
    status: randomStatus,
    value,
    unit,
    timestamp: Date.now(),
    batteryLevel: Math.floor(Math.random() * 100),
  };
}; 