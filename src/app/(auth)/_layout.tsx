import React from 'react';
import { Stack } from 'expo-router';

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

export default function AuthLayout() {
  return (
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
        name="login" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="SimpleLogin" 
        options={{ 
          headerShown: false,
        }} 
      />
    </Stack>
  );
}
