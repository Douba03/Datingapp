import React, { useEffect } from 'react';
import { Stack, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../hooks/useAuth';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { notificationService } from '../services/notifications';
import { supabase } from '../services/supabase/client';
import { PurchaseService } from '../services/iap/purchaseService';

const colors = {
  primary: '#6366F1',
  secondary: '#F97316',
  accent: '#10B981',
  background: '#FAFBFC',
  surface: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  like: '#EC4899',
  pass: '#9CA3AF',
  superlike: '#8B5CF6',
};

export default function RootLayout() {
  const { user, session, loading, supabaseError } = useAuth();

  // Initialize IAP when app starts (fails gracefully if not available)
  useEffect(() => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      PurchaseService.initialize().catch((error) => {
        // Non-critical error - IAP is optional, app should still work
        console.warn('[IAP] Failed to initialize (non-critical):', error);
      });
    }

    // Cleanup on unmount
    return () => {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        PurchaseService.disconnect().catch((error) => {
          // Non-critical error - cleanup failure is OK
          console.warn('[IAP] Failed to disconnect (non-critical):', error);
        });
      }
    };
  }, []);

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
  // Add timeout fallback - if loading takes more than 10 seconds, show auth screen
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
        <Text style={{ marginTop: 8, color: colors.textSecondary, fontSize: 12, textAlign: 'center', paddingHorizontal: 20 }}>
          If this takes too long, check your internet connection
        </Text>
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