import { useState, useEffect } from 'react';
import { FloorMapData, getFloorMapData, subscribeToFloorMap } from '../services/floorMapService';
import { Incident, getIncidentsByFloor, subscribeToFloorIncidents } from '../services/incidentService';
import { FloorType } from '../types/map.types';

// Support both object argument and direct floorId argument
type UseFloorMapArg = FloorType | null | {
  floorId: FloorType | null;
  liveUpdates?: boolean;
};

interface UseFloorMapResult {
  mapData: FloorMapData | null;
  incidents: Incident[];
  loading: boolean;
  error: Error | null;
}

/**
 * Hook for using floor map data with optional real-time updates
 * 
 * @example
 * // With all options
 * const { mapData, incidents, loading, error } = useFloorMap({ 
 *   floorId: 'rdc', 
 *   liveUpdates: true 
 * });
 * 
 * @example
 * // Simpler usage with just the floor ID
 * const { mapData, loading } = useFloorMap('rdc');
 * 
 * @example
 * // With nullable floor ID
 * const { mapData, loading } = useFloorMap(selectedFloor);
 */
export const useFloorMap = (arg: UseFloorMapArg): UseFloorMapResult => {
  // Parse arguments to support both forms of calling the hook
  const { floorId, liveUpdates } = typeof arg === 'object' && arg !== null
    ? { floorId: arg.floorId, liveUpdates: arg.liveUpdates !== false }
    : { floorId: arg, liveUpdates: true };

  const [mapData, setMapData] = useState<FloorMapData | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(floorId));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If no floorId is provided, don't try to fetch data
    if (!floorId) {
      setMapData(null);
      setIncidents([]);
      setLoading(false);
      return;
    }

    let mapUnsubscribe: (() => void) | null = null;
    let incidentsUnsubscribe: (() => void) | null = null;

    const fetchMapData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (liveUpdates) {
          // Set up real-time subscriptions
          mapUnsubscribe = subscribeToFloorMap(floorId, (data) => {
            setMapData(data);
            setLoading(false);
          });

          incidentsUnsubscribe = subscribeToFloorIncidents(floorId, (data) => {
            setIncidents(data);
          });
        } else {
          // Fetch data once
          const data = await getFloorMapData(floorId);
          setMapData(data);
          
          // Also fetch incidents once
          try {
            const incidentData = await getIncidentsByFloor(floorId);
            setIncidents(incidentData);
          } catch (incidentErr) {
            console.warn('Failed to fetch incidents for floor:', incidentErr);
            // Don't set an error for this - it's not critical
          }
          
          setLoading(false);
        }
      } catch (err) {
        console.error('Error in useFloorMap:', err);
        setError(err instanceof Error ? err : new Error('Failed to load map data'));
        setLoading(false);
      }
    };

    fetchMapData();

    // Clean up subscriptions on unmount or when floorId/liveUpdates change
    return () => {
      if (mapUnsubscribe) mapUnsubscribe();
      if (incidentsUnsubscribe) incidentsUnsubscribe();
    };
  }, [floorId, liveUpdates]);

  return {
    mapData,
    incidents,
    loading,
    error
  };
};

// Export a simplified version that works with the old signature for backward compatibility
export const useFloorMapSimple = (floorId: FloorType | null, liveUpdates = true): UseFloorMapResult => {
  return useFloorMap({ floorId, liveUpdates });
};

export default useFloorMap;