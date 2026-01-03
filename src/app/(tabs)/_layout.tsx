import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { View, Image, Platform, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';

// Premium button for header
function PremiumHeaderButton() {
  const router = useRouter();
  const { colors } = useTheme();
  
  return (
    <TouchableOpacity 
      onPress={() => router.push('/(onboarding)/payment')}
      style={{
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFD700',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <Ionicons name="diamond" size={20} color="#fff" />
    </TouchableOpacity>
  );
}

// Profile button for header
function ProfileHeaderButton() {
  const { profile } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  
  return (
    <TouchableOpacity 
      onPress={() => router.push('/(tabs)/profile')}
      style={{
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 2.5,
        borderColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        backgroundColor: colors.surface,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      {profile?.photos?.[0] ? (
        <Image 
          source={{ uri: profile.photos[0] }} 
          style={{ width: 32, height: 32, borderRadius: 16 }}
        />
      ) : (
        <Ionicons name="person" size={20} color={colors.primary} />
      )}
    </TouchableOpacity>
  );
}

// Header right buttons - Premium then Profile
function HeaderRightButtons() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginRight: 16 }}>
      <PremiumHeaderButton />
      <ProfileHeaderButton />
    </View>
  );
}

// App logo/title for header
function HeaderTitle() {
  const { colors } = useTheme();
  
  return (
    <View style={{ flexDirection: 'column', paddingTop: 6, paddingBottom: 20 }}>
      <Text style={{ 
        fontSize: 22, 
        fontWeight: '800', 
        color: colors.primary,
        letterSpacing: 0.5,
      }}>
        Mali Match
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
        <Ionicons name="location" size={11} color={colors.textSecondary} />
        <Text style={{ 
          fontSize: 11, 
          color: colors.textSecondary,
          fontWeight: '500',
        }}>
          Discover nearby
        </Text>
      </View>
    </View>
  );
}


export default function TabLayout() {
  const { profile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  
  // Calculate dynamic tab bar height based on device safe area
  const tabBarHeight = 56 + insets.bottom;
  const tabBarPaddingBottom = insets.bottom > 0 ? insets.bottom : 6;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.surface,
          elevation: 0,
          shadowOpacity: 0.08,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 4,
        },
        headerTitle: () => <HeaderTitle />,
        headerRight: () => <HeaderRightButtons />,
        headerTitleAlign: 'left',
        headerLeftContainerStyle: {
          paddingLeft: 16,
        },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarShowLabel: false, // No labels - icons only
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          height: tabBarHeight,
          paddingBottom: tabBarPaddingBottom,
          paddingTop: 6,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discover',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "heart" : "heart-outline"} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: 'Matches',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "chatbubbles" : "chatbubbles-outline"} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="premium"
        options={{
          title: 'Likes',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "people" : "people-outline"} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "settings" : "settings-outline"} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null, // Hidden from tab bar - accessed via header icon
          headerShown: false, // Profile has its own header
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          href: null, // Hidden - chat is accessed from matches
          headerShown: false,
          tabBarStyle: { display: 'none' }, // Hide tab bar in chat
        }}
      />
    </Tabs>
  );
}
