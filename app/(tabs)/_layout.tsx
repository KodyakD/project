import React from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Home, Map, Bell, MessageCircle, User, PlusCircle } from '@expo/vector-icons/Feather';
import Colors from '../../src/constants/Colors';
import { FloatingActionButton } from '../../src/components/ui/FloatingActionButton';
import { useRouter } from 'expo-router';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="maps"
          options={{
            title: 'Maps',
            tabBarIcon: ({ color, size }) => <Map size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: 'Alerts',
            tabBarIcon: ({ color, size }) => <Bell size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="assistant"
          options={{
            title: 'Assistant',
            tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
          }}
        />
      </Tabs>

      {/* Providing necessary props to FloatingActionButton */}
      <FloatingActionButton 
        icon={<PlusCircle size={24} color="#FFFFFF" />}
        onPress={() => router.push('/create-incident')}
        label="Report Incident"
      />
    </>
  );
}