import { useState } from 'react';
import { supabase } from '../services/supabase/client';
import { useAuth } from './useAuth';
import { OnboardingData } from '../contexts/OnboardingContext';

export function useProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const createProfile = async (onboardingData: OnboardingData) => {
    if (!user) {
      return { error: new Error('No user logged in') };
    }

    setLoading(true);
    console.log('[useProfile] Creating profile with data:', onboardingData);

    try {
      // 1. Create profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          first_name: onboardingData.firstName || 'User',
          date_of_birth: onboardingData.dateOfBirth || '1995-01-01',
          gender: onboardingData.gender || 'prefer_not_to_say',
          custom_gender: onboardingData.customGender,
          bio: onboardingData.bio || '',
          photos: onboardingData.photos || [],
          primary_photo_idx: 0,
          city: onboardingData.city || 'Unknown',
          country: onboardingData.country || 'Unknown',
          location: onboardingData.location || null,
          interests: onboardingData.interests || [],
          is_verified: false,
        })
        .select()
        .single();

      if (profileError) {
        console.error('[useProfile] Profile error:', profileError);
        throw profileError;
      }

      console.log('[useProfile] Profile created:', profileData);

      // 2. Create preferences
      const { error: prefsError } = await supabase
        .from('preferences')
        .insert({
          user_id: user.id,
          seeking_genders: onboardingData.seekingGenders || [],
          age_min: onboardingData.ageMin || 18,
          age_max: onboardingData.ageMax || 100,
          max_distance_km: onboardingData.maxDistance || 50,
          relationship_intent: onboardingData.relationshipIntent || 'not_sure',
          interests: onboardingData.interests || [],
        });

      if (prefsError) {
        console.error('[useProfile] Preferences error:', prefsError);
        // Don't throw - profile is already created
      } else {
        console.log('[useProfile] Preferences created');
      }

      // 3. Create swipe counter
      const { error: counterError } = await supabase
        .from('swipe_counters')
        .insert({
          user_id: user.id,
          remaining: 10,
        });

      if (counterError) {
        console.error('[useProfile] Swipe counter error:', counterError);
        // Don't throw - profile is already created
      } else {
        console.log('[useProfile] Swipe counter created');
      }

      // 4. Update user metadata to mark onboarding complete
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { onboarding_completed: true }
      });

      if (metadataError) {
        console.error('[useProfile] Metadata error:', metadataError);
      } else {
        console.log('[useProfile] Metadata updated');
      }

      console.log('[useProfile] ✅ Profile creation complete!');
      return { data: profileData, error: null };

    } catch (error) {
      console.error('[useProfile] Error creating profile:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createProfile,
  };
}
