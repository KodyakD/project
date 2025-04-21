export type FloorType = 'rdc' | '1er' | '2eme' | '3eme' | '4eme';

export interface Coordinates {
  x: number;
  y: number;
}

export interface Room {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type?: string;
  capacity?: number;
}

export interface MapAsset {
  uri: string;
  width: number;
  height: number;
  version: string;
}

export interface SafeZone {
  id: string;
  label: string;
  coordinates: Coordinates[];
  capacity: number;
  riskLevel?: number;
}

export interface Landmark {
  id: string;
  type: 'extinguisher' | 'exit' | 'emergency_exit' | 'fire_alarm' | 'first_aid' | 'aed' | 'assembly_point';
  coordinates: Coordinates;
  label?: string;
}

export interface EvacuationRoute {
  id: string;
  from: string; // Room ID
  to: string; // Room ID
  points: Coordinates[];
  isAccessible: boolean;
  isEmergencyRoute: boolean;
}