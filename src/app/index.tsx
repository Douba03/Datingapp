import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
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

export default function IndexScreen() {
  const { user, profile, session, loading } = useAuth();

  // Only block when we truly have no session/user yet
  if (loading && !user && !session) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (user || session) {
    // Check if user has completed onboarding by looking for a real profile
    // A user has completed onboarding if they have a profile with:
    // 1. A real first_name (not just email prefix)
    // 2. Bio or photos (indicating they went through onboarding)
    const emailPrefix = ((user?.email || session?.user?.email || '').split('@')[0]) || '';
    const hasCompletedOnboarding = !!profile && (
      (profile.first_name && profile.first_name !== emailPrefix) ||
      (profile.bio && profile.bio.length > 0) ||
      (profile.photos && profile.photos.length > 0) ||
      (profile.interests && profile.interests.length > 0)
    );
    
    console.log('[IndexScreen] Onboarding check:', {
      hasProfile: !!profile,
      firstName: profile?.first_name,
      emailPrefix,
      hasBio: !!(profile?.bio && profile.bio.length > 0),
      hasPhotos: !!(profile?.photos && profile.photos.length > 0),
      hasInterests: !!(profile?.interests && profile.interests.length > 0),
      hasCompletedOnboarding
    });
    
    if (hasCompletedOnboarding || session) {
      return <Redirect href="/(tabs)" />;
    } else {
      return <Redirect href="/(onboarding)/welcome" />;
    }
  }

  // No session and no user -> go to login
  return <Redirect href="/(auth)/login" />;
}
