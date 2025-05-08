import firestore from '@react-native-firebase/firestore';
import { FloorType } from '../types/map.types';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { BUILDING_MAP_CONFIG } from './buildingMapConfig';

// Map between floor IDs and asset paths
const MAP_ASSETS = {
  'rdc': require('@/assets/maps/floor-rdc.svg'),
  '1er': require('@/assets/maps/floor-1er.svg'),
  '2eme': require('@/assets/maps/floor-2eme.svg'),
  '3eme': require('@/assets/maps/floor-3eme.svg'),
  '4eme': require('@/assets/maps/floor-4eme.svg'),
};

// Collection reference
const floorMapsCollection = firestore().collection('floorMaps');

// Types for map data components
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
  x: number;
  y: number;
  type: string;
  name?: string;
}

export interface FloorMapData {
  floorId: FloorType;
  safeZones: FloorMapSafeZone[];
  evacuationRoutes: FloorMapEvacuationRoute[];
  sensorPoints: FloorMapSensorPoint[];
  lastUpdated: firestore.Timestamp;
  updatedBy?: string;
}

export interface FloorMap {
  id: string;
  name: string;
  mapSvg: string;
  width: number;
  height: number;
  buildingId: string;
  floor: number;
  sensorPoints: FloorMapSensorPoint[];
}

export interface FloorMapRoutePoint {
  id: string;
  x: number;
  y: number;
  order: number;
}

export interface FloorMapRoute {
  id: string;
  floorMapId: string;
  name: string;
  description?: string;
  priority: 'primary' | 'secondary' | 'alternative';
  points: FloorMapRoutePoint[];
  startPointId?: string;
  endPointId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Building {
  id: string;
  name: string;
  address: string;
  description?: string;
  floors: number[];
  defaultFloor: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get floor map data for a specific floor
 */
export const getFloorMapData = async (floorId: FloorType): Promise<FloorMapData | null> => {
  try {
    const docRef = floorMapsCollection.doc(floorId);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      return {
        floorId,
        ...docSnap.data()
      } as FloorMapData;
    }

    // Return default empty data if no document exists
    return {
      floorId,
      safeZones: [],
      evacuationRoutes: [],
      sensorPoints: [],
      lastUpdated: firestore.Timestamp.now()
    };
  } catch (error) {
    console.error('Error fetching floor map data:', error);
    return null;
  }
};

/**
 * Get all floor maps
 */
export const getAllFloorMaps = async (): Promise<FloorMapData[]> => {
  try {
    const snapshot = await floorMapsCollection.get();
    
    return snapshot.docs.map(doc => ({
      floorId: doc.id as FloorType,
      ...doc.data()
    })) as FloorMapData[];
  } catch (error) {
    console.error('Error fetching all floor maps:', error);
    return [];
  }
};

/**
 * Subscribe to a specific floor map for real-time updates
 */
export const subscribeToFloorMap = (
  floorId: FloorType, 
  callback: (data: FloorMapData) => void
): (() => void) => {
  const docRef = floorMapsCollection.doc(floorId);
  
  return docRef.onSnapshot((docSnap) => {
    if (docSnap.exists) {
      callback({
        floorId,
        ...docSnap.data()
      } as FloorMapData);
    } else {
      // Return empty data structure if no document exists
      callback({
        floorId,
        safeZones: [],
        evacuationRoutes: [],
        sensorPoints: [],
        lastUpdated: firestore.Timestamp.now()
      });
    }
  }, (error) => {
    console.error('Error subscribing to floor map:', error);
  });
};

export const fetchBuildings = async (): Promise<Building[]> => {
  try {
    const buildingsRef = firestore().collection('buildings');
    const buildingsSnap = await buildingsRef.get();
    
    return buildingsSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        address: data.address,
        description: data.description,
        floors: data.floors || [],
        defaultFloor: data.defaultFloor || 1,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });
  } catch (error) {
    console.error('Error fetching buildings:', error);
    throw error;
  }
};

export const fetchBuildingById = async (buildingId: string): Promise<Building | null> => {
  try {
    const buildingRef = firestore().collection('buildings').doc(buildingId);
    const buildingSnap = await buildingRef.get();
    
    if (!buildingSnap.exists) {
      return null;
    }
    
    const data = buildingSnap.data();
    return {
      id: buildingSnap.id,
      name: data.name,
      address: data.address,
      description: data.description,
      floors: data.floors || [],
      defaultFloor: data.defaultFloor || 1,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error('Error fetching building:', error);
    throw error;
  }
};

/**
 * Parse floorMapId to get the floor part
 */
const parseFloorMapId = (floorMapId: string): { buildingId: string, floorId: FloorType } => {
  // Handle format like "main-building-rdc"
  const parts = floorMapId.split('-');
  const floorId = parts.pop() as FloorType; // Get the last part (rdc)
  const buildingId = parts.join('-'); // Rejoin the rest (main-building)
  
  return { buildingId, floorId };
};

/**
 * Fetch a floor map by ID
 */
export const fetchFloorMap = async (floorMapId: string): Promise<FloorMap> => {
  try {
    // First, try to get from Firebase
    const docRef = firestore().collection('floorMaps').doc(floorMapId);
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        mapSvg: data.mapSvg,
        width: data.width,
        height: data.height,
        buildingId: data.buildingId,
        floor: data.floor,
        sensorPoints: [] // You can load these separately
      };
    } else {
      // Document doesn't exist - handle local files instead for development
      console.log(`Floor map ${floorMapId} not found in Firebase, using local file`);
      
      // Parse the floor ID from the floorMapId (e.g., "main-building-rdc" -> "rdc")
      const { buildingId, floorId } = parseFloorMapId(floorMapId);
      
      if (!floorId || !MAP_ASSETS[floorId]) {
        console.error(`No local asset found for floor ${floorId}. Available floors:`, Object.keys(MAP_ASSETS));
        
        // Use a default floor as fallback if requested one isn't available
        const defaultFloorId = 'rdc';
        console.log(`Using default floor: ${defaultFloorId}`);
        
        // Get default floor asset
        const asset = Asset.fromModule(MAP_ASSETS[defaultFloorId]);
        await asset.downloadAsync();
        
        if (!asset.localUri) {
          throw new Error('Failed to load default map asset');
        }
        
        // Read the default SVG content
        const svgContent = await FileSystem.readAsStringAsync(asset.localUri);
        
        return {
          id: floorMapId,
          name: `Default Floor (${defaultFloorId.toUpperCase()})`,
          mapSvg: svgContent,
          width: 1000,
          height: 800,
          buildingId: buildingId,
          floor: 0,
          sensorPoints: []
        };
      }
      
      // Load the SVG file
      try {
        const asset = Asset.fromModule(MAP_ASSETS[floorId]);
        await asset.downloadAsync();
        
        if (!asset.localUri) {
          throw new Error('Failed to load local map asset');
        }
        
        // Read the SVG content
        const svgContent = await FileSystem.readAsStringAsync(asset.localUri);
        
        // Return mock map data
        return {
          id: floorMapId,
          name: `${floorId.toUpperCase()} Floor`,
          mapSvg: svgContent,
          width: 1000, // Default width
          height: 800, // Default height
          buildingId: buildingId,
          floor: floorId === 'rdc' ? 0 : parseInt(floorId.replace(/[^\d]/g, ''), 10),
          sensorPoints: [] // Mock sensors could be added here
        };
      } catch (assetError) {
        console.error('Error loading map asset:', assetError);
        throw new Error(`Failed to load floor map: ${assetError.message}`);
      }
    }
  } catch (error) {
    console.error('Error fetching floor map:', error);
    throw error;
  }
};

/**
 * Fetch all floor maps for a building
 */
export const fetchBuildingFloorMaps = async (buildingId: string): Promise<FloorMap[]> => {
  try {
    const mapsQuery = firestore()
      .collection('floorMaps')
      .where('buildingId', '==', buildingId);
    
    const mapsSnapshot = await mapsQuery.get();
    const maps: FloorMap[] = [];
    
    for (const docSnap of mapsSnapshot.docs) {
      const data = docSnap.data();
      
      // Fetch sensor points for this floor map
      const sensorsQuery = firestore()
        .collection('mapSensorPoints')
        .where('floorMapId', '==', docSnap.id);
      
      const sensorSnapshot = await sensorsQuery.get();
      const sensorPoints: FloorMapSensorPoint[] = [];
      
      sensorSnapshot.forEach(doc => {
        sensorPoints.push({
          id: doc.id,
          ...doc.data()
        } as FloorMapSensorPoint);
      });
      
      maps.push({
        id: docSnap.id,
        name: data.name,
        mapSvg: data.mapSvg,
        width: data.width,
        height: data.height,
        buildingId: data.buildingId,
        floor: data.floor,
        sensorPoints
      });
    }
    
    // Sort maps by floor number
    return maps.sort((a, b) => a.floor - b.floor);
  } catch (error) {
    console.error('Error fetching building floor maps:', error);
    throw error;
  }
};

export const fetchFloorMapRoutes = async (floorMapId: string): Promise<FloorMapRoute[]> => {
  try {
    const routesRef = firestore().collection('floorMapRoutes');
    const q = routesRef.where('floorMapId', '==', floorMapId);
    const routesSnap = await q.get();
    
    const routes = routesSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        floorMapId: data.floorMapId,
        name: data.name,
        description: data.description,
        priority: data.priority || 'secondary',
        points: data.points || [],
        startPointId: data.startPointId,
        endPointId: data.endPointId,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });
    
    return routes;
  } catch (error) {
    console.error('Error fetching floor map routes:', error);
    throw error;
  }
};

export const fetchFloorMapSensorPoints = async (floorMapId: string): Promise<FloorMapSensorPoint[]> => {
  try {
    const sensorsRef = firestore().collection('floorMapSensors');
    const q = sensorsRef.where('floorMapId', '==', floorMapId);
    const sensorsSnap = await q.get();
    
    return sensorsSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        floorMapId: data.floorMapId,
        x: data.x,
        y: data.y,
        type: data.type || 'generic',
        name: data.name,
        description: data.description,
      };
    });
  } catch (error) {
    console.error('Error fetching floor map sensor points:', error);
    throw error;
  }
};