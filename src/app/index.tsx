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

  // ALWAYS wait for loading to complete before making routing decisions
  // This prevents redirecting to onboarding before user data is fetched
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // After loading is complete, check if we have a session/user
  if (user || session) {
    // Check if user has completed onboarding
    // Priority 1: Check the onboarding_completed flag in user record
    // Priority 2: Check if profile has real data (fallback for existing users)
    const emailPrefix = ((user?.email || session?.user?.email || '').split('@')[0]) || '';
    
    // Check onboarding_completed flag first (most reliable)
    const onboardingFlagSet = user?.onboarding_completed === true;
    
    // Fallback: Check profile data for existing users who may not have the flag
    const hasProfileData = !!profile && (
      (profile.first_name && profile.first_name !== emailPrefix) ||
      (profile.bio && profile.bio.length > 0) ||
      (profile.photos && profile.photos.length > 0) ||
      (profile.interests && profile.interests.length > 0)
    );
    
    const hasCompletedOnboarding = onboardingFlagSet || hasProfileData;
    
    console.log('[IndexScreen] Onboarding check:', {
      hasUser: !!user,
      hasSession: !!session,
      loading,
      onboardingFlagSet,
      hasProfile: !!profile,
      firstName: profile?.first_name,
      emailPrefix,
      hasBio: !!(profile?.bio && profile.bio.length > 0),
      hasPhotos: !!(profile?.photos && profile.photos.length > 0),
      hasInterests: !!(profile?.interests && profile.interests.length > 0),
      hasProfileData,
      hasCompletedOnboarding
    });
    
    if (hasCompletedOnboarding) {
      return <Redirect href="/(tabs)" />;
    } else {
      return <Redirect href="/(onboarding)/welcome" />;
    }
  }

  // No session and no user -> go to login
  return <Redirect href="/(auth)/login" />;
}
