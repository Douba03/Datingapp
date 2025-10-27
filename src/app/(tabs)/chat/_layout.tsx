import React from 'react';
import { Stack } from 'expo-router';

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

export default function ChatLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
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
        name="[matchId]" 
        options={{ headerShown: false }} 
      />
    </Stack>
  );
}
