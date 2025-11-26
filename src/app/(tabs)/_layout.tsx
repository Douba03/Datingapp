import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { View, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../components/theme/colors';

export default function TabLayout() {
  const { profile } = useAuth();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          paddingTop: 12,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "heart" : "heart-outline"} size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: 'Matches',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "chatbubbles" : "chatbubbles-outline"} size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="premium"
        options={{
          href: null,
           tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "star" : "star-outline"} size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          href: null,
          tabBarIcon: ({ color, size, focused }) => (
             <View style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                borderWidth: 2,
                borderColor: focused ? colors.primary : 'transparent',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden'
             }}>
                {profile?.photos?.[0] ? (
                  <Image 
                    source={{ uri: profile.photos[0] }} 
                    style={{ width: 26, height: 26, borderRadius: 13 }}
                  />
                ) : (
                  <Ionicons name="person" size={24} color={color} />
                )}
             </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "settings" : "settings-outline"} size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
