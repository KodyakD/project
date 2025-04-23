import apiClient from './apiClient';
import { Building, Floor } from '../types';

const BUILDINGS_ENDPOINT = '/buildings';
const FLOORS_ENDPOINT = '/floors';

/**
 * Service for fetching building and floor data
 */
const buildingService = {
  /**
   * Get all buildings 
   */
  getBuildings: async (): Promise<Building[]> => {
    try {
      const response = await apiClient.get(BUILDINGS_ENDPOINT);
      return response.data;
    } catch (error) {
      console.error('Error fetching buildings:', error);
      throw error;
    }
  },

  /**
   * Get a single building by ID
   */
  getBuilding: async (buildingId: string): Promise<Building> => {
    try {
      const response = await apiClient.get(`${BUILDINGS_ENDPOINT}/${buildingId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching building ${buildingId}:`, error);
      throw error;
    }
  },

  /**
   * Get floors for a specific building
   */
  getFloors: async (buildingId: string): Promise<Floor[]> => {
    try {
      const response = await apiClient.get(`${BUILDINGS_ENDPOINT}/${buildingId}${FLOORS_ENDPOINT}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching floors for building ${buildingId}:`, error);
      throw error;
    }
  },

  /**
   * Get a specific floor by ID
   */
  getFloor: async (floorId: string): Promise<Floor> => {
    try {
      const response = await apiClient.get(`${FLOORS_ENDPOINT}/${floorId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching floor ${floorId}:`, error);
      throw error;
    }
  },

  /**
   * Search buildings with optional query parameters
   */
  searchBuildings: async (query: string): Promise<Building[]> => {
    try {
      const response = await apiClient.get(`${BUILDINGS_ENDPOINT}/search`, {
        params: { query }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching buildings:', error);
      throw error;
    }
  }
};

export default buildingService; 