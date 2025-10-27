import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { colors } from '../../components/theme/colors';
import { useAuth } from '../../hooks/useAuth';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useProfile } from '../../hooks/useProfile';
import { supabase } from '../../services/supabase/client';

export default function CompleteScreen() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const { data: onboardingData, resetData } = useOnboarding();
  const { createProfile } = useProfile();
  const [saving, setSaving] = useState(false);

  const handleComplete = async () => {
    console.log('🚀 Let\'s Go button pressed!');
    setSaving(true);
    
    console.log('📋 Onboarding data:', onboardingData);
    console.log('👤 Current user:', user?.id);
    
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.error('❌ Operation timed out after 30 seconds');
      setSaving(false);
      Alert.alert(
        'Timeout',
        'The operation is taking too long. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    }, 30000); // 30 seconds
    
    try {
      if (!user) {
        console.error('❌ No user logged in');
        clearTimeout(timeout);
        setSaving(false);
        Alert.alert('Error', 'No user logged in. Please sign in again.');
        return;
      }

      if (!onboardingData) {
        console.error('❌ No onboarding data found');
        clearTimeout(timeout);
        setSaving(false);
        Alert.alert('Error', 'No onboarding data found. Please complete the onboarding steps.');
        return;
      }

      console.log('💾 Creating profile with optimized approach...');
      
      // Calculate age
      const calculatedAge = onboardingData.dateOfBirth ? 
        new Date().getFullYear() - new Date(onboardingData.dateOfBirth).getFullYear() : 25;

      // Create profile data
      const profileData = {
        user_id: user.id,
        first_name: onboardingData.firstName || '',
        date_of_birth: onboardingData.dateOfBirth || '1995-01-01',
        gender: onboardingData.gender || 'prefer_not_to_say',
        custom_gender: onboardingData.customGender || null,
        bio: onboardingData.bio || '',
        photos: onboardingData.photos || [],
        primary_photo_idx: 0,
        location: onboardingData.location || null,
        city: onboardingData.city || null,
        country: onboardingData.country || null,
        interests: onboardingData.interests || [],
        age: calculatedAge,
      };

      // Create preferences data
      const preferencesData = {
        user_id: user.id,
        seeking_genders: onboardingData.seekingGenders || [],
        age_min: onboardingData.ageMin || 18,
        age_max: onboardingData.ageMax || 100,
        max_distance_km: onboardingData.maxDistance || 50,
        relationship_intent: onboardingData.relationshipIntent || 'casual',
      };

      console.log('📋 Profile data:', profileData);
      console.log('📋 Preferences data:', preferencesData);

      // Insert/update profile
      const { data: profileResult, error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (profileError) {
        console.error('❌ Profile error:', profileError);
        clearTimeout(timeout);
        setSaving(false);
        Alert.alert('Error', `Failed to save profile: ${profileError.message}`);
        return;
      }

      // Insert/update preferences
      const { data: prefsResult, error: prefsError } = await supabase
        .from('preferences')
        .upsert(preferencesData, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (prefsError) {
        console.error('❌ Preferences error:', prefsError);
        clearTimeout(timeout);
        setSaving(false);
        Alert.alert('Error', `Failed to save preferences: ${prefsError.message}`);
        return;
      }

      const data = { profile: profileResult, preferences: prefsResult, success: true };
      const apiError = null;

      if (apiError) {
        console.error('❌ Profile creation/update error:', apiError);
        console.error('❌ Error details:', {
          code: apiError.code || apiError.error_code,
          message: apiError.message || apiError.error,
          details: apiError.details,
          hint: apiError.hint
        });
        clearTimeout(timeout);
        setSaving(false);
        Alert.alert('Error', `Failed to save profile: ${apiError.message || apiError.error}`);
        return;
      }

      if (!data || !data.success) {
        console.error('❌ No data returned from profile operation or operation failed');
        clearTimeout(timeout);
        setSaving(false);
        Alert.alert('Error', 'No data returned from profile operation');
        return;
      }

      console.log('✅ Profile operation successful:', data);
      
      // Clear the timeout since operation succeeded
      clearTimeout(timeout);
      
      // Wait a moment for the profile to be saved
      console.log('⏳ Waiting for profile to be saved...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh the profile data in useAuth
      console.log('🔄 Refreshing profile data...');
      await refreshProfile();
      
      console.log('🎉 Navigating to main app...');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('❌ Error completing onboarding:', error);
      clearTimeout(timeout);
      Alert.alert(
        'Error', 
        `Failed to complete onboarding: ${error.message}`,
        [
          { text: 'Try Again', onPress: () => setSaving(false) },
          { text: 'Skip', onPress: () => router.replace('/(tabs)') }
        ]
      );
    } finally {
      setSaving(false);
    }
  };

  // Debug: Log onboarding data when component renders
  React.useEffect(() => {
    console.log('[CompleteScreen] Component rendered');
    console.log('[CompleteScreen] Onboarding data:', onboardingData);
    console.log('[CompleteScreen] User:', user?.id);
    console.log('[CompleteScreen] Saving state:', saving);
  }, [onboardingData, user, saving]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon with Animation */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark" size={80} color="#fff" />
          </View>
          <View style={styles.celebrationEmojis}>
            <Text style={styles.emoji}>🎉</Text>
            <Text style={styles.emoji}>✨</Text>
            <Text style={styles.emoji}>🎊</Text>
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>You're all set!</Text>
          <Text style={styles.subtitle}>
            Your profile is ready. Let's find your perfect match!
          </Text>
        </View>

        {/* Profile Summary */}
        <View style={styles.summarySection}>
          <SummaryItem icon="person" label="Profile created" />
          <SummaryItem icon="images" label="Photos added" />
          <SummaryItem icon="heart" label="Interests selected" />
          <SummaryItem icon="settings" label="Preferences set" />
        </View>

        {/* Next Steps */}
        <View style={styles.nextStepsSection}>
          <Text style={styles.nextStepsTitle}>What's next?</Text>
          <View style={styles.stepsList}>
            <StepItem
              number="1"
              text="Start swiping to find matches"
            />
            <StepItem
              number="2"
              text="Complete focus sessions to earn more swipes"
            />
            <StepItem
              number="3"
              text="Send messages to your matches"
            />
          </View>
        </View>
      </View>

      {/* Start Button */}
      <View style={styles.footer}>
        <Button
          title={saving ? 'Setting up your profile...' : "Let's Go! 🚀"}
          onPress={handleComplete}
          disabled={saving}
          style={styles.startButton}
        />
        {saving && (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={styles.loader}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function SummaryItem({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.summaryItem}>
      <View style={styles.summaryIcon}>
        <Ionicons name={icon as any} size={20} color={colors.primary} />
      </View>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
    </View>
  );
}

function StepItem({ number, text }: { number: string; text: string }) {
  return (
    <View style={styles.stepItem}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{number}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 48,
    position: 'relative',
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  celebrationEmojis: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    position: 'absolute',
    fontSize: 32,
  },
  titleSection: {
    marginBottom: 48,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  summarySection: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    marginBottom: 32,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryLabel: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  nextStepsSection: {
    backgroundColor: `${colors.primary}10`,
    borderRadius: 16,
    padding: 20,
  },
  nextStepsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  stepsList: {
    gap: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  startButton: {
    paddingVertical: 18,
  },
  loader: {
    marginTop: 16,
  },
});
