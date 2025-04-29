import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Image,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { Incident, IncidentStatus, IncidentType } from '../../types';
import * as incidentService from '../../services/incidentService';
import { StatusBadge } from '../common/StatusBadge';
import Colors, { useThemeColor } from '../../constants/Colors';

const SeverityColors = {
  low: '#0EA5E9',     // Blue
  medium: '#F59E0B',  // Amber
  high: '#EA580C',    // Orange
  critical: '#DC2626', // Red
};

// Map incident types to icons
const TypeIcons: Record<IncidentType, any> = {
  maintenance: 'build-outline',
  security: 'shield-outline',
  safety: 'warning-outline',
  environmental: 'leaf-outline',
  other: 'help-circle-outline',
};

// Filter options
export type IncidentFilter = {
  status?: IncidentStatus;
  type?: IncidentType;
  search?: string;
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  sortBy?: 'date' | 'severity' | 'status';
  sortOrder?: 'asc' | 'desc';
};

interface IncidentListProps {
  onSelectIncident?: (incident: Incident) => void;
  initialFilters?: IncidentFilter;
  showFilters?: boolean;
  emptyStateMessage?: string;
  header?: React.ReactNode;
  isUserIncidents?: boolean;
}

// Add this helper function somewhere in your component
const safelyFormatDate = (dateValue: any) => {
  try {
    // Make sure we have a valid date
    const date = dateValue instanceof Date 
      ? dateValue 
      : new Date(dateValue);
      
    // Check if date is valid before formatting
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    return format(date, 'MMM d, yyyy • h:mm a');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

export const IncidentList: React.FC<IncidentListProps> = ({
  onSelectIncident,
  initialFilters = {},
  showFilters = true,
  emptyStateMessage = "No incidents found",
  header,
  isUserIncidents = false,
}) => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  
  // State management
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState<IncidentFilter>(initialFilters);
  const [searchQuery, setSearchQuery] = useState(initialFilters.search || '');
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  
  // Fetch incidents
  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let fetchedIncidents: Incident[] = [];
      
      if (isUserIncidents) {
        // Get incidents reported by current user
        const response = await incidentService.getIncidents({
          reporterId: 'current' // This would be handled by the backend to filter by current user
        });
        // Properly extract the incidents array from the response
        fetchedIncidents = response.incidents || [];
      } else {
        // Get all incidents
        const response = await incidentService.getIncidents();
        // Properly extract the incidents array from the response
        fetchedIncidents = response.incidents || [];
      }
      
      setIncidents(fetchedIncidents);
      applyFilters(fetchedIncidents, filters);
      
    } catch (err) {
      console.error('Error fetching incidents:', err);
      setError('Failed to load incidents. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isUserIncidents, filters]);
  
  // Initial fetch
  useEffect(() => {
    fetchIncidents();
    
    // Set up real-time updates subscription
    let unsubscribe: (() => void) | null = null;
    
    try {
      // Use the Firebase subscription
      unsubscribe = incidentService.subscribeToIncidents((updatedIncidents) => {
        // Make sure we don't cause an infinite loop
        console.log("Received real-time update with", updatedIncidents.length, "incidents");
        
        // Only update if we have data and it's different
        if (updatedIncidents && updatedIncidents.length > 0) {
          setIncidents(updatedIncidents);
          applyFilters(updatedIncidents, filters);
        }
      });
    } catch (error) {
      console.error('Error setting up real-time subscription:', error);
    }
    
    // Cleanup subscription on unmount
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [fetchIncidents]);
  
  // Apply filters to incidents
  const applyFilters = useCallback((incidentsToFilter: Incident[], currentFilters: IncidentFilter) => {
    let result = [...incidentsToFilter];
    
    // Status filter
    if (currentFilters.status) {
      result = result.filter(incident => incident.status === currentFilters.status);
    }
    
    // Type filter
    if (currentFilters.type) {
      result = result.filter(incident => incident.type === currentFilters.type);
    }
    
    // Search filter (across title and description)
    if (currentFilters.search) {
      const searchLower = currentFilters.search.toLowerCase();
      result = result.filter(incident => 
        incident.title.toLowerCase().includes(searchLower) || 
        incident.description.toLowerCase().includes(searchLower) ||
        (incident.location?.description?.toLowerCase().includes(searchLower))
      );
    }
    
    // Date range filter
    if (currentFilters.dateRange) {
      if (currentFilters.dateRange.start) {
        result = result.filter(incident => {
          const reportedDate = new Date(incident.reportedAt);
          return reportedDate >= (currentFilters.dateRange?.start as Date);
        });
      }
      
      if (currentFilters.dateRange.end) {
        result = result.filter(incident => {
          const reportedDate = new Date(incident.reportedAt);
          return reportedDate <= (currentFilters.dateRange?.end as Date);
        });
      }
    }
    
    // Sort incidents
    const sortBy = currentFilters.sortBy || 'date';
    const sortOrder = currentFilters.sortOrder || 'desc';
    
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.reportedAt).getTime() - new Date(b.reportedAt).getTime();
          break;
        case 'severity': {
          const severityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
          comparison = (severityOrder[a.severity] || 0) - (severityOrder[b.severity] || 0);
          break;
        }
        case 'status': {
          const statusOrder = { reported: 0, 'in-progress': 1, resolved: 2 };
          comparison = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
          break;
        }
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    setFilteredIncidents(result);
  }, []);
  
  // Update filters
  const updateFilters = useCallback((newFilters: Partial<IncidentFilter>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    applyFilters(incidents, updatedFilters);
  }, [filters, incidents, applyFilters]);
  
  // Handle search
  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
    updateFilters({ search: text });
  }, [updateFilters]);
  
  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchIncidents();
  }, [fetchIncidents]);
  
  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters({});
    setSearchQuery('');
    applyFilters(incidents, {});
  }, [incidents, applyFilters]);
  
  // Navigate to incident details
  const navigateToIncidentDetails = (incident: Incident) => {
    if (onSelectIncident) {
      onSelectIncident(incident);
    } else {
      router.push(`/report/details/${incident.id}`);
    }
  };
  
  // Render item
  const renderItem = ({ item }: { item: Incident }) => (
    <TouchableOpacity
      style={[
        styles.incidentCard,
      ]}
      onPress={() => navigateToIncidentDetails(item)}
    >
      <View style={styles.incidentHeader}>
        <View style={styles.typeIconContainer}>
          <Ionicons
            name={TypeIcons[item.type] || 'help-circle-outline'}
            size={24}
          />
        </View>
        
        <View style={styles.headerText}>
          <Text 
            style={[styles.incidentTitle]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          
          <View style={styles.incidentMeta}>
            <Text style={[styles.incidentDate]}>
              {safelyFormatDate(item.reportedAt)}
            </Text>
          </View>
        </View>
        
        <View style={[
          styles.severityIndicator,
          { backgroundColor: SeverityColors[item.severity] }
        ]} />
      </View>
      
      <Text 
        style={[styles.incidentDescription]}
        numberOfLines={2}
      >
        {item.description}
      </Text>
      
      <View style={styles.incidentFooter}>
        <StatusBadge status={item.status} />
        
        {item.location && (
          <View style={styles.locationContainer}>
            <Ionicons 
              name="location-outline" 
              size={14} 
            />
            <Text style={[styles.locationText]}>
              {item.location.description || `${item.location.buildingId}, Floor ${item.location.floorId}`}
            </Text>
          </View>
        )}
      </View>
      
      {item.mediaUrls && item.mediaUrls.length > 0 && (
        <View style={styles.mediaPreview}>
          <Image 
            source={{ uri: item.mediaUrls[0] }} 
            style={styles.mediaImage} 
            resizeMode="cover"
          />
          {item.mediaUrls.length > 1 && (
            <View style={styles.mediaCounter}>
              <Text style={styles.mediaCounterText}>+{item.mediaUrls.length - 1}</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
  
  // Filter button badge
  const activeFilterCount = Object.keys(filters).filter(key => 
    key !== 'search' && Boolean(filters[key as keyof IncidentFilter])
  ).length;
  
  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons 
        name="alert-circle-outline" 
        size={64} 
      />
      <Text style={[styles.emptyStateText]}>
        {emptyStateMessage}
      </Text>
      {Object.keys(filters).length > 0 && (
        <TouchableOpacity
          style={[styles.resetButton]}
          onPress={resetFilters}
        >
          <Text style={styles.resetButtonText}>Reset Filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );
  
  // Render filter options
  const renderFilterOptions = () => (
    <View style={[styles.filterOptions]}>
      <Text style={[styles.filterTitle]}>Filter By Status</Text>
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            filters.status === undefined && styles.activeChip,
          ]}
          onPress={() => updateFilters({ status: undefined })}
        >
          <Text style={[
            styles.filterChipText,
            filters.status === undefined && styles.activeChipText,
          ]}>
            All
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterChip,
            filters.status === 'reported' && styles.activeChip,
          ]}
          onPress={() => updateFilters({ status: 'reported' })}
        >
          <Text style={[
            styles.filterChipText,
            filters.status === 'reported' && styles.activeChipText,
          ]}>
            Reported
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterChip,
            filters.status === 'in-progress' && styles.activeChip,
          ]}
          onPress={() => updateFilters({ status: 'in-progress' })}
        >
          <Text style={[
            styles.filterChipText,
            filters.status === 'in-progress' && styles.activeChipText,
          ]}>
            In Progress
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterChip,
            filters.status === 'resolved' && styles.activeChip,
          ]}
          onPress={() => updateFilters({ status: 'resolved' })}
        >
          <Text style={[
            styles.filterChipText,
            filters.status === 'resolved' && styles.activeChipText,
          ]}>
            Resolved
          </Text>
        </TouchableOpacity>
      </View>
      
      <Text style={[styles.filterTitle]}>Filter By Type</Text>
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            filters.type === undefined && styles.activeChip,
          ]}
          onPress={() => updateFilters({ type: undefined })}
        >
          <Text style={[
            styles.filterChipText,
            filters.type === undefined && styles.activeChipText,
          ]}>
            All
          </Text>
        </TouchableOpacity>
        
        {Object.keys(TypeIcons).map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterChip,
              filters.type === type && styles.activeChip,
            ]}
            onPress={() => updateFilters({ type: type as IncidentType })}
          >
            <Ionicons 
              name={TypeIcons[type as IncidentType]} 
              size={14} 
              style={styles.chipIcon}
            />
            <Text style={[
              styles.filterChipText,
              filters.type === type && styles.activeChipText,
            ]}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <Text style={[styles.filterTitle]}>Sort By</Text>
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            (filters.sortBy === 'date' || !filters.sortBy) && styles.activeChip,
          ]}
          onPress={() => updateFilters({ 
            sortBy: 'date', 
            sortOrder: filters.sortOrder === 'asc' && filters.sortBy === 'date' ? 'desc' : 'asc' 
          })}
        >
          <Text style={[
            styles.filterChipText,
            (filters.sortBy === 'date' || !filters.sortBy) && styles.activeChipText,
          ]}>
            Date {(filters.sortBy === 'date' || !filters.sortBy) && (
              <Ionicons 
                name={filters.sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} 
                size={14} 
              />
            )}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterChip,
            filters.sortBy === 'severity' && styles.activeChip,
          ]}
          onPress={() => updateFilters({ 
            sortBy: 'severity', 
            sortOrder: filters.sortOrder === 'asc' && filters.sortBy === 'severity' ? 'desc' : 'asc'
          })}
        >
          <Text style={[
            styles.filterChipText,
            filters.sortBy === 'severity' && styles.activeChipText,
          ]}>
            Severity {filters.sortBy === 'severity' && (
              <Ionicons 
                name={filters.sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} 
                size={14} 
              />
            )}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterChip,
            filters.sortBy === 'status' && styles.activeChip,
          ]}
          onPress={() => updateFilters({ 
            sortBy: 'status', 
            sortOrder: filters.sortOrder === 'asc' && filters.sortBy === 'status' ? 'desc' : 'asc'
          })}
        >
          <Text style={[
            styles.filterChipText,
            filters.sortBy === 'status' && styles.activeChipText,
          ]}>
            Status {filters.sortBy === 'status' && (
              <Ionicons 
                name={filters.sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} 
                size={14} 
              />
            )}
          </Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity
        style={[styles.resetFiltersButton]}
        onPress={resetFilters}
      >
        <Ionicons name="refresh" size={16} />
        <Text style={[styles.resetFiltersText]}>Reset All Filters</Text>
      </TouchableOpacity>
    </View>
  );
  
  return (
    <View style={styles.container}>
      {showFilters && (
        <View style={styles.searchContainer}>
          <View style={[
            styles.searchInputContainer,
          ]}>
            <Ionicons name="search" size={18} />
            <TextInput
              style={[styles.searchInput]}
              placeholder="Search incidents..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={handleSearch}
              clearButtonMode="while-editing"
            />
          </View>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
            ]}
            onPress={() => setShowFilterOptions(!showFilterOptions)}
          >
            <Ionicons 
              name="options-outline" 
              size={20} 
              color={activeFilterCount > 0 ? '#0EA5E9' : '#000'} 
            />
            
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}
      
      {showFilterOptions && renderFilterOptions()}
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0EA5E9" />
          <Text style={[styles.loadingText]}>
            Loading incidents...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#DC2626" />
          <Text style={[styles.errorText]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton]}
            onPress={fetchIncidents}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredIncidents}
          renderItem={renderItem}
          keyExtractor={(item) => item.id || String(Math.random())}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={() => <>{header}</>}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#0EA5E9']}
              tintColor="#0EA5E9"
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    height: 40,
    marginLeft: 8,
    fontSize: 16,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  filterBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#0EA5E9',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 120, // Extra padding for floating action button
  },
  incidentCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  incidentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  incidentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  incidentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  incidentDate: {
    fontSize: 12,
  },
  severityIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginLeft: 12,
  },
  incidentDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  incidentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    marginLeft: 4,
  },
  mediaPreview: {
    marginTop: 12,
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  mediaCounter: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mediaCounterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  resetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  filterOptions: {
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  activeChip: {
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    borderColor: '#0EA5E9',
  },
  filterChipText: {
    fontSize: 14,
  },
  activeChipText: {
    fontWeight: '500',
  },
  chipIcon: {
    marginRight: 4,
  },
  resetFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  resetFiltersText: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default IncidentList;