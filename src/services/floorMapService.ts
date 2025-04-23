import { collection, doc, getDoc, getDocs, onSnapshot, query, Timestamp, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { FloorType } from '@/types/map.types';

// Collection reference
const floorMapsCollection = collection(db, 'floorMaps');

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
  lastUpdated: Timestamp;
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
    const docRef = doc(floorMapsCollection, floorId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
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
      lastUpdated: Timestamp.now()
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
    const q = query(floorMapsCollection);
    const snapshot = await getDocs(q);
    
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
  const docRef = doc(floorMapsCollection, floorId);
  
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
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
        lastUpdated: Timestamp.now()
      });
    }
  }, (error) => {
    console.error('Error subscribing to floor map:', error);
  });
};

export const fetchBuildings = async (): Promise<Building[]> => {
  try {
    const buildingsRef = collection(db, 'buildings');
    const buildingsSnap = await getDocs(buildingsRef);
    
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
    const buildingRef = doc(db, 'buildings', buildingId);
    const buildingSnap = await getDoc(buildingRef);
    
    if (!buildingSnap.exists()) {
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
 * Fetch a floor map by ID
 */
export const fetchFloorMap = async (floorMapId: string): Promise<FloorMap> => {
  try {
    const docRef = doc(db, 'floorMaps', floorMapId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error(`Floor map with ID ${floorMapId} not found`);
    }
    
    const data = docSnap.data();
    
    // Fetch sensor points for this floor map
    const sensorsQuery = query(
      collection(db, 'mapSensorPoints'),
      where('floorMapId', '==', floorMapId)
    );
    
    const sensorSnapshot = await getDocs(sensorsQuery);
    const sensorPoints: FloorMapSensorPoint[] = [];
    
    sensorSnapshot.forEach(doc => {
      sensorPoints.push({
        id: doc.id,
        ...doc.data()
      } as FloorMapSensorPoint);
    });
    
    return {
      id: docSnap.id,
      name: data.name,
      mapSvg: data.mapSvg,
      width: data.width,
      height: data.height,
      buildingId: data.buildingId,
      floor: data.floor,
      sensorPoints
    };
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
    const mapsQuery = query(
      collection(db, 'floorMaps'),
      where('buildingId', '==', buildingId)
    );
    
    const mapsSnapshot = await getDocs(mapsQuery);
    const maps: FloorMap[] = [];
    
    for (const docSnap of mapsSnapshot.docs) {
      const data = docSnap.data();
      
      // Fetch sensor points for this floor map
      const sensorsQuery = query(
        collection(db, 'mapSensorPoints'),
        where('floorMapId', '==', docSnap.id)
      );
      
      const sensorSnapshot = await getDocs(sensorsQuery);
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
    const routesRef = collection(db, 'floorMapRoutes');
    const q = query(routesRef, where('floorMapId', '==', floorMapId));
    const routesSnap = await getDocs(q);
    
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
    const sensorsRef = collection(db, 'floorMapSensors');
    const q = query(sensorsRef, where('floorMapId', '==', floorMapId));
    const sensorsSnap = await getDocs(q);
    
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