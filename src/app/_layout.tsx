import React, { useEffect } from 'react';
import { Stack, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth, AuthProvider } from '../hooks/useAuth';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { notificationService } from '../services/notifications';
import { supabase } from '../services/supabase/client';
import { PurchaseService } from '../services/iap/purchaseService';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';

const defaultColors = {
  primary: '#FF6B9D',
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

function RootLayoutContent() {
  const { user, session, loading, supabaseError } = useAuth();
  const { colors, isDarkMode } = useTheme();

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
        PurchaseService.cleanup().catch((error) => {
          // Non-critical error - cleanup failure is OK
          console.warn('[IAP] Failed to cleanup (non-critical):', error);
        });
      }
    };
  }, []);

  // Register for push notifications when user is authenticated
  useEffect(() => {
    if (user && session) {
      const registerPushNotifications = async () => {
        try {
          // Register for push notifications
          const token = await notificationService.registerForPushNotifications();
          
          if (token) {
            // Save token to database for real notifications (likes, messages, matches)
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
              console.warn('[Push] Error saving token:', error.message);
            } else {
              console.log('[Push] Token registered successfully');
            }
          }
        } catch (error) {
          console.warn('[Push] Registration failed:', error);
        }
      };
      
      registerPushNotifications();
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
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: colors.surface,
            },
            headerTintColor: colors.text,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            contentStyle: {
              backgroundColor: colors.background,
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
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: colors.background,
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

// Main export wraps with providers
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <ThemeProvider>
            <RootLayoutContent />
          </ThemeProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}