export type IncidentStatus = 'reported' | 'in-progress' | 'resolved';

export type IncidentType = 'maintenance' | 'security' | 'safety' | 'environmental' | 'other';

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Location {
  buildingId?: string;
  floorId?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  description?: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  status: IncidentStatus;
  type: IncidentType;
  severity: IncidentSeverity;
  reportedAt: string | Date;
  reporterId?: string;
  location?: Location;
  mediaUrls?: string[];
  assignedTo?: string;
  updatedAt?: string | Date;
}

// User Roles
export type UserRole = 'admin' | 'rescuer' | 'student' | 'staff' | 'technical-expert';

// User interface
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  isEmailVerified: boolean;
  isAnonymous: boolean;
  photoURL?: string | null;
  phoneNumber?: string | null;
  department?: string;
  studentId?: string;
  createdAt: string;
  lastLoginAt: string;
  fcmTokens?: string[];
  customData?: Record<string, any>;
}

// Floor types
export type FloorType = 'rdc' | 'floor1' | 'floor2' | 'floor3' | 'basement';

// Floor map related types
export interface FloorMapSafeZone {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  capacity: number;
}

export interface FloorMapEvacuationRoute {
  id: string;
  name: string;
  points: Array<{ x: number; y: number }>;
  priority: number;
}

export interface FloorMapSensorPoint {
  id: string;
  sensorId?: string;
  type: 'smoke' | 'temperature' | 'gas' | 'motion' | 'flame';
  x: number;
  y: number;
  label?: string;
}

export interface FloorMap {
  id: string;
  name: string;
  buildingId: string;
  floor: FloorType;
  imageUrl: string;
  width: number;
  height: number;
  safeZones: FloorMapSafeZone[];
  evacuationRoutes: FloorMapEvacuationRoute[];
  sensorPoints: FloorMapSensorPoint[];
  lastUpdated: string;
}

// Building interface
export interface Building {
  id: string;
  name: string;
  address: string;
  description?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  floors?: Floor[];
  defaultFloor?: FloorType;
  createdAt?: string;
  updatedAt?: string;
}

// Floor interface
export interface Floor {
  id: string;
  name: string;
  buildingId: string;
  type: FloorType;
  level: number;
  imageUrl?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Sensor and device types
export type SensorType = 'smoke' | 'temperature' | 'gas' | 'motion' | 'flame';
export type DeviceStatus = 'online' | 'offline' | 'alert' | 'maintenance';

export interface SensorReading {
  id?: string;
  deviceId: string;
  timestamp: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
}

export interface Device {
  id: string;
  deviceId: string;
  name: string;
  type: SensorType;
  location: {
    buildingId: string;
    floor: FloorType;
    roomNumber?: string;
    x: number;
    y: number;
  };
  status: DeviceStatus;
  batteryLevel: number;
  thresholds: {
    warning: number;
    critical: number;
  };
  lastReading?: SensorReading;
  lastMaintenance?: string;
  installedAt: string;
  updatedAt: string;
}

// Notification types
export type NotificationPriority = 'high' | 'medium' | 'low';
export type NotificationType = 
  | 'incident_reported' 
  | 'incident_updated' 
  | 'device_alert' 
  | 'maintenance_alert' 
  | 'system_announcement';

export interface Notification {
  id: string;
  title: string;
  body: string;
  priority: NotificationPriority;
  type: NotificationType;
  relatedId?: string;
  sentAt: string;
  read: boolean;
  recipient: string;
}

// Filter types for incidents
export interface IncidentFilter {
  status?: IncidentStatus | IncidentStatus[];
  type?: IncidentType | IncidentType[];
  severity?: IncidentSeverity | IncidentSeverity[];
  search?: string;
  reporterId?: string;
  assignedTo?: string;
  startDate?: string;
  endDate?: string;
  buildingId?: string;
  floorId?: string;
  sortBy?: 'reportedAt' | 'updatedAt' | 'severity' | 'status';
  sortOrder?: 'asc' | 'desc';
}

// Safety tips
export type SafetyTipCategory = 'prevention' | 'evacuation' | 'first_aid' | 'general';
export type SafetyTipPriority = 'high' | 'medium' | 'low';

export interface SafetyTip {
  id: string;
  title: string;
  content: string;
  category: SafetyTipCategory;
  priority: SafetyTipPriority;
  imageUrl?: string;
}

// Offline support types
export interface OfflineIncident {
  id: string;
  incident: Omit<Incident, 'id'>;
  submissionAttempts: number;
  lastAttempt?: string;
}

// Emergency protocol types
export type ProtocolType = 'evacuation' | 'shelter' | 'medical' | 'firefighting';
export type ProtocolStatus = 'active' | 'resolved' | 'cancelled';

export interface EmergencyProtocol {
  id: string;
  title: string;
  description: string;
  type: ProtocolType;
  status: ProtocolStatus;
  priority: NotificationPriority;
  incidentId?: string;
  steps: string[];
  createdAt: string;
  updatedAt: string;
  activatedBy: string;
}