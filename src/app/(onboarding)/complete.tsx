import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { colors } from '../../components/theme/colors';
import { useAuth } from '../../hooks/useAuth';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { supabase } from '../../services/supabase/client';
import { locationToPoint } from '../../utils/location';

export default function CompleteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshProfile } = useAuth();
  const { data: onboardingData, resetData } = useOnboarding();
  const [saving, setSaving] = useState(false);
  
  // Animations
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entry animations
      Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ),
    ]).start();

    // Confetti animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(confettiAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(confettiAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleComplete = async () => {
    setSaving(true);
    
    try {
      if (!user) {
        Alert.alert('Error', 'No user logged in. Please sign in again.');
        setSaving(false);
        return;
      }

      if (!onboardingData) {
        Alert.alert('Error', 'No onboarding data found.');
        setSaving(false);
        return;
      }

      const calculatedAge = onboardingData.dateOfBirth ? 
        new Date().getFullYear() - new Date(onboardingData.dateOfBirth).getFullYear() : 25;

      const profileData = {
        user_id: user.id,
        first_name: onboardingData.firstName || '',
        date_of_birth: onboardingData.dateOfBirth || '1995-01-01',
        gender: onboardingData.gender || 'prefer_not_to_say',
        custom_gender: onboardingData.customGender || null,
        bio: onboardingData.bio || '',
        photos: onboardingData.photos || [],
        primary_photo_idx: 0,
        location: locationToPoint(onboardingData.location),
        city: onboardingData.city || null,
        country: onboardingData.country || null,
        interests: onboardingData.interests || [],
        age: calculatedAge,
        // Cultural & Religious fields
        religious_practice: onboardingData.religiousPractice || null,
        prayer_frequency: onboardingData.prayerFrequency || null,
        hijab_preference: onboardingData.hijabPreference || null,
        dietary_preference: onboardingData.dietaryPreference || null,
        family_involvement: onboardingData.familyInvolvement || null,
        marriage_timeline: onboardingData.marriageTimeline || null,
        // Background fields
        education_level: onboardingData.educationLevel || null,
        occupation: onboardingData.occupation || null,
        living_situation: onboardingData.livingSituation || null,
        has_children: onboardingData.hasChildren || null,
        wants_children: onboardingData.wantsChildren || null,
        ethnicity: onboardingData.ethnicity || null,
        languages: onboardingData.languages || [],
        tribe_clan: onboardingData.tribeClan || null,
      };

      const preferencesData = {
        user_id: user.id,
        seeking_genders: onboardingData.seekingGenders || [],
        age_min: onboardingData.ageMin || 18,
        age_max: onboardingData.ageMax || 100,
        max_distance_km: onboardingData.maxDistance || 50,
        relationship_intent: onboardingData.relationshipIntent || 'casual',
        values: onboardingData.values || [],
      };

      console.log('========================================');
      console.log('[Complete] 📊 RAW ONBOARDING DATA:');
      console.log('[Complete] onboardingData:', JSON.stringify(onboardingData, null, 2));
      console.log('========================================');
      console.log('[Complete] 📊 SAVING PROFILE DATA:');
      console.log('[Complete] Photos:', profileData.photos);
      console.log('[Complete] Bio:', profileData.bio);
      console.log('[Complete] First Name:', profileData.first_name);
      console.log('[Complete] Gender:', profileData.gender);
      console.log('[Complete] Interests:', profileData.interests);
      console.log('[Complete] Religious Practice:', profileData.religious_practice);
      console.log('[Complete] All Profile Data:', JSON.stringify(profileData, null, 2));
      console.log('========================================');
      console.log('[Complete] 📊 SAVING PREFERENCES DATA:');
      console.log('[Complete] Seeking Genders:', preferencesData.seeking_genders);
      console.log('[Complete] All Preferences Data:', JSON.stringify(preferencesData, null, 2));
      console.log('========================================');

      const { data: savedProfile, error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (profileError) {
        console.error('[Complete] ❌ Profile save error:', profileError);
        Alert.alert('Error', `Failed to save profile: ${profileError.message}`);
        setSaving(false);
        return;
      }

      console.log('[Complete] ✅ Profile saved successfully:', savedProfile);
      console.log('[Complete] Profile ID:', savedProfile?.user_id);
      console.log('[Complete] Profile name:', savedProfile?.first_name);

      const { data: savedPrefs, error: prefsError } = await supabase
        .from('preferences')
        .upsert(preferencesData, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (prefsError) {
        console.error('[Complete] ❌ Preferences save error:', prefsError);
        Alert.alert('Error', `Failed to save preferences: ${prefsError.message}`);
        setSaving(false);
        return;
      }

      console.log('[Complete] ✅ Preferences saved successfully:', savedPrefs);

      // Initialize request counter for new user
      const { data: counterData, error: counterError } = await supabase
        .from('request_counters')
        .upsert({
          user_id: user.id,
          remaining: 10, // Default daily requests
          last_exhausted_at: null,
          next_refill_at: null,
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (counterError) {
        console.error('[Complete] Failed to initialize request counter:', counterError);
      } else {
        console.log('[Complete] Request counter initialized successfully:', counterData);
      }

      // Refresh profile and navigate immediately
      await refreshProfile();
      router.push('/(onboarding)/package-selection');
    } catch (error: any) {
      Alert.alert('Error', `Failed to complete: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinearGradient
      colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
      style={styles.container}
    >
      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            }
          ]}
        >
          <LinearGradient
            colors={[colors.success, '#34D399']}
            style={styles.iconGradient}
          >
            <Ionicons name="checkmark" size={64} color="#fff" />
          </LinearGradient>
          
          {/* Animated ring */}
          <Animated.View 
            style={[
              styles.ring,
              { transform: [{ rotate: spin }] }
            ]}
          />
          
          {/* Decorative elements */}
          <View style={[styles.decorCircle, styles.circle1]} />
          <View style={[styles.decorCircle, styles.circle2]} />
          <View style={[styles.decorCircle, styles.circle3]} />
        </Animated.View>

        {/* Title */}
        <Animated.View style={[styles.titleSection, { opacity: fadeAnim }]}>
          <Text style={styles.title}>You're all set!</Text>
          <Text style={styles.subtitle}>
            Your Calafdoon profile is ready.{'\n'}Let's find your life partner!
          </Text>
        </Animated.View>

        {/* Summary Cards */}
        <Animated.View style={[styles.summarySection, { opacity: fadeAnim }]}>
          <SummaryItem icon="person" label="Profile Created" color="#0B1F3B" />
          <SummaryItem icon="images" label="Photos Added" color="#10B981" />
          <SummaryItem icon="heart" label="Values Selected" color="#C8A15A" />
          <SummaryItem icon="options" label="Preferences Set" color="#6B7280" />
        </Animated.View>

        {/* What's Next */}
        <Animated.View style={[styles.nextSection, { opacity: fadeAnim }]}>
          <Text style={styles.nextTitle}>What happens next?</Text>
          <View style={styles.stepsList}>
            <StepItem number="1" text="Browse serious profiles" />
            <StepItem number="2" text="Send interest requests" />
            <StepItem number="3" text="Chat when accepted!" />
          </View>
        </Animated.View>
      </ScrollView>

      {/* Fixed Footer Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleComplete}
          disabled={saving}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            {saving ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.buttonText}>Setting up...</Text>
              </>
            ) : (
              <>
                <Ionicons name="rocket" size={22} color="#fff" />
                <Text style={styles.buttonText}>Let's Go!</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

function SummaryItem({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <View style={styles.summaryItem}>
      <View style={[styles.summaryIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Ionicons name="checkmark-circle" size={22} color={colors.success} />
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 28,
    width: 150,
    height: 150,
    alignSelf: 'center',
  },
  iconGradient: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 2,
  },
  ring: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: `${colors.success}30`,
    borderStyle: 'dashed',
    top: 5,
    left: 5,
    zIndex: 1,
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: colors.success,
    opacity: 0.2,
  },
  circle1: {
    width: 18,
    height: 18,
    top: -5,
    right: '20%',
  },
  circle2: {
    width: 12,
    height: 12,
    bottom: 10,
    left: '22%',
  },
  circle3: {
    width: 8,
    height: 8,
    top: 40,
    right: '15%',
  },
  titleSection: {
    marginBottom: 28,
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
  },
  summarySection: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    gap: 14,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
  },
  nextSection: {
    backgroundColor: `${colors.primary}08`,
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: `${colors.primary}15`,
  },
  nextTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  stepsList: {
    gap: 14,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  ctaButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
