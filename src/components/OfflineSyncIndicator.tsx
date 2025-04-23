import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Animated
} from 'react-native';
import { useNetwork } from '../contexts/NetworkContext';
import { getPendingUploadsCount } from '../services/mediaService';
import { getPendingIncidentsCount } from '../services/incidentService';
import { Ionicons } from '@expo/vector-icons';
import offlineSyncManager from '../utils/offlineSyncManager';
import { COLORS } from '../constants';

const OfflineSyncIndicator: React.FC = () => {
  const { isConnected, isInternetReachable } = useNetwork();
  const [pendingUploads, setPendingUploads] = useState(0);
  const [pendingIncidents, setPendingIncidents] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [animation] = useState(new Animated.Value(0));
  
  // Get pending count every time indicator is rendered 
  // and whenever connection status changes
  useEffect(() => {
    const updatePendingCounts = async () => {
      try {
        const mediaCount = await getPendingUploadsCount();
        const incidentCount = await getPendingIncidentsCount();
        
        setPendingUploads(mediaCount);
        setPendingIncidents(incidentCount);
      } catch (error) {
        console.error('Error getting pending counts:', error);
      }
    };
    
    updatePendingCounts();
    
    // Set up interval to check periodically
    const interval = setInterval(updatePendingCounts, 30000); // every 30 seconds
    
    return () => clearInterval(interval);
  }, [isConnected, isInternetReachable]);
  
  // Animate expansion
  useEffect(() => {
    Animated.timing(animation, {
      toValue: expanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [expanded, animation]);
  
  // Calculate total pending items
  const totalPending = pendingUploads + pendingIncidents;
  
  // Only show when there are pending items or when offline
  if (totalPending === 0 && isConnected && isInternetReachable) {
    return null;
  }
  
  // Background color changes based on connection status
  const backgroundColor = !isConnected || !isInternetReachable 
    ? COLORS.error 
    : (totalPending > 0 ? COLORS.warning : COLORS.success);
  
  // Handle sync now button press
  const handleSyncNow = async () => {
    if (syncing) return;
    
    setSyncing(true);
    try {
      await offlineSyncManager.checkAndSync();
      // Refresh counts after sync
      const mediaCount = await getPendingUploadsCount();
      const incidentCount = await getPendingIncidentsCount();
      
      setPendingUploads(mediaCount);
      setPendingIncidents(incidentCount);
    } catch (error) {
      console.error('Error syncing:', error);
    } finally {
      setSyncing(false);
    }
  };
  
  // Dynamic height based on expanded state
  const containerHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [40, 110],
  });
  
  // Rotation for the arrow icon
  const arrowRotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  
  return (
    <Animated.View 
      style={[
        styles.container, 
        { backgroundColor, height: containerHeight }
      ]}
    >
      {/* Main indicator row - always visible */}
      <TouchableOpacity 
        style={styles.mainRow}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.leftContent}>
          {!isConnected || !isInternetReachable ? (
            <Ionicons name="cloud-offline" size={18} color="white" />
          ) : (
            <Ionicons name="cloud-done" size={18} color="white" />
          )}
          <Text style={styles.statusText}>
            {!isConnected || !isInternetReachable
              ? 'Offline'
              : totalPending > 0
                ? `${totalPending} item${totalPending !== 1 ? 's' : ''} pending`
                : 'Online'
            }
          </Text>
        </View>
        
        <Animated.View style={{ transform: [{ rotate: arrowRotation }] }}>
          <Ionicons name="chevron-down" size={18} color="white" />
        </Animated.View>
      </TouchableOpacity>
      
      {/* Expanded content */}
      <View style={styles.expandedContent}>
        {/* Pending details */}
        <View style={styles.pendingDetails}>
          {pendingIncidents > 0 && (
            <Text style={styles.pendingText}>
              {pendingIncidents} incident{pendingIncidents !== 1 ? 's' : ''} pending
            </Text>
          )}
          {pendingUploads > 0 && (
            <Text style={styles.pendingText}>
              {pendingUploads} media file{pendingUploads !== 1 ? 's' : ''} pending
            </Text>
          )}
          {totalPending === 0 && (
            <Text style={styles.pendingText}>
              No pending items to sync
            </Text>
          )}
        </View>
        
        {/* Sync button */}
        {totalPending > 0 && isConnected && isInternetReachable && (
          <TouchableOpacity 
            style={styles.syncButton}
            onPress={handleSyncNow}
            disabled={syncing}
          >
            {syncing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="sync" size={14} color="white" />
                <Text style={styles.syncText}>Sync now</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    overflow: 'hidden',
    zIndex: 1000,
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 20,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  expandedContent: {
    marginTop: 16,
  },
  pendingDetails: {
    marginBottom: 10,
  },
  pendingText: {
    color: 'white',
    marginVertical: 2,
  },
  syncButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default OfflineSyncIndicator; 