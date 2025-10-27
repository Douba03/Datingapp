import React, { useEffect } from 'react';
import { Stack, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../hooks/useAuth';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { notificationService } from '../services/notifications';
import { supabase } from '../services/supabase/client';

const colors = {
  primary: '#FF6B6B',
  secondary: '#4ECDC4',
  accent: '#45B7D1',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#2C3E50',
  textSecondary: '#7F8C8D',
  border: '#E1E8ED',
  success: '#27AE60',
  warning: '#F39C12',
  error: '#E74C3C',
  like: '#FF6B6B',
  pass: '#95A5A6',
  superlike: '#45B7D1',
};

export default function RootLayout() {
  const { user, session, loading, supabaseError } = useAuth();

  // Test push notifications when user is authenticated
  useEffect(() => {
    if (user && session) {
      const testPushNotifications = async () => {
        try {
          console.log('🧪 Testing Push Notifications...');
          
          // Test 1: Register for push notifications
          const token = await notificationService.registerForPushNotifications();
          console.log('✅ Push token:', token);
          
          if (token) {
            // Test 2: Save token to database
            const { error } = await supabase
              .from('user_push_tokens')
              .upsert({
                user_id: user.id,
                expo_push_token: token,
                device_type: Platform.OS,
                is_active: true,
                last_used_at: new Date().toISOString()
              });
            
            if (error) {
              console.log('❌ Error saving token:', error.message);
            } else {
              console.log('✅ Token saved to database');
            }
          }
          
          // Test 3: Send local notification
          await notificationService.sendLocalNotification({
            type: 'system',
            title: '🎉 Test Notification',
            body: 'Push notifications are working!',
          });
          console.log('✅ Test notification sent');
          
          // Test 4: Check notification permissions
          const enabled = await notificationService.areNotificationsEnabled();
          console.log('✅ Permissions:', enabled ? 'Granted' : 'Denied');
          
        } catch (error) {
          console.error('❌ Test failed:', error);
        }
      };
      
      testPushNotifications();
    }
  }, [user, session]);

  // Only block on loading when we truly have no session/user yet
  if (loading && !user && !session) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.text }}>Loading...</Text>
        {supabaseError && (
          <Text style={{ marginTop: 8, color: colors.error, textAlign: 'center', paddingHorizontal: 20 }}>
            {supabaseError}
          </Text>
        )}
      </View>
    );
  }

  // If no user AND no session, show auth screens
  if (!user && !session) {
    return (
      <>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: colors.surface,
            },
            headerTintColor: colors.text,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="(auth)" 
            options={{ 
              headerShown: false,
              title: 'Authentication'
            }} 
          />
        </Stack>
      </>
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="(auth)" 
          options={{ 
            headerShown: false,
            title: 'Authentication'
          }} 
        />
        <Stack.Screen 
          name="(onboarding)" 
          options={{ 
            headerShown: false,
            title: 'Onboarding'
          }} 
        />
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false,
            title: 'Main App'
          }} 
        />
      </Stack>
    </>
  );
}