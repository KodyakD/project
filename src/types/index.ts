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