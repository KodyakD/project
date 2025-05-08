import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  TextInput,
  Dimensions,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import locationService, { Building, Floor, Location } from '../services/locationService';
import MapView from './MapView';
import { useFloorMap } from '../hooks/useFloorMap';
import { COLORS, FONTS, SIZES } from '../constants';
import buildingService from '../services/buildingService';

interface LocationSelectorProps {
  value?: Location;
  onChange: (location: Location) => void;
  required?: boolean;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  value,
  onChange,
  required = false,
}) => {
  // State management
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(value?.building || null);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(value?.floor || null);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{x: number, y: number} | null>(
    value?.coordinates || null
  );
  const [displayValue, setDisplayValue] = useState<string>('');

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<'building' | 'floor' | 'position'>('building');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get floor map data
  const { mapData, loading: mapLoading, error: mapError } = useFloorMap(
    selectedFloor?.id || null, false
  );

  // Initialize from value if provided
  useEffect(() => {
    if (value && value.buildingId && value.floorId) {
      fetchInitialData();
    }
  }, [value]);

  const fetchInitialData = async () => {
    try {
      if (!value) return;
      
      setLoading(true);
      
      // Get building and floor data
      const building = await locationService.getBuilding(value.buildingId);
      const floor = await locationService.getFloor(value.floorId);
      
      if (building && floor) {
        setSelectedBuilding(building);
        setSelectedFloor(floor);
        setSelectedCoordinates({ x: value.x, y: value.y });
        
        // Set display value
        setDisplayValue(
          locationService.formatLocationString(
            building.name, 
            floor.name, 
            value.displayName
          )
        );
      }
    } catch (error) {
      console.error('Error fetching location data:', error);
      setError('Failed to load location data');
    } finally {
      setLoading(false);
    }
  };

  const openSelector = () => {
    setShowModal(true);
    loadBuildings();
    setStep('building');
  };

  const loadBuildings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await buildingService.getBuildings();
      setBuildings(data);
      
      // If there's only one building, auto-select it
      if (data.length === 1) {
        setSelectedBuilding(data[0]);
        setStep('floor');
      }
    } catch (error) {
      setError('Failed to load buildings');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const searchBuildings = async (query: string) => {
    try {
      setIsSearching(true);
      setError(null);
      const results = await locationService.searchBuildings(query);
      setBuildings(results);
    } catch (error) {
      setError('Search failed');
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const selectBuilding = async (building: Building) => {
    setSelectedBuilding(building);
    try {
      setLoading(true);
      setError(null);
      const floorData = await locationService.getFloors(building.id);
      setFloors(floorData);
      setStep('floor');
    } catch (error) {
      setError('Failed to load floors');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const selectFloor = (floor: Floor) => {
    setSelectedFloor(floor);
    setStep('position');
  };

  const selectLocation = (x: number, y: number) => {
    if (!selectedBuilding || !selectedFloor) return;
    
    setSelectedCoordinates({ x, y });
    
    const newLocation: Location = {
      buildingId: selectedBuilding.id,
      floorId: selectedFloor.id,
      x, 
      y
    };
    
    onChange(newLocation);
    
    // Update display value
    setDisplayValue(
      locationService.formatLocationString(
        selectedBuilding.name, 
        selectedFloor.name
      )
    );
    
    setShowModal(false);
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (text.length > 2) {
      searchBuildings(text);
    } else if (text.length === 0) {
      loadBuildings();
    }
  };

  const handleBuildingSelect = (building: Building) => {
    setSelectedBuilding(building);
    setSelectedFloor(null);
    setSelectedCoordinates(null);
    setStep('floor');
  };

  const handleFloorSelect = (floor: Floor) => {
    setSelectedFloor(floor);
    setStep('position');
  };

  const handlePositionSelect = (coordinates: {x: number, y: number}) => {
    setSelectedCoordinates(coordinates);
    
    // Once we have all three parts, call the onChange prop
    if (selectedBuilding && selectedFloor) {
      onChange({
        building: selectedBuilding,
        floor: selectedFloor,
        coordinates
      });
    }
  };

  const handleBack = () => {
    if (step === 'position') {
      setStep('floor');
    } else if (step === 'floor') {
      setStep('building');
      setSelectedFloor(null);
    }
  };

  const renderBuildingList = () => (
    <View style={styles.listContainer}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search buildings..."
        value={searchQuery}
        onChangeText={handleSearchChange}
      />
      
      {isSearching ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
      ) : (
        <FlatList
          data={buildings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[
                styles.listItem,
                selectedBuilding?.id === item.id && styles.selectedItem
              ]}
              onPress={() => handleBuildingSelect(item)}
            >
              <Text style={[
                styles.listItemText,
                selectedBuilding?.id === item.id && styles.selectedItemText
              ]}>
                {item.name}
              </Text>
              {selectedBuilding?.id === item.id && (
                <Ionicons name="checkmark" size={20} color={COLORS.white} />
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {error || 'No buildings found'}
            </Text>
          }
        />
      )}
    </View>
  );

  const renderFloorList = () => (
    <View style={styles.listContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setStep('building')}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{selectedBuilding?.name}</Text>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
      ) : (
        <FlatList
          data={floors}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[
                styles.listItem,
                selectedFloor?.id === item.id && styles.selectedItem
              ]}
              onPress={() => handleFloorSelect(item)}
            >
              <Text style={[
                styles.listItemText,
                selectedFloor?.id === item.id && styles.selectedItemText
              ]}>
                {item.name}
              </Text>
              {selectedFloor?.id === item.id && (
                <Ionicons name="checkmark" size={20} color={COLORS.white} />
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {error || 'No floors available'}
            </Text>
          }
        />
      )}
    </View>
  );

  const renderMapSelector = () => (
    <View style={styles.mapContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setStep('floor')}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {selectedFloor?.name}, {selectedBuilding?.name}
        </Text>
      </View>
      
      {mapLoading ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
      ) : mapError ? (
        <Text style={styles.errorText}>{mapError}</Text>
      ) : (
        <View style={styles.mapWrapper}>
          {mapData ? (
            <MapView 
              mapData={mapData}
              onLocationSelect={handlePositionSelect}
              initialMarker={selectedCoordinates}
            />
          ) : (
            <Text style={styles.emptyText}>Map data not available</Text>
          )}
        </View>
      )}
      
      <Text style={styles.helpText}>Tap on the map to select a location</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[
          styles.selector, 
          required && !value && styles.requiredField
        ]} 
        onPress={openSelector}
      >
        {displayValue ? (
          <Text style={styles.selectorText}>{displayValue}</Text>
        ) : (
          <Text style={styles.placeholderText}>
            {required ? 'Select location (required)' : 'Select location (optional)'}
          </Text>
        )}
      </TouchableOpacity>
      
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          {step === 'building' && renderBuildingList()}
          {step === 'floor' && renderFloorList()}
          {step === 'position' && renderMapSelector()}
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowModal(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
      
      {/* Header with selected location information */}
      <View style={styles.locationHeader}>
        <Text style={styles.locationHeaderText}>
          {selectedBuilding ? selectedBuilding.name : 'Select Building'} 
          {selectedFloor ? ` > ${selectedFloor.name}` : ''} 
          {selectedCoordinates ? ` > (${selectedCoordinates.x.toFixed(1)}, ${selectedCoordinates.y.toFixed(1)})` : ''}
        </Text>
      </View>
      
      {/* Back button */}
      {step !== 'building' && (
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  selector: {
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    backgroundColor: COLORS.white,
  },
  requiredField: {
    borderColor: COLORS.error,
  },
  selectorText: {
    ...FONTS.body3,
    color: COLORS.black,
  },
  placeholderText: {
    ...FONTS.body3,
    color: COLORS.gray,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: SIZES.statusBarHeight,
  },
  listContainer: {
    flex: 1,
    padding: SIZES.padding,
  },
  searchInput: {
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.padding,
    marginBottom: SIZES.padding,
  },
  listItem: {
    padding: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  selectedItem: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  listItemText: {
    ...FONTS.body3,
    color: COLORS.black,
  },
  selectedItemText: {
    color: COLORS.white,
  },
  emptyText: {
    ...FONTS.body3,
    color: COLORS.darkgray,
    textAlign: 'center',
    marginTop: SIZES.padding * 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  backButton: {
    ...FONTS.h4,
    color: COLORS.primary,
    marginRight: SIZES.padding,
  },
  headerTitle: {
    ...FONTS.h3,
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    padding: SIZES.padding,
  },
  mapWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
  },
  helpText: {
    ...FONTS.body4,
    color: COLORS.darkgray,
    textAlign: 'center',
    marginTop: SIZES.padding,
  },
  errorText: {
    ...FONTS.body3,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: SIZES.padding * 2,
  },
  cancelButton: {
    padding: SIZES.padding,
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: SIZES.radius,
    margin: SIZES.padding,
  },
  cancelButtonText: {
    ...FONTS.h4,
    color: COLORS.black,
  },
  locationHeader: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.lightGray,
  },
  locationHeaderText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  backButtonText: {
    marginLeft: 8,
    color: COLORS.text,
    fontWeight: '500',
  },
});

export default LocationSelector; 