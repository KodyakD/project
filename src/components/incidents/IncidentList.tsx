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
import Colors from '../../constants/Colors';
import { useTheme } from '../../context/ThemeContext';

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
  fire: 'flame-outline',
  gas: 'cloud-outline',
  smoke: 'cloudy-outline',
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

// Helper function to safely format dates with Firebase Timestamp support
const safelyFormatDate = (dateValue: any) => {
  try {
    // Handle different date formats including Firebase timestamps
    const date = dateValue instanceof Date 
      ? dateValue 
      : (typeof dateValue === 'object' && dateValue?.toDate instanceof Function)
        ? dateValue.toDate() // Handle Firestore Timestamp objects
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
  const { colors } = useTheme();
  
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
  
  // Debug function for logging incident data during development
  const debugIncident = (incident: any, label: string = "Incident data") => {
    if (__DEV__) {
      console.log(`${label}:`, {
        id: incident.id,
        title: incident.title,
        status: incident.status,
        date: incident.reportedAt || incident.createdAt,
        fields: Object.keys(incident)
      });
    }
  };

  // Apply filters to incidents - memoized to prevent unnecessary recalculations
  const applyFilters = useCallback((incidentsToFilter: Incident[], currentFilters: IncidentFilter) => {
    if (__DEV__) {
      console.log(`Applying filters to ${incidentsToFilter.length} incidents`, currentFilters);
      if (incidentsToFilter.length > 0) {
        debugIncident(incidentsToFilter[0], "Sample incident");
      }
    }

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
        (incident.title?.toLowerCase().includes(searchLower)) || 
        (incident.description?.toLowerCase().includes(searchLower)) ||
        (incident.location?.description?.toLowerCase().includes(searchLower))
      );
    }
    
    // Date range filter - handle missing date fields gracefully
    if (currentFilters.dateRange) {
      if (currentFilters.dateRange.start) {
        result = result.filter(incident => {
          // Handle Firebase Timestamp or fallback to createdAt
          const reportedDate = incident.reportedAt?.toDate?.() || 
                              new Date(incident.reportedAt || incident.createdAt);
          return !isNaN(reportedDate.getTime()) && 
                 reportedDate >= (currentFilters.dateRange?.start as Date);
        });
      }
      
      if (currentFilters.dateRange.end) {
        result = result.filter(incident => {
          // Handle Firebase Timestamp or fallback to createdAt
          const reportedDate = incident.reportedAt?.toDate?.() || 
                              new Date(incident.reportedAt || incident.createdAt);
          return !isNaN(reportedDate.getTime()) && 
                 reportedDate <= (currentFilters.dateRange?.end as Date);
        });
      }
    }
    
    // Sort incidents with handling for Firebase Timestamps
    const sortBy = currentFilters.sortBy || 'date';
    const sortOrder = currentFilters.sortOrder || 'desc';
    
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date': {
          // Support for Firebase Timestamp objects
          const aTime = a.reportedAt?.toDate?.() 
                    ? a.reportedAt.toDate().getTime() 
                    : new Date(a.reportedAt || a.createdAt).getTime();
          
          const bTime = b.reportedAt?.toDate?.() 
                    ? b.reportedAt.toDate().getTime() 
                    : new Date(b.reportedAt || b.createdAt).getTime();
          
          // Handle invalid dates
          comparison = !isNaN(aTime) && !isNaN(bTime) ? aTime - bTime : 0;
          break;
        }
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
    
    if (__DEV__) {
      console.log(`After filtering: ${result.length} incidents`);
    }
    setFilteredIncidents(result);
  }, []);
  
  // Fetch incidents manually (used for pull-to-refresh)
  const fetchIncidents = useCallback(async () => {
    try {
      setError(null);
      
      let fetchedIncidents: Incident[] = [];
      
      try {
        if (isUserIncidents) {
          // Get incidents reported by current user using React Native Firebase SDK
          const response = await incidentService.getIncidents({
            reporterId: 'current'
          });
          
          // Handle Firebase response format
          if (response && response.incidents && Array.isArray(response.incidents)) {
            fetchedIncidents = response.incidents;
          } else if (Array.isArray(response)) {
            fetchedIncidents = response;
          }
        } else {
          // Get all incidents
          const response = await incidentService.getIncidents();
          
          // Handle Firebase response format
          if (response && response.incidents && Array.isArray(response.incidents)) {
            fetchedIncidents = response.incidents;
          } else if (Array.isArray(response)) {
            fetchedIncidents = response;
          }
        }
      } catch (fetchError) {
        console.warn('Error fetching incidents, using cached data:', fetchError);
      }
      
      // Only update incidents if we actually got some
      if (fetchedIncidents.length > 0) {
        setIncidents(fetchedIncidents);
        applyFilters(fetchedIncidents, filters);
      } else {
        // Just reapply filters to existing incidents
        applyFilters(incidents, filters);
      }
      
    } catch (err) {
      console.error('Error in fetchIncidents:', err);
      setError('Failed to load incidents. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isUserIncidents, filters, applyFilters, incidents]);
  
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
      try {
        if (!router) {
          console.warn("Router is undefined, using alternative navigation");
          return;
        }
        router.push(`/report/details/${incident.id}`);
      } catch (error) {
        console.error("Navigation error:", error);
      }
    }
  };
  
  // Render item
  const renderItem = ({ item }: { item: Incident }) => (
    <TouchableOpacity
      style={[
        styles.incidentCard,
        { backgroundColor: colors.card }
      ]}
      onPress={() => navigateToIncidentDetails(item)}
    >
      <View style={styles.incidentHeader}>
        <View style={[
          styles.typeIconContainer, 
          { backgroundColor: `${colors.primary}15` }
        ]}>
          <Ionicons
            name={TypeIcons[item.type] || 'help-circle-outline'}
            size={24}
            color={colors.primary}
          />
        </View>
        
        <View style={styles.headerText}>
          <Text 
            style={[styles.incidentTitle, { color: colors.text }]}
            numberOfLines={1}
          >
            {item.title || "Untitled Incident"}
          </Text>
          
          <View style={styles.incidentMeta}>
            <Text style={[styles.incidentDate, { color: colors.textSecondary }]}>
              {safelyFormatDate(item.reportedAt || item.createdAt)}
            </Text>
          </View>
        </View>
        
        <View style={[
          styles.severityIndicator,
          { backgroundColor: SeverityColors[item.severity] || SeverityColors.medium }
        ]} />
      </View>
      
      <Text 
        style={[styles.incidentDescription, { color: colors.textSecondary }]}
        numberOfLines={2}
      >
        {item.description || "No description provided"}
      </Text>
      
      <View style={styles.incidentFooter}>
        <StatusBadge status={item.status} />
        
        {item.location && (
          <View style={styles.locationContainer}>
            <Ionicons 
              name="location-outline" 
              size={14} 
              color={colors.textSecondary}
            />
            <Text style={[styles.locationText, { color: colors.textSecondary }]}>
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
        color={colors.textSecondary}
      />
      <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
        {emptyStateMessage}
      </Text>
      {Object.keys(filters).length > 0 && (
        <TouchableOpacity
          style={[styles.resetButton, { backgroundColor: colors.primary }]}
          onPress={resetFilters}
        >
          <Text style={[styles.resetButtonText, { color: colors.white }]}>Reset Filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );
  
  // Render filter options
  const renderFilterOptions = () => (
    <View style={[styles.filterOptions, { backgroundColor: colors.card }]}>
      <Text style={[styles.filterTitle, { color: colors.text }]}>Filter By Status</Text>
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            { borderColor: colors.border },
            filters.status === undefined && [styles.activeChip, { backgroundColor: `${colors.primary}15`, borderColor: colors.primary }]
          ]}
          onPress={() => updateFilters({ status: undefined })}
        >
          <Text style={[
            styles.filterChipText,
            { color: filters.status === undefined ? colors.primary : colors.text }
          ]}>
            All
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterChip,
            { borderColor: colors.border },
            filters.status === 'reported' && [styles.activeChip, { backgroundColor: `${colors.primary}15`, borderColor: colors.primary }]
          ]}
          onPress={() => updateFilters({ status: 'reported' })}
        >
          <Text style={[
            styles.filterChipText,
            { color: filters.status === 'reported' ? colors.primary : colors.text }
          ]}>
            Reported
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterChip,
            { borderColor: colors.border },
            filters.status === 'in-progress' && [styles.activeChip, { backgroundColor: `${colors.primary}15`, borderColor: colors.primary }]
          ]}
          onPress={() => updateFilters({ status: 'in-progress' })}
        >
          <Text style={[
            styles.filterChipText,
            { color: filters.status === 'in-progress' ? colors.primary : colors.text }
          ]}>
            In Progress
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterChip,
            { borderColor: colors.border },
            filters.status === 'resolved' && [styles.activeChip, { backgroundColor: `${colors.primary}15`, borderColor: colors.primary }]
          ]}
          onPress={() => updateFilters({ status: 'resolved' })}
        >
          <Text style={[
            styles.filterChipText,
            { color: filters.status === 'resolved' ? colors.primary : colors.text }
          ]}>
            Resolved
          </Text>
        </TouchableOpacity>
      </View>
      
      <Text style={[styles.filterTitle, { color: colors.text }]}>Filter By Type</Text>
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            { borderColor: colors.border },
            filters.type === undefined && [styles.activeChip, { backgroundColor: `${colors.primary}15`, borderColor: colors.primary }]
          ]}
          onPress={() => updateFilters({ type: undefined })}
        >
          <Text style={[
            styles.filterChipText,
            { color: filters.type === undefined ? colors.primary : colors.text }
          ]}>
            All
          </Text>
        </TouchableOpacity>
        
        {Object.keys(TypeIcons).map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterChip,
              { borderColor: colors.border },
              filters.type === type && [styles.activeChip, { backgroundColor: `${colors.primary}15`, borderColor: colors.primary }]
            ]}
            onPress={() => updateFilters({ type: type as IncidentType })}
          >
            <Ionicons 
              name={TypeIcons[type as IncidentType]} 
              size={14} 
              color={filters.type === type ? colors.primary : colors.text}
              style={styles.chipIcon}
            />
            <Text style={[
              styles.filterChipText,
              { color: filters.type === type ? colors.primary : colors.text }
            ]}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <Text style={[styles.filterTitle, { color: colors.text }]}>Sort By</Text>
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            { borderColor: colors.border },
            (filters.sortBy === 'date' || !filters.sortBy) && [styles.activeChip, { backgroundColor: `${colors.primary}15`, borderColor: colors.primary }]
          ]}
          onPress={() => updateFilters({ 
            sortBy: 'date', 
            sortOrder: filters.sortOrder === 'asc' && filters.sortBy === 'date' ? 'desc' : 'asc' 
          })}
        >
          <Text style={[
            styles.filterChipText,
            { color: (filters.sortBy === 'date' || !filters.sortBy) ? colors.primary : colors.text }
          ]}>
            Date {(filters.sortBy === 'date' || !filters.sortBy) && (
              <Ionicons 
                name={filters.sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} 
                size={14} 
                color={(filters.sortBy === 'date' || !filters.sortBy) ? colors.primary : colors.text}
              />
            )}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterChip,
            { borderColor: colors.border },
            filters.sortBy === 'severity' && [styles.activeChip, { backgroundColor: `${colors.primary}15`, borderColor: colors.primary }]
          ]}
          onPress={() => updateFilters({ 
            sortBy: 'severity', 
            sortOrder: filters.sortOrder === 'asc' && filters.sortBy === 'severity' ? 'desc' : 'asc'
          })}
        >
          <Text style={[
            styles.filterChipText,
            { color: filters.sortBy === 'severity' ? colors.primary : colors.text }
          ]}>
            Severity {filters.sortBy === 'severity' && (
              <Ionicons 
                name={filters.sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} 
                size={14} 
                color={filters.sortBy === 'severity' ? colors.primary : colors.text}
              />
            )}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterChip,
            { borderColor: colors.border },
            filters.sortBy === 'status' && [styles.activeChip, { backgroundColor: `${colors.primary}15`, borderColor: colors.primary }]
          ]}
          onPress={() => updateFilters({ 
            sortBy: 'status', 
            sortOrder: filters.sortOrder === 'asc' && filters.sortBy === 'status' ? 'desc' : 'asc'
          })}
        >
          <Text style={[
            styles.filterChipText,
            { color: filters.sortBy === 'status' ? colors.primary : colors.text }
          ]}>
            Status {filters.sortBy === 'status' && (
              <Ionicons 
                name={filters.sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} 
                size={14} 
                color={filters.sortBy === 'status' ? colors.primary : colors.text}
              />
            )}
          </Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity
        style={[
          styles.resetFiltersButton, 
          { 
            borderColor: colors.border,
            backgroundColor: `${colors.primary}10`
          }
        ]}
        onPress={resetFilters}
      >
        <Ionicons name="refresh" size={16} color={colors.text} />
        <Text style={[styles.resetFiltersText, { color: colors.text }]}>Reset All Filters</Text>
      </TouchableOpacity>
    </View>
  );
  
  // Split useEffect into two separate ones - one for subscription and one for filters

  // 1. First useEffect - subscription and initial fetch
  useEffect(() => {
    // Set loading on initial mount
    setLoading(true);
    
    let unsubscribe: (() => void) | null = null;
    
    try {
      // Use the Firebase realtime subscription from incidentService
      unsubscribe = incidentService.subscribeToIncidents((updatedIncidents) => {
        if (__DEV__) {
          console.log("Received real-time update with", updatedIncidents.length, "incidents");
        }
        
        // Ensure we have valid data before updating state
        if (Array.isArray(updatedIncidents)) {
          // Filter to user's incidents if needed
          const filteredByUser = isUserIncidents 
            ? updatedIncidents.filter(incident => 
                incident.reporterId === 'current' || 
                incident.reporterId === incidentService.getCurrentUserId?.())
            : updatedIncidents;
          
          setIncidents(filteredByUser);
          // Apply current filters to the new data
          applyFilters(filteredByUser, filters);
          // Set loading to false when we receive data
          setLoading(false);
          setRefreshing(false);
        }
      });
    } catch (error) {
      console.error('Error setting up real-time subscription:', error);
      setError('Failed to connect to real-time updates. Please try again.');
      setLoading(false);
      setRefreshing(false);
    }
    
    // Cleanup subscription on unmount
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [isUserIncidents]); // Only re-run if isUserIncidents changes

  // 2. Second useEffect - handle filter changes
  useEffect(() => {
    // Skip initial call when incidents is empty
    if (incidents.length === 0) return;
    
    // When filters change, just reapply them to existing data
    applyFilters(incidents, filters);
  }, [filters, incidents, applyFilters]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {showFilters && (
        <View style={styles.searchContainer}>
          <View style={[
            styles.searchInputContainer,
            { 
              borderColor: colors.border,
              backgroundColor: colors.card 
            }
          ]}>
            <Ionicons name="search" size={18} color={colors.textSecondary} />
            <TextInput
              style={[
                styles.searchInput,
                { color: colors.text }
              ]}
              placeholder="Search incidents..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={handleSearch}
              clearButtonMode="while-editing"
            />
          </View>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              { 
                borderColor: colors.border,
                backgroundColor: colors.card 
              }
            ]}
            onPress={() => setShowFilterOptions(!showFilterOptions)}
          >
            <Ionicons 
              name="options-outline" 
              size={20} 
              color={activeFilterCount > 0 ? colors.primary : colors.text} 
            />
            
            {activeFilterCount > 0 && (
              <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}
      
      {showFilterOptions && renderFilterOptions()}
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading incidents...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
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
              colors={[colors.primary]}
              tintColor={colors.primary}
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
    borderWidth: 1,
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
  white: '#FFFFFF',
});

export default IncidentList;