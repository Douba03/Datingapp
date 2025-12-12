import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase/client';
import { Profile, Swipe, SwipeCounter } from '../types/user';
import { useAuth } from './useAuth';
import { calculateDistance, isWithinDistance } from '../utils/location';
import { SWIPE_CONSTANTS } from '../constants/swipes';

export function useMatches() {
  const { user, profile } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [swipeCounter, setSwipeCounter] = useState<SwipeCounter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile) return;

    fetchSwipeCounter();
    fetchPotentialMatches();

    // After onboarding, profile/preferences may be set asynchronously.
    // Refetch once shortly after mount to avoid frozen state until manual refresh.
    const timer = setTimeout(() => {
      fetchSwipeCounter();
      fetchPotentialMatches();
    }, 1200);
    return () => clearTimeout(timer);
  }, [user, profile]);

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
      console.log('[useMatches] Already swiped IDs:', swipedIds);

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

      if (profilesError) {
        console.error('[useMatches] Profiles query error:', profilesError);
        throw profilesError;
      }

      if (!profilesData || profilesData.length === 0) {
        console.log('[useMatches] No profiles found');
        setProfiles([]);
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

      // Apply gender filters
      const currentSeeking = Array.isArray(profile.preferences?.seeking_genders)
        ? (profile.preferences?.seeking_genders as string[])
        : profile.preferences?.seeking_genders
          ? [profile.preferences?.seeking_genders as unknown as string]
          : [];

      // Show only profiles whose gender matches what current user is seeking
      if (currentSeeking.length > 0) {
        filteredProfiles = filteredProfiles.filter(p => currentSeeking.includes(p.gender));
      }

      // Optional mutual filter: include only users who are also seeking our gender (if they set it)
      filteredProfiles = filteredProfiles.filter(p => {
        if (!p.preferences?.seeking_genders) return true; // if target hasn't set preferences, include
        const targetSeeking = Array.isArray(p.preferences.seeking_genders)
          ? p.preferences.seeking_genders as string[]
          : [p.preferences.seeking_genders as unknown as string];
        return targetSeeking.includes(profile.gender);
      });

      // Apply age filter
      const ageMin = profile.preferences?.age_min ?? 18;
      const ageMax = profile.preferences?.age_max ?? 100;
      
      console.log('[useMatches] Age preferences:', { ageMin, ageMax });
      
      const beforeAgeFilter = filteredProfiles.length;
      filteredProfiles = filteredProfiles.filter(p => {
        const profileAge = p.age || 0;
        const withinRange = profileAge >= ageMin && profileAge <= ageMax;
        if (!withinRange) {
          console.log(`[useMatches] Filtering out ${p.first_name} (age: ${profileAge}) - outside range ${ageMin}-${ageMax}`);
        }
        return withinRange;
      });
      console.log(`[useMatches] Age filter: ${beforeAgeFilter} -> ${filteredProfiles.length} profiles`);

      // Apply relationship intent filter
      if (profile.preferences?.relationship_intent) {
        const intent = profile.preferences.relationship_intent;
        filteredProfiles = filteredProfiles.filter(p => 
          !p.preferences?.relationship_intent || 
          p.preferences.relationship_intent === intent
        );
      }

      // Apply distance filter
      if (profile.preferences?.max_distance_km && profile.location) {
        const maxDistance = profile.preferences.max_distance_km;
        const currentLocation = profile.location;
        filteredProfiles = filteredProfiles.filter(p => {
          if (!p.location) return true; // Include if no location data
          
          const distance = calculateDistance(currentLocation, p.location);
          const withinDistance = distance <= maxDistance;
          
          console.log(`[useMatches] Distance to ${p.first_name}: ${distance}km (max: ${maxDistance}km, within: ${withinDistance})`);
          
          return withinDistance;
        });
      }

      // PRIORITY BOOST: Sort profiles so boosted ones appear first
      // Boosted profiles are those where boost_expires_at > NOW()
      const now = new Date();
      filteredProfiles.sort((a, b) => {
        const aBoosted = a.boost_expires_at && new Date(a.boost_expires_at) > now;
        const bBoosted = b.boost_expires_at && new Date(b.boost_expires_at) > now;
        
        if (aBoosted && !bBoosted) return -1; // a comes first
        if (!aBoosted && bBoosted) return 1;  // b comes first
        return 0; // Keep original order
      });
      
      console.log('[useMatches] Found profiles:', filteredProfiles.length);
      console.log('[useMatches] Profile data:', filteredProfiles);
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

  const undoLastSwipe = async () => {
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

      // Delete the last swipe
      const { error: deleteError } = await supabase
        .from('swipes')
        .delete()
        .eq('id', lastSwipe.id);

      if (deleteError) {
        console.error('[useMatches] Error deleting swipe:', deleteError);
        throw deleteError;
      }

      // If it was a match, we should also handle that (optional: delete match)
      // For now, just remove the swipe

      // Refresh potential matches to see that user again
      await fetchPotentialMatches();

      console.log('[useMatches] Swipe undone successfully');
      return { data: { success: true }, error: null };
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
