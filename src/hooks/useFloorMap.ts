import { useState, useEffect } from 'react';
import { FloorMapData, getFloorMapData, subscribeToFloorMap } from '@/services/floorMapService';
import { Incident, subscribeToFloorIncidents } from '@/services/incidentService';
import { FloorType } from '@/types/map.types';

interface UseFloorMapProps {
  floorId: FloorType;
  liveUpdates?: boolean;
}

interface UseFloorMapResult {
  mapData: FloorMapData | null;
  incidents: Incident[];
  loading: boolean;
  error: Error | null;
}

/**
 * Hook for using floor map data with optional real-time updates
 */
export const useFloorMap = ({ floorId, liveUpdates = true }: UseFloorMapProps): UseFloorMapResult => {
  const [mapData, setMapData] = useState<FloorMapData | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
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
          setLoading(false);
        }
      } catch (err) {
        console.error('Error in useFloorMap:', err);
        setError(err instanceof Error ? err : new Error('Failed to load map data'));
        setLoading(false);
      }
    };

    fetchMapData();

    // Clean up subscriptions
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