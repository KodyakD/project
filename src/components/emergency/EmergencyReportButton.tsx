import React from 'react';
import { StyleSheet, Pressable, View, Text, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { TriangleAlert as AlertTriangle } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

export default function EmergencyReportButton() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }]
    };
  });
  
  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1);
  };
  
  const handlePress = () => {
    router.push('/report/incident');
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.buttonContainer, animatedStyle]}>
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.emergencyRed },
            pressed && styles.pressed
          ]}
        >
          <AlertTriangle color="#FFFFFF" size={24} />
          <Text style={styles.buttonText}>Report Emergency</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80, // Above tab bar
    alignSelf: 'center',
    zIndex: 1000,
  },
  buttonContainer: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    fontSize: 16,
  },
  pressed: {
    opacity: 0.9,
  }
});