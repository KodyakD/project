import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  useColorScheme,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../src/constants/Colors';
import { router } from 'expo-router';
import { X, Camera, Flame, CloudFog, Wind, Building, TriangleAlert as AlertTriangle, User, MapPin, Image as ImageIcon, Plus } from 'lucide-react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Button from '../../src/components/ui/Button';
import { useTheme } from '../../src/context/ThemeContext';

// Mock building and floor data
const buildings = [
  { id: 'main', name: 'Main Campus' },
  { id: 'science', name: 'Science Building' },
  { id: 'library', name: 'Library' },
];

const floors = [
  { id: 'rdc', name: 'Ground Floor' },
  { id: '1er', name: '1st Floor' },
  { id: '2eme', name: '2nd Floor' },
  { id: '3eme', name: '3rd Floor' },
  { id: '4eme', name: '4th Floor' },
];

// Incident types
const incidentTypes = [
  { id: 'fire', name: 'Fire', icon: Flame },
  { id: 'smoke', name: 'Smoke', icon: CloudFog },
  { id: 'gas', name: 'Gas Leak', icon: Wind },
  { id: 'structural', name: 'Structural', icon: Building },
  { id: 'medical', name: 'Medical', icon: User },
  { id: 'other', name: 'Other', icon: AlertTriangle },
];

// Validation schema
const ReportSchema = Yup.object().shape({
  incidentType: Yup.string().required('Please select an incident type'),
  severity: Yup.string().required('Please select a severity level'),
  building: Yup.string().required('Please select a building'),
  floor: Yup.string().required('Please select a floor'),
  roomNumber: Yup.string(),
  description: Yup.string().required('Please provide a description'),
  images: Yup.array().of(Yup.string()),
});

export default function ReportIncidentScreen() {
  // Use ThemeContext instead of direct useColorScheme
  const { colors, colorScheme } = useTheme();
  
  // Define severity levels using colors from the theme
  const severityLevels = [
    { id: 'low', name: 'Low', color: colors.success },
    { id: 'medium', name: 'Medium', color: colors.warning },
    { id: 'high', name: 'High', color: colors.error },
    { id: 'critical', name: 'Critical', color: colors.critical },
  ];
  
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  
  // Mock images (would come from camera/gallery in a real app)
  const mockImages = [
    'https://images.pexels.com/photos/51951/forest-fire-fire-smoke-conservation-51951.jpeg?auto=compress&cs=tinysrgb&w=240&h=240&dpr=2',
  ];
  
  // Define types for form values
  interface IncidentReportValues {
    incidentType: string;
    severity: string;
    building: string;
    floor: string;
    roomNumber: string;
    description: string;
    images: string[];
  }

  const handleSubmit = (values: IncidentReportValues): void => {
    console.log('Submitted values:', values);
    
    // In a real app, this would send the data to the server
    // Show success message and navigate back
    
    // Navigate back to the dashboard
    router.replace('/(tabs)');
  };
  
  const goToNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const goToPrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Report Emergency</Text>
          <Pressable 
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <X size={24} color={colors.text} />
          </Pressable>
        </View>
        
        {/* Progress bar */}
        <View style={[styles.progressBarContainer, { backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
          {Array(totalSteps).fill(0).map((_, index) => (
            <View 
              key={index}
              style={[
                styles.progressBarSegment,
                { 
                  backgroundColor: currentStep > index 
                    ? colors.emergencyRed
                    : 'transparent',
                  width: `${100 / totalSteps}%`,
                }
              ]}
            />
          ))}
        </View>
        
        <Text style={[styles.stepText, { color: colors.textSecondary }]}>
          Step {currentStep} of {totalSteps}
        </Text>
        
        <Formik
          initialValues={{
            incidentType: '',
            severity: '',
            building: '',
            floor: '',
            roomNumber: '',
            description: '',
            images: [],
          }}
          validationSchema={ReportSchema}
          onSubmit={handleSubmit}
        >
          {({ 
            handleChange, 
            handleBlur, 
            handleSubmit, 
            values, 
            errors, 
            touched, 
            setFieldValue 
          }) => (
            <>
              <ScrollView 
                style={{ flex: 1 }}
                contentContainerStyle={[styles.formContainer, { backgroundColor: colors.background }]}
                showsVerticalScrollIndicator={false}
              >
                {/* Step 1: Incident Type and Severity */}
                {currentStep === 1 && (
                  <>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      What type of emergency are you reporting?
                    </Text>
                    
                    <View style={styles.incidentTypesGrid}>
                      {incidentTypes.map((type) => (
                        <Pressable
                          key={type.id}
                          style={[
                            styles.incidentTypeItem,
                            { 
                              backgroundColor: values.incidentType === type.id 
                                ? `${colors.emergencyRed}15` // Use emergencyRed with alpha
                                : colors.card,
                              borderColor: values.incidentType === type.id 
                                ? colors.emergencyRed
                                : colors.border,
                            }
                          ]}
                          onPress={() => setFieldValue('incidentType', type.id)}
                        >
                          <type.icon 
                            size={24} 
                            color={values.incidentType === type.id ? colors.emergencyRed : colors.textSecondary} 
                          />
                          <Text 
                            style={[
                              styles.incidentTypeName,
                              { 
                                color: values.incidentType === type.id 
                                  ? colors.emergencyRed
                                  : colors.text,
                                fontFamily: values.incidentType === type.id 
                                  ? 'Inter-Medium' 
                                  : 'Inter-Regular',
                              }
                            ]}
                          >
                            {type.name}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    
                    {touched.incidentType && errors.incidentType && (
                      <Text style={[styles.errorText, { color: colors.error }]}>
                        {errors.incidentType}
                      </Text>
                    )}
                    
                    <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>
                      How severe is the situation?
                    </Text>
                    
                    <View style={styles.severityContainer}>
                      {severityLevels.map((level) => (
                        <Pressable
                          key={level.id}
                          style={[
                            styles.severityItem,
                            { 
                              backgroundColor: values.severity === level.id 
                                ? `${level.color}15` // 15% opacity
                                : colors.card,
                              borderColor: values.severity === level.id 
                                ? level.color
                                : colors.border,
                            }
                          ]}
                          onPress={() => setFieldValue('severity', level.id)}
                        >
                          <View 
                            style={[
                              styles.severityDot,
                              { backgroundColor: level.color }
                            ]} 
                          />
                          <Text 
                            style={[
                              styles.severityName,
                              { 
                                color: values.severity === level.id 
                                  ? level.color 
                                  : colors.text,
                                fontFamily: values.severity === level.id 
                                  ? 'Inter-Medium' 
                                  : 'Inter-Regular',
                              }
                            ]}
                          >
                            {level.name}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    
                    {touched.severity && errors.severity && (
                      <Text style={[styles.errorText, { color: colors.error }]}>
                        {errors.severity}
                      </Text>
                    )}
                  </>
                )}
                
                {/* Step 2: Location Information */}
                {currentStep === 2 && (
                  <>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      Where is the emergency located?
                    </Text>
                    
                    <Text style={[styles.inputLabel, { color: colors.text }]}>
                      Building
                    </Text>
                    <View style={styles.selectContainer}>
                      {buildings.map((building) => (
                        <Pressable
                          key={building.id}
                          style={[
                            styles.selectItem,
                            { 
                              backgroundColor: values.building === building.id 
                                ? `${colors.emergencyRed}15`
                                : colors.card,
                              borderColor: values.building === building.id 
                                ? colors.emergencyRed
                                : colors.border,
                            }
                          ]}
                          onPress={() => setFieldValue('building', building.id)}
                        >
                          <Text 
                            style={[
                              styles.selectItemText,
                              { 
                                color: values.building === building.id 
                                  ? colors.emergencyRed
                                  : colors.text,
                                fontFamily: values.building === building.id 
                                  ? 'Inter-Medium' 
                                  : 'Inter-Regular',
                              }
                            ]}
                          >
                            {building.name}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    
                    {touched.building && errors.building && (
                      <Text style={[styles.errorText, { color: colors.error }]}>
                        {errors.building}
                      </Text>
                    )}
                    
                    <Text style={[styles.inputLabel, { color: colors.text, marginTop: 16 }]}>
                      Floor
                    </Text>
                    <View style={styles.selectContainer}>
                      {floors.map((floor) => (
                        <Pressable
                          key={floor.id}
                          style={[
                            styles.selectItem,
                            { 
                              backgroundColor: values.floor === floor.id 
                                ? `${colors.emergencyRed}15`
                                : colors.card,
                              borderColor: values.floor === floor.id 
                                ? colors.emergencyRed
                                : colors.border,
                            }
                          ]}
                          onPress={() => setFieldValue('floor', floor.id)}
                        >
                          <Text 
                            style={[
                              styles.selectItemText,
                              { 
                                color: values.floor === floor.id 
                                  ? colors.emergencyRed
                                  : colors.text,
                                fontFamily: values.floor === floor.id 
                                  ? 'Inter-Medium' 
                                  : 'Inter-Regular',
                              }
                            ]}
                          >
                            {floor.name}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    
                    {touched.floor && errors.floor && (
                      <Text style={[styles.errorText, { color: colors.error }]}>
                        {errors.floor}
                      </Text>
                    )}
                    
                    <Text style={[styles.inputLabel, { color: colors.text, marginTop: 16 }]}>
                      Room Number (Optional)
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        { 
                          color: colors.text,
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                        }
                      ]}
                      placeholder="Enter room number if known"
                      placeholderTextColor={colors.neutral}
                      value={values.roomNumber}
                      onChangeText={handleChange('roomNumber')}
                      onBlur={handleBlur('roomNumber')}
                    />
                    
                    <View style={styles.mapLocationSection}>
                      <View style={styles.mapLocationHeader}>
                        <MapPin size={20} color={colors.emergencyRed} />
                        <Text style={[styles.mapLocationTitle, { color: colors.text }]}>
                          Mark Location on Map
                        </Text>
                      </View>
                      
                      <View style={[
                        styles.mapPlaceholder,
                        { backgroundColor: colors.card }
                      ]}>
                        <Text style={[styles.mapPlaceholderText, { color: colors.textSecondary }]}>
                          Map would be displayed here to mark exact location
                        </Text>
                      </View>
                    </View>
                  </>
                )}
                
                {/* Step 3: Description and Images */}
                {currentStep === 3 && (
                  <>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      Describe the emergency
                    </Text>
                    
                    <Text style={[styles.inputLabel, { color: colors.text }]}>
                      Description
                    </Text>
                    <TextInput
                      style={[
                        styles.textArea,
                        { 
                          color: colors.text,
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                        }
                      ]}
                      placeholder="Provide details about the emergency..."
                      placeholderTextColor={colors.neutral}
                      value={values.description}
                      onChangeText={handleChange('description')}
                      onBlur={handleBlur('description')}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                    
                    {touched.description && errors.description && (
                      <Text style={[styles.errorText, { color: colors.error }]}>
                        {errors.description}
                      </Text>
                    )}
                    
                    <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>
                      Add photos (optional)
                    </Text>
                    
                    <View style={styles.imagesContainer}>
                      {/* Mock images - in a real app these would come from camera/gallery */}
                      {mockImages.map((imageUri, index) => (
                        <View key={index} style={styles.imageWrapper}>
                          <Image
                            source={{ uri: imageUri }}
                            style={styles.imagePreview}
                          />
                          <Pressable 
                            style={[styles.removeImageButton, { backgroundColor: colors.error }]}
                            onPress={() => {
                              const newImages = [...values.images];
                              newImages.splice(index, 1);
                              setFieldValue('images', newImages);
                            }}
                          >
                            <X size={16} color="#FFFFFF" />
                          </Pressable>
                        </View>
                      ))}
                      
                      {/* Add image button */}
                      <Pressable
                        style={[
                          styles.addImageButton,
                          { 
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                          }
                        ]}
                        onPress={() => {
                          // In a real app, this would open camera/gallery
                          console.log('Open camera/gallery');
                        }}
                      >
                        <Plus size={24} color={colors.emergencyRed} />
                        <Text style={[styles.addImageText, { color: colors.emergencyRed }]}>
                          Add Photo
                        </Text>
                      </Pressable>
                    </View>
                  </>
                )}
              </ScrollView>
              
              <View style={[
                styles.buttonsContainer, 
                { 
                  borderTopColor: colors.border,
                  backgroundColor: colors.background
                }
              ]}>
                {currentStep > 1 && (
                  <Button
                    title="Back"
                    variant="outline"
                    onPress={goToPrevStep}
                    style={{ flex: 1, marginRight: 8 }}
                  />
                )}
                
                {currentStep < totalSteps ? (
                  <Button
                    title="Next"
                    variant="primary"
                    onPress={goToNextStep}
                    style={{ flex: currentStep > 1 ? 1 : undefined, marginLeft: currentStep > 1 ? 8 : 0 }}
                    fullWidth={currentStep === 1}
                  />
                ) : (
                  <Button
                    title="Submit Report"
                    variant="emergency"
                    onPress={() => handleSubmit()}
                    style={{ flex: 1, marginLeft: 8 }}
                  />
                )}
              </View>
            </>
          )}
        </Formik>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  closeButton: {
    padding: 4,
  },
  progressBarContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarSegment: {
    height: '100%',
  },
  stepText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  formContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  incidentTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  incidentTypeItem: {
    width: '30%',
    marginHorizontal: '1.5%',
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  incidentTypeName: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  severityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  severityItem: {
    width: '48%',
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  severityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  severityName: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  selectItem: {
    marginHorizontal: 4,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectItemText: {
    fontSize: 14,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  mapLocationSection: {
    marginTop: 24,
  },
  mapLocationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mapLocationTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginLeft: 8,
  },
  mapPlaceholder: {
    height: 150,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    minHeight: 120,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  imageWrapper: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 12,
    marginBottom: 12,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  addImageText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginTop: 4,
  },
  buttonsContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    borderTopWidth: 1,
  },
});