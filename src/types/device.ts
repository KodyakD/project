export interface DeviceData {
  id: string;
  name: string;
  deviceId: string;
  type: 'temperature' | 'humidity' | 'co2' | 'occupancy' | 'smoke' | 'water' | 'other';
  status: 'normal' | 'warning' | 'error' | 'alert' | 'offline';
  value?: number | boolean | string;
  unit?: string;
  timestamp: number;
  batteryLevel?: number;
  location?: {
    buildingId: string;
    floorId: string;
    roomId?: string;
    x: number;
    y: number;
  };
  metadata?: Record<string, any>;
}

export interface SensorReading {
  deviceId: string;
  type: string;
  value: number | boolean | string;
  timestamp: number;
  unit?: string;
}

export interface DeviceAlert {
  id: string;
  deviceId: string;
  type: string;
  severity: 'warning' | 'error' | 'critical';
  message: string;
  timestamp: number;
  acknowledged: boolean;
  resolvedAt?: number;
} 