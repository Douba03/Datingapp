import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase/client';
import { Profile, Swipe, SwipeCounter } from '../types/user';
import { useAuth } from './useAuth';
import { calculateDistance, isWithinDistance } from '../utils/location';

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

      const { data, error } = await supabase
        .from('swipe_counters')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        console.warn('[useMatches] No swipe counter found; creating one with 50 remaining');
        const { data: created, error: createError } = await supabase
          .from('swipe_counters')
          .insert({ user_id: user.id, remaining: 50 })
          .select()
          .single();

        if (createError) {
          console.error('[useMatches] Failed to create swipe counter:', createError);
        } else {
          counter = created as unknown as SwipeCounter;
        }
      } else {
        counter = data as unknown as SwipeCounter;
      }

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

      // Get all profiles first
      const { data: profilesData, error: profilesError } = await query.limit(10);

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
      if (profile.preferences?.age_min) {
        filteredProfiles = filteredProfiles.filter(p => p.age >= profile.preferences.age_min);
      }
      if (profile.preferences?.age_max) {
        filteredProfiles = filteredProfiles.filter(p => p.age <= profile.preferences.age_max);
      }

      // Apply relationship intent filter
      if (profile.preferences?.relationship_intent) {
        filteredProfiles = filteredProfiles.filter(p => 
          !p.preferences?.relationship_intent || 
          p.preferences.relationship_intent === profile.preferences.relationship_intent
        );
      }

      // Apply distance filter
      if (profile.preferences?.max_distance_km && profile.location) {
        const maxDistance = profile.preferences.max_distance_km;
        filteredProfiles = filteredProfiles.filter(p => {
          if (!p.location) return true; // Include if no location data
          
          const distance = calculateDistance(profile.location, p.location);
          const withinDistance = distance <= maxDistance;
          
          console.log(`[useMatches] Distance to ${p.first_name}: ${distance}km (max: ${maxDistance}km, within: ${withinDistance})`);
          
          return withinDistance;
        });
      }
      
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
      if (swipeCounter && swipeCounter.remaining <= 0) {
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

      // Update local swipe counter
      if (data.remaining !== undefined) {
        setSwipeCounter(prev => prev ? { ...prev, remaining: data.remaining } : null);
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
    if (!swipeCounter) return false;
    return swipeCounter.remaining > 0;
  };

  const getNextRefillTime = () => {
    if (!swipeCounter?.next_refill_at) return null;
    return new Date(swipeCounter.next_refill_at);
  };

  return {
    profiles,
    swipeCounter,
    loading,
    swipe,
    canSwipe,
    getNextRefillTime,
    refetch: fetchPotentialMatches,
  };
}
