import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase/client';
import { Profile, Swipe, SwipeCounter } from '../types/user';
import { useAuth } from './useAuth';
import { calculateDistance, isWithinDistance } from '../utils/location';
import { SWIPE_CONSTANTS } from '../constants/swipes';
import { AppState, AppStateStatus } from 'react-native';

export function useMatches() {
  const { user, profile } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [swipeCounter, setSwipeCounter] = useState<SwipeCounter | null>(null);
  const [loading, setLoading] = useState(true);
  const lastFetchRef = useRef<number>(0);
  const profilesLengthRef = useRef<number>(0);
  
  // Keep ref in sync with state
  useEffect(() => {
    profilesLengthRef.current = profiles.length;
  }, [profiles.length]);

  useEffect(() => {
    if (!user || !profile) return;

    fetchSwipeCounter();
    fetchPotentialMatches();

    // Subscribe to new profiles being created
    const profileSubscription = supabase
      .channel('new-profiles')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profiles' },
        (payload) => {
          console.log('[useMatches] New profile created:', payload.new);
          console.log('[useMatches] Current profiles count:', profilesLengthRef.current);
          // Always refetch when a new profile is created - especially important when we have no profiles
          // Use ref to get current value instead of stale closure
          if (profilesLengthRef.current === 0) {
            console.log('[useMatches] No profiles currently shown, fetching new profiles...');
            fetchPotentialMatches();
          } else {
            // Even if we have profiles, check if the new profile should be added
            // Debounce to avoid too many fetches
            const now = Date.now();
            if (now - lastFetchRef.current > 5000) { // 5 seconds debounce
              console.log('[useMatches] Refreshing to include new profile...');
              fetchPotentialMatches();
            }
          }
        }
      )
      .subscribe();

    // Refresh when app comes to foreground (if it's been more than 30 seconds)
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        const now = Date.now();
        if (now - lastFetchRef.current > 30000) { // 30 seconds
          console.log('[useMatches] App came to foreground, refreshing profiles...');
          fetchPotentialMatches();
        }
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      profileSubscription.unsubscribe();
      appStateSubscription.remove();
    };
  }, [user?.id, profile?.user_id]);

  const fetchSwipeCounter = async () => {
    if (!user) return;

    try {
      let counter: SwipeCounter | null = null;

      // First, try to call the refill check function to refill expired timers
      try {
        await supabase.rpc('check_and_refill_swipes');
        console.log('[useMatches] Checked for swipe refills');
      } catch (refillError) {
        console.warn('[useMatches] Could not check refills (function may not exist):', refillError);
      }

      const { data, error } = await supabase
        .from('swipe_counters')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        console.warn(`[useMatches] No swipe counter found; creating one with ${SWIPE_CONSTANTS.MAX_SWIPES} remaining`);
        const { data: created, error: createError } = await supabase
          .from('swipe_counters')
          .insert({ user_id: user.id, remaining: SWIPE_CONSTANTS.MAX_SWIPES })
          .select()
          .single();

        if (createError) {
          console.error('[useMatches] Failed to create swipe counter:', createError);
        } else {
          counter = created as unknown as SwipeCounter;
        }
      } else {
        // Check if refill time has passed and we need to refill locally
        const counterData = data as any;
        if (counterData.next_refill_at && counterData.remaining <= 0) {
          const refillTime = new Date(counterData.next_refill_at);
          const now = new Date();
          
          if (now >= refillTime) {
            console.log(`[useMatches] Refill time passed, refilling swipes to ${SWIPE_CONSTANTS.MAX_SWIPES}`);
            // Refill the swipes
            const { data: refilled, error: refillError } = await supabase
              .from('swipe_counters')
              .update({
                remaining: SWIPE_CONSTANTS.MAX_SWIPES,
                last_exhausted_at: null,
                next_refill_at: null,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', user.id)
              .select()
              .single();
            
            if (refillError) {
              console.error('[useMatches] Failed to refill swipes:', refillError);
              counter = counterData as SwipeCounter;
            } else {
              counter = refilled as unknown as SwipeCounter;
              console.log('[useMatches] Swipes refilled successfully:', counter);
            }
          } else {
            counter = counterData as SwipeCounter;
            console.log('[useMatches] Swipes exhausted, refill at:', refillTime);
          }
        } else {
          counter = counterData as SwipeCounter;
        }
      }

      console.log('[useMatches] Swipe counter:', { 
        remaining: counter?.remaining, 
        next_refill_at: counter?.next_refill_at 
      });
      setSwipeCounter(counter);
    } catch (error) {
      console.error('Error fetching/creating swipe counter:', error);
    }
  };

  const fetchPotentialMatches = async () => {
    if (!user || !profile) return;

    try {
      setLoading(true);
      lastFetchRef.current = Date.now();
      console.log('[useMatches] Fetching potential matches for user:', user.id);
      console.log('[useMatches] Current profile:', profile);

      // Get already swiped user IDs
      const { data: swipedUsers } = await supabase
        .from('swipes')
        .select('target_user_id')
        .eq('swiper_user_id', user.id);
      // Get blocked users (both directions) and exclude
      const { data: myBlocks } = await supabase
        .from('user_blocks')
        .select('blocked_user_id')
        .eq('blocker_user_id', user.id);

      const { data: blockedMe } = await supabase
        .from('user_blocks')
        .select('blocker_user_id')
        .eq('blocked_user_id', user.id);

      const blockedIds = [
        ...(myBlocks?.map(b => b.blocked_user_id) || []),
        ...(blockedMe?.map(b => b.blocker_user_id) || []),
      ];

      const swipedIds = swipedUsers?.map(s => s.target_user_id) || [];
      console.log('[useMatches] ===== EXCLUSION LISTS =====');
      console.log('[useMatches] Already swiped IDs count:', swipedIds.length);
      console.log('[useMatches] Already swiped IDs:', swipedIds);
      console.log('[useMatches] Blocked IDs:', blockedIds);
      console.log('[useMatches] Current user ID:', user.id);
      console.log('[useMatches] ============================');

      // Build base query - fetch profiles and preferences separately
      // since there's no foreign key relationship defined
      let query = supabase
        .from('profiles')
        .select('*')
        .neq('user_id', user.id);

      // Exclude users already swiped only when we have ids
      if (swipedIds.length > 0) {
        query = query.not('user_id', 'in', `(${swipedIds.join(',')})`);
      }

      // Apply block filter in query when we have ids
      if (blockedIds.length > 0) {
        query = query.not('user_id', 'in', `(${blockedIds.join(',')})`);
      }

      // Get all profiles first - fetch 50 at a time to reduce API calls
      const { data: profilesData, error: profilesError } = await query.limit(50);

      console.log('[useMatches] Raw query result:', { 
        count: profilesData?.length || 0, 
        error: profilesError,
        profiles: profilesData?.map(p => ({ user_id: p.user_id, name: p.first_name, gender: p.gender, age: p.age }))
      });
      
      // DEBUG: Log all profiles found before any filtering
      console.log('[useMatches] ===== ALL PROFILES FROM DB =====');
      profilesData?.forEach(p => {
        console.log(`[useMatches] - ${p.first_name}: gender=${p.gender}, age=${p.age}, user_id=${p.user_id}`);
      });
      console.log('[useMatches] ================================');

      if (profilesError) {
        console.error('[useMatches] Profiles query error:', profilesError);
        throw profilesError;
      }

      if (!profilesData || profilesData.length === 0) {
        console.log('[useMatches] No profiles found after base query');
        console.log('[useMatches] Excluded swiped IDs:', swipedIds);
        console.log('[useMatches] Excluded blocked IDs:', blockedIds);
        setProfiles([]);
        setLoading(false);
        return;
      }

      // Get preferences for all found profiles
      const profileIds = profilesData.map(p => p.user_id);
      const { data: preferencesData, error: prefsError } = await supabase
        .from('preferences')
        .select('*')
        .in('user_id', profileIds);

      if (prefsError) {
        console.error('[useMatches] Preferences query error:', prefsError);
        // Continue without preferences filtering
      }

      // Combine profiles with their preferences
      const profilesWithPrefs = profilesData.map(profile => {
        const preferences = preferencesData?.find(p => p.user_id === profile.user_id);
        return { ...profile, preferences };
      });

      // Apply filters manually and ensure blocks are enforced
      let filteredProfiles = profilesWithPrefs;

      console.log('[useMatches] Raw profiles before filtering:', profilesWithPrefs.length);
      console.log('[useMatches] Current user profile:', { 
        gender: profile.gender, 
        seeking_genders: profile.preferences?.seeking_genders 
      });

      // STRICT GENDER FILTER: Endast visa motsatt kön
      // Man ser endast kvinnor, kvinnor ser endast män
      const currentSeeking = Array.isArray(profile.preferences?.seeking_genders)
        ? (profile.preferences?.seeking_genders as string[])
        : profile.preferences?.seeking_genders
          ? [profile.preferences?.seeking_genders as unknown as string]
          : [];

      console.log('[useMatches] Current user gender:', profile.gender);
      console.log('[useMatches] Current user seeking genders:', currentSeeking);

      // Endast visa profiler vars kön matchar vad användaren söker
      // Om seeking_genders är tom, visa INGET (kräver att användaren väljer)
      if (currentSeeking.length > 0) {
        const beforeGenderFilter = filteredProfiles.length;
        filteredProfiles = filteredProfiles.filter(p => {
          // Endast exakt matchning - inga andra alternativ
          const matches = currentSeeking.includes(p.gender);
          
          if (!matches) {
            console.log(`[useMatches] ❌ Filtering out ${p.first_name} - gender ${p.gender} not in seeking ${currentSeeking}`);
          }
          return matches;
        });
        console.log(`[useMatches] Gender filter (seeking): ${beforeGenderFilter} -> ${filteredProfiles.length}`);
      } else {
        console.log('[useMatches] ⚠️ No seeking_genders set, showing NO profiles (user must set preferences)');
        filteredProfiles = []; // Visa inga profiler om seeking_genders inte är satt
      }

      // NOTE: We do NOT filter based on whether the other person is seeking us
      // All profiles with the correct gender should be visible
      // The compatibility score will prioritize mutual interest

      // Get age preferences (used for scoring, not hard filtering)
      const ageMin = profile.preferences?.age_min ?? 18;
      const ageMax = profile.preferences?.age_max ?? 99;

      // Calculate compatibility scores for ALL filtered profiles
      const now = new Date();
      const profilesWithScores = filteredProfiles.map(p => {
        let score = 0;
        
        // Bonus for mutual interest (they're also seeking our gender) - HIGH PRIORITY
        const theirSeeking = Array.isArray(p.preferences?.seeking_genders)
          ? p.preferences.seeking_genders as string[]
          : p.preferences?.seeking_genders
            ? [p.preferences.seeking_genders as unknown as string]
            : [];
        if (theirSeeking.length > 0 && theirSeeking.includes(profile.gender)) {
          score += 30; // Mutual interest bonus - highest priority
        }
        
        // Bonus for being within age preference
        const profileAge = p.age || 0;
        if (profileAge && profileAge >= ageMin && profileAge <= ageMax) {
          score += 15; // Age preference bonus
        }
        
        // Bonus for having photos
        if (p.photos && p.photos.length > 0) {
          score += 10;
        }
        
        // Bonus for having bio
        if (p.bio && p.bio.trim().length > 0) {
          score += 5;
        }
        
        // Bonus for matching relationship intent
        if (profile.preferences?.relationship_intent && p.preferences?.relationship_intent) {
          if (profile.preferences.relationship_intent === p.preferences.relationship_intent) {
            score += 15;
          }
        }
        
        // Distance bonus (closer = higher score)
        if (profile.preferences?.max_distance_km && profile.location && p.location) {
          const distance = calculateDistance(profile.location, p.location);
          if (!isNaN(distance)) {
            if (distance <= profile.preferences.max_distance_km) {
              score += 10; // Within preferred distance
            } else if (distance <= profile.preferences.max_distance_km * 2) {
              score += 5; // Somewhat close
            }
          }
        }
        
        // Boost bonus (paid feature)
        const isBoosted = p.boost_expires_at && new Date(p.boost_expires_at) > now;
        if (isBoosted) {
          score += 50; // Boosted profiles get priority
        }
        
        return { ...p, compatibilityScore: score };
      });

      // Sort by compatibility score (highest first)
      profilesWithScores.sort((a, b) => {
        const scoreDiff = b.compatibilityScore - a.compatibilityScore;
        if (scoreDiff !== 0) return scoreDiff;
        return Math.random() - 0.5; // Random order for equal scores
      });
      
      // Use the scored profiles - LIMIT TO MAX 20 PROFILES
      const MAX_PROFILES = 20;
      filteredProfiles = profilesWithScores.slice(0, MAX_PROFILES);
      
      console.log('[useMatches] ========== FINAL RESULT ==========');
      console.log('[useMatches] Total matching profiles:', profilesWithScores.length);
      console.log('[useMatches] Limited to:', filteredProfiles.length, '(max', MAX_PROFILES, ')');
      if (filteredProfiles.length === 0) {
        console.log('[useMatches] NO PROFILES TO SHOW - Check filters above');
      } else {
        console.log('[useMatches] Profiles to show:', filteredProfiles.map(p => `${p.first_name} (${p.user_id})`));
      }
      console.log('[useMatches] ================================');
      setProfiles(filteredProfiles);
    } catch (error) {
      console.error('Error fetching potential matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const swipe = async (targetUserId: string, action: 'like' | 'pass' | 'superlike') => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      // Ensure swipe counter exists before attempting a swipe
      if (!swipeCounter) {
        await fetchSwipeCounter();
      }
      
      // Premium users have unlimited swipes - skip the counter check
      if (!user.is_premium && swipeCounter && swipeCounter.remaining <= 0) {
        return { error: new Error('No swipes left') };
      }

      console.log('[useMatches] Swiping:', { targetUserId, action });
      
      // IMPORTANT: The SQL function expects the parameter name "swipe_action"
      // and its type is a Postgres enum (swipe_action).
      const { data, error } = await supabase.rpc('record_swipe', {
        swiper_uuid: user.id,
        target_uuid: targetUserId,
        swipe_action: action,
      });

      if (error) throw error;

      console.log('[useMatches] Swipe result:', data);

      // Update local swipe counter with remaining and next_refill_at
      if (data.remaining !== undefined) {
        setSwipeCounter(prev => {
          if (!prev) return null;
          
          const updated = { ...prev, remaining: data.remaining };
          
          // If swipes are exhausted, set the refill time to 12 hours from now
          if (data.remaining <= 0) {
            const refillTime = new Date();
            refillTime.setHours(refillTime.getHours() + 12);
            updated.next_refill_at = refillTime.toISOString();
            updated.last_exhausted_at = new Date().toISOString();
            console.log('[useMatches] Swipes exhausted, refill at:', updated.next_refill_at);
          }
          
          return updated;
        });
      }

      // Remove swiped profile from list
      setProfiles(prev => prev.filter(p => p.user_id !== targetUserId));

      // Check if it's a match
      if (data.is_match) {
        console.log('[useMatches] 🎉 MATCH! Both users liked each other');
        // The match is automatically created by the database trigger
        // We'll return this info so the UI can show a match notification
        return { data: { ...data, is_match: true }, error: null };
      }

      return { data, error };
    } catch (error) {
      console.error('Error swiping:', error);
      return { error };
    }
  };

  const canSwipe = () => {
    // Premium users can always swipe
    if (user?.is_premium) return true;
    
    if (!swipeCounter) return false;
    return swipeCounter.remaining > 0;
  };

  const getNextRefillTime = () => {
    if (!swipeCounter?.next_refill_at) return null;
    return new Date(swipeCounter.next_refill_at);
  };

  const undoLastSwipe = async (): Promise<{ data?: { success: boolean; action?: string; profile?: Profile }; error?: Error | unknown }> => {
    if (!user) return { error: new Error('No user logged in') };
    
    if (!user.is_premium) {
      return { error: new Error('Premium feature') };
    }

    try {
      // Get last swipe for this user
      const { data: lastSwipe, error: fetchError } = await supabase
        .from('swipes')
        .select('*')
        .eq('swiper_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError || !lastSwipe) {
        console.log('[useMatches] No swipe to undo');
        return { error: new Error('No swipe to undo') };
      }

      const swipeAction = lastSwipe.action;
      const targetUserId = lastSwipe.target_user_id;

      // Delete the last swipe
      const { error: deleteError } = await supabase
        .from('swipes')
        .delete()
        .eq('id', lastSwipe.id);

      if (deleteError) {
        console.error('[useMatches] Error deleting swipe:', deleteError);
        throw deleteError;
      }

      // Fetch the profile that was undone
      const { data: undoneProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (profileError || !undoneProfile) {
        console.error('[useMatches] Error fetching undone profile:', profileError);
        // Still return success, just refetch all
        await fetchPotentialMatches();
        return { data: { success: true, action: swipeAction }, error: null };
      }

      // Add the undone profile back to the front of the list (no loading state!)
      setProfiles(prev => [undoneProfile as Profile, ...prev]);

      console.log('[useMatches] Swipe undone successfully, action was:', swipeAction);
      return { data: { success: true, action: swipeAction, profile: undoneProfile as Profile }, error: null };
    } catch (error) {
      console.error('[useMatches] Error undoing swipe:', error);
      return { error };
    }
  };

  return {
    profiles,
    swipeCounter,
    loading,
    swipe,
    canSwipe,
    getNextRefillTime,
    undoLastSwipe,
    refetch: fetchPotentialMatches,
  };
}
