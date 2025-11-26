import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { View, ActivityIndicator } from 'react-native';

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
