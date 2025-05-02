import { Incident as ServiceIncident } from '../services/incidentService';
import { Incident as AppIncident } from '../types';

/**
 * Maps service incident data to application incident model
 */
export function mapServiceIncidentToAppIncident(incident: ServiceIncident): AppIncident {
  return {
    id: incident.id || '',
    title: incident.title,
    description: incident.description,
    status: incident.status,
    type: incident.type,
    severity: incident.severity,
    reportedAt: incident.createdAt ? incident.createdAt.toDate() : new Date(),
    reporterId: incident.reporterId,
    location: incident.location ? {
      buildingId: incident.location.buildingId,
      floorId: incident.location.floorId,
      coordinates: { latitude: incident.location.x, longitude: incident.location.y },
      description: incident.location.description
    } : undefined,
    mediaUrls: incident.mediaUrls,
    assignedTo: incident.assignedTo?.id,
    updatedAt: incident.updatedAt ? incident.updatedAt.toDate() : undefined
  };
}