import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase/client';

export interface OnboardingData {
  // Basic Info
  firstName?: string;
  dateOfBirth?: string;
  gender?: string;
  customGender?: string;
  
  // Photos
  photos?: string[];
  
  // Bio
  bio?: string;
  
  // Interests
  interests?: string[];
  
  // Preferences
  seekingGenders?: string[];
  ageMin?: number;
  ageMax?: number;
  maxDistance?: number;
  relationshipIntent?: string;
  
  // Location
  city?: string;
  country?: string;
  location?: { lat: number; lng: number };
  
  // Package Selection
  selectedPackage?: 'basic' | 'premium';
  
  // Religious & Cultural (Calafdoon specific)
  religiousPractice?: string;
  prayerFrequency?: string;
  hijabPreference?: string;
  dietaryPreference?: string;
  familyInvolvement?: string;
  marriageTimeline?: string;
  educationLevel?: string;
  occupation?: string;
  livingSituation?: string;
  hasChildren?: boolean;
  wantsChildren?: boolean;
  ethnicity?: string;
  languages?: string[];
  tribeClan?: string;
  values?: string[];
}

interface OnboardingContextType {
  data: OnboardingData;
  updateData: (newData: Partial<OnboardingData>) => void;
  resetData: () => void;
  saveToDatabase: () => Promise<void>;
  loadFromDatabase: () => Promise<void>;
  isLoading: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<OnboardingData>({
    ageMin: 22,
    ageMax: 35,
    maxDistance: 50,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Save current data to database
  const saveToDatabase = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      
      if (!user) {
        console.log('[OnboardingContext] No user, skipping save');
        return;
      }

      console.log('[OnboardingContext] 💾 Saving to database...');

      // Calculate age from date of birth
      const calculatedAge = data.dateOfBirth ? 
        new Date().getFullYear() - new Date(data.dateOfBirth).getFullYear() : null;

      // Build profile data
      const profileData: Record<string, any> = {
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      if (data.firstName) profileData.first_name = data.firstName;
      if (data.dateOfBirth) profileData.date_of_birth = data.dateOfBirth;
      if (data.gender) profileData.gender = data.gender;
      if (data.customGender) profileData.custom_gender = data.customGender;
      if (data.bio) profileData.bio = data.bio;
      if (data.photos && data.photos.length > 0) profileData.photos = data.photos;
      if (data.interests && data.interests.length > 0) profileData.interests = data.interests;
      if (data.city) profileData.city = data.city;
      if (data.country) profileData.country = data.country;
      // Skip location for now - it requires PostGIS geography type
      // City and country are sufficient for matching
      // if (data.location) {
      //   profileData.location = `SRID=4326;POINT(${data.location.lng} ${data.location.lat})`;
      // }
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

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'user_id', ignoreDuplicates: false });

      if (profileError) {
        console.error('[OnboardingContext] Profile save error:', profileError);
      } else {
        console.log('[OnboardingContext] ✅ Profile saved');
      }

      // Save preferences
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

      if (Object.keys(preferencesData).length > 2) {
        const { error: prefsError } = await supabase
          .from('preferences')
          .upsert(preferencesData, { onConflict: 'user_id', ignoreDuplicates: false });

        if (prefsError) {
          console.error('[OnboardingContext] Preferences save error:', prefsError);
        } else {
          console.log('[OnboardingContext] ✅ Preferences saved');
        }
      }
    } catch (error) {
      console.error('[OnboardingContext] Save error:', error);
    }
  }, [data]);

  // Load saved data from database
  const loadFromDatabase = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      
      if (!user) {
        console.log('[OnboardingContext] No user, skipping load');
        setIsLoading(false);
        return;
      }

      console.log('[OnboardingContext] 📂 Loading from database...');

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const { data: preferences } = await supabase
        .from('preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        const loadedData: OnboardingData = {
          firstName: profile.first_name || undefined,
          dateOfBirth: profile.date_of_birth || undefined,
          gender: profile.gender || undefined,
          customGender: profile.custom_gender || undefined,
          bio: profile.bio || undefined,
          photos: profile.photos || [],
          interests: profile.interests || [],
          city: profile.city || undefined,
          country: profile.country || undefined,
          religiousPractice: profile.religious_practice || undefined,
          prayerFrequency: profile.prayer_frequency || undefined,
          hijabPreference: profile.hijab_preference || undefined,
          dietaryPreference: profile.dietary_preference || undefined,
          familyInvolvement: profile.family_involvement || undefined,
          marriageTimeline: profile.marriage_timeline || undefined,
          educationLevel: profile.education_level || undefined,
          occupation: profile.occupation || undefined,
          livingSituation: profile.living_situation || undefined,
          hasChildren: profile.has_children ?? undefined,
          wantsChildren: profile.wants_children ?? undefined,
          ethnicity: profile.ethnicity || undefined,
          languages: profile.languages || [],
          tribeClan: profile.tribe_clan || undefined,
          seekingGenders: preferences?.seeking_genders || [],
          ageMin: preferences?.age_min || 22,
          ageMax: preferences?.age_max || 35,
          maxDistance: preferences?.max_distance_km || 50,
          relationshipIntent: preferences?.relationship_intent || undefined,
          values: preferences?.values || [],
        };

        console.log('[OnboardingContext] ✅ Loaded data:', loadedData);
        setData(prev => ({ ...prev, ...loadedData }));
      }
    } catch (error) {
      console.error('[OnboardingContext] Load error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadFromDatabase();
  }, []);

  const updateData = useCallback((newData: Partial<OnboardingData>) => {
    console.log('[OnboardingContext] Updating data:', newData);
    setData(prev => {
      const updated = { ...prev, ...newData };
      console.log('[OnboardingContext] Updated data:', updated);
      return updated;
    });
  }, []);

  const resetData = useCallback(() => {
    console.log('[OnboardingContext] Resetting data');
    setData({
      ageMin: 22,
      ageMax: 35,
      maxDistance: 50,
    });
  }, []);

  return (
    <OnboardingContext.Provider value={{ data, updateData, resetData, saveToDatabase, loadFromDatabase, isLoading }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}
