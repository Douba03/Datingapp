import { useCallback } from 'react';
import { supabase } from '../services/supabase/client';
import { OnboardingData } from '../contexts/OnboardingContext';

/**
 * Hook to persist onboarding data to the database after each step.
 * This ensures data is not lost if the user refreshes or the app crashes.
 */
export function useOnboardingPersist() {
  
  /**
   * Save current onboarding progress to the database.
   * Updates both profiles and preferences tables with available data.
   */
  const saveProgress = useCallback(async (data: OnboardingData, currentStep: number) => {
    try {
      // Get current user
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      
      if (!user) {
        console.log('[OnboardingPersist] No user logged in, skipping save');
        return { success: false, error: 'No user logged in' };
      }

      console.log('[OnboardingPersist] Saving progress for step:', currentStep);
      console.log('[OnboardingPersist] Data to save:', JSON.stringify(data, null, 2));

      // Calculate age from date of birth
      const calculatedAge = data.dateOfBirth ? 
        new Date().getFullYear() - new Date(data.dateOfBirth).getFullYear() : null;

      // Build profile data from available onboarding data
      const profileData: Record<string, any> = {
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      // Only include fields that have been filled in
      if (data.firstName) profileData.first_name = data.firstName;
      if (data.dateOfBirth) profileData.date_of_birth = data.dateOfBirth;
      if (data.gender) profileData.gender = data.gender;
      if (data.customGender) profileData.custom_gender = data.customGender;
      if (data.bio) profileData.bio = data.bio;
      if (data.photos && data.photos.length > 0) profileData.photos = data.photos;
      if (data.interests && data.interests.length > 0) profileData.interests = data.interests;
      if (data.city) profileData.city = data.city;
      if (data.country) profileData.country = data.country;
      if (data.location) {
        profileData.location = `POINT(${data.location.lng} ${data.location.lat})`;
      }
      if (calculatedAge) profileData.age = calculatedAge;
      
      // Religious & Cultural fields
      if (data.religiousPractice) profileData.religious_practice = data.religiousPractice;
      if (data.prayerFrequency) profileData.prayer_frequency = data.prayerFrequency;
      if (data.hijabPreference) profileData.hijab_preference = data.hijabPreference;
      if (data.dietaryPreference) profileData.dietary_preference = data.dietaryPreference;
      if (data.familyInvolvement) profileData.family_involvement = data.familyInvolvement;
      if (data.marriageTimeline) profileData.marriage_timeline = data.marriageTimeline;
      
      // Background fields
      if (data.educationLevel) profileData.education_level = data.educationLevel;
      if (data.occupation) profileData.occupation = data.occupation;
      if (data.livingSituation) profileData.living_situation = data.livingSituation;
      if (data.hasChildren !== undefined) profileData.has_children = data.hasChildren;
      if (data.wantsChildren !== undefined) profileData.wants_children = data.wantsChildren;
      if (data.ethnicity) profileData.ethnicity = data.ethnicity;
      if (data.languages && data.languages.length > 0) profileData.languages = data.languages;
      if (data.tribeClan) profileData.tribe_clan = data.tribeClan;

      // Save profile data
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        });

      if (profileError) {
        console.error('[OnboardingPersist] Profile save error:', profileError);
        return { success: false, error: profileError.message };
      }

      console.log('[OnboardingPersist] ✅ Profile saved successfully');

      // Build preferences data if available
      const preferencesData: Record<string, any> = {
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      if (data.seekingGenders && data.seekingGenders.length > 0) {
        preferencesData.seeking_genders = data.seekingGenders;
      }
      if (data.ageMin) preferencesData.age_min = data.ageMin;
      if (data.ageMax) preferencesData.age_max = data.ageMax;
      if (data.maxDistance) preferencesData.max_distance_km = data.maxDistance;
      if (data.relationshipIntent) preferencesData.relationship_intent = data.relationshipIntent;
      if (data.values && data.values.length > 0) preferencesData.values = data.values;

      // Only save preferences if we have data beyond user_id
      if (Object.keys(preferencesData).length > 2) {
        const { error: prefsError } = await supabase
          .from('preferences')
          .upsert(preferencesData, { 
            onConflict: 'user_id',
            ignoreDuplicates: false 
          });

        if (prefsError) {
          console.error('[OnboardingPersist] Preferences save error:', prefsError);
          // Don't fail completely if preferences fail
        } else {
          console.log('[OnboardingPersist] ✅ Preferences saved successfully');
        }
      }

      return { success: true, error: null };
    } catch (error: any) {
      console.error('[OnboardingPersist] Unexpected error:', error);
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Load previously saved onboarding progress from the database.
   */
  const loadProgress = useCallback(async (): Promise<OnboardingData | null> => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      
      if (!user) {
        console.log('[OnboardingPersist] No user logged in, cannot load progress');
        return null;
      }

      console.log('[OnboardingPersist] Loading saved progress for user:', user.id);

      // Load profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        console.log('[OnboardingPersist] No saved profile found');
        return null;
      }

      // Load preferences data
      const { data: preferences } = await supabase
        .from('preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Convert database data back to OnboardingData format
      const onboardingData: OnboardingData = {
        firstName: profile.first_name || undefined,
        dateOfBirth: profile.date_of_birth || undefined,
        gender: profile.gender || undefined,
        customGender: profile.custom_gender || undefined,
        bio: profile.bio || undefined,
        photos: profile.photos || [],
        interests: profile.interests || [],
        city: profile.city || undefined,
        country: profile.country || undefined,
        // Religious & Cultural
        religiousPractice: profile.religious_practice || undefined,
        prayerFrequency: profile.prayer_frequency || undefined,
        hijabPreference: profile.hijab_preference || undefined,
        dietaryPreference: profile.dietary_preference || undefined,
        familyInvolvement: profile.family_involvement || undefined,
        marriageTimeline: profile.marriage_timeline || undefined,
        // Background
        educationLevel: profile.education_level || undefined,
        occupation: profile.occupation || undefined,
        livingSituation: profile.living_situation || undefined,
        hasChildren: profile.has_children ?? undefined,
        wantsChildren: profile.wants_children ?? undefined,
        ethnicity: profile.ethnicity || undefined,
        languages: profile.languages || [],
        tribeClan: profile.tribe_clan || undefined,
        // Preferences
        seekingGenders: preferences?.seeking_genders || [],
        ageMin: preferences?.age_min || 22,
        ageMax: preferences?.age_max || 35,
        maxDistance: preferences?.max_distance_km || 50,
        relationshipIntent: preferences?.relationship_intent || undefined,
        values: preferences?.values || [],
      };

      console.log('[OnboardingPersist] ✅ Loaded saved progress:', onboardingData);
      return onboardingData;
    } catch (error: any) {
      console.error('[OnboardingPersist] Error loading progress:', error);
      return null;
    }
  }, []);

  return {
    saveProgress,
    loadProgress,
  };
}
