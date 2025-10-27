import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { View, ActivityIndicator } from 'react-native';

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

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, session, loading } = useAuth();

  // Only block when we truly have no user/session yet
  if (loading && !user && !session) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user && !session) {
    return <Redirect href="/(auth)/login" />;
  }

  return <>{children}</>;
}
