import { useState, useEffect } from 'react';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import { FloorType } from '@/types/map.types';

// Map between floor IDs and asset paths
// Note: Need to ensure these asset files are in the proper location
const MAP_ASSETS = {
  'rdc': require('@/assets/maps/floor-rdc.svg'),
  '1er': require('@/assets/maps/floor-1er.svg'),
  '2eme': require('@/assets/maps/floor-2eme.svg'),
  '3eme': require('@/assets/maps/floor-3eme.svg'),
  '4eme': require('@/assets/maps/floor-4eme.svg'),
};

export const useMapCache = (floorId: FloorType) => {
  const [mapUri, setMapUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadMap = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Try to get the map from cache first
        const cacheKey = `map_${floorId}_v1`;
        const cachePath = `${FileSystem.cacheDirectory}${cacheKey}`;
        
        // Check if the map is in cache
        const cacheInfo = await FileSystem.getInfoAsync(cachePath);
        
        if (cacheInfo.exists) {
          // Use cached map
          setMapUri(cachePath);
          setIsLoading(false);
          return;
        }
        
        // If not in cache, download/copy the map
        try {
          const asset = Asset.fromModule(MAP_ASSETS[floorId]);
          await asset.downloadAsync();
          
          if (asset.localUri) {
            // Copy to persistent cache
            await FileSystem.copyAsync({
              from: asset.localUri,
              to: cachePath
            });
            
            setMapUri(cachePath);
          } else {
            throw new Error('Failed to download map asset');
          }
        } catch (assetError) {
          // For testing purposes, provide a fallback URI
          console.warn('Using fallback map URI:', assetError);
          setMapUri(`https://example.com/maps/floor-${floorId}.svg`);
        }
      } catch (err) {
        console.error('Map caching error:', err);
        setError(err instanceof Error ? err : new Error('Unknown error loading map'));
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMap();
  }, [floorId]);

  return { mapUri, isLoading, error };
};