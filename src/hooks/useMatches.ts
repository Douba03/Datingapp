import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase/client';
import { Profile, Swipe, SwipeCounter } from '../types/user';
import { useAuth } from './useAuth';
import { calculateDistance, isWithinDistance } from '../utils/location';

export function useMatches() {
  const { user, profile } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [swipeCounter, setSwipeCounter] = useState<SwipeCounter | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Use refs to prevent duplicate fetches
  const isFetchingRef = useRef(false);
  const isFetchingProfilesRef = useRef(false);
  const mountedRef = useRef(true);
  const hasFetchedRef = useRef(false);

  // Store user/profile in refs
  const userRef = useRef(user);
  const profileRef = useRef(profile);
  
  useEffect(() => {
    userRef.current = user;
    profileRef.current = profile;
  }, [user, profile]);

  const fetchSwipeCounter = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser || isFetchingRef.current) return;

    isFetchingRef.current = true;

    try {
      const { data, error } = await supabase
        .from('swipe_counters')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      let counter: SwipeCounter | null = null;

      if (error || !data) {
        const { data: created, error: createError } = await supabase
          .from('swipe_counters')
          .insert({ user_id: currentUser.id, remaining: 10 })
          .select()
          .single();

        if (!createError) {
          counter = created as unknown as SwipeCounter;
        }
      } else {
        counter = data as unknown as SwipeCounter;
      }

      if (mountedRef.current) {
        setSwipeCounter(counter);
      }
    } catch (error) {
      // Silently handle error
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  const fetchPotentialMatches = useCallback(async () => {
    const currentUser = userRef.current;
    const currentProfile = profileRef.current;
    
    if (!currentUser || !currentProfile || isFetchingProfilesRef.current) return;

    isFetchingProfilesRef.current = true;

    try {
      if (mountedRef.current) setLoading(true);

      // Get already swiped user IDs
      const { data: swipedUsers } = await supabase
        .from('swipes')
        .select('target_user_id')
        .eq('swiper_user_id', currentUser.id);

      // Get blocked users (both directions)
      const { data: myBlocks } = await supabase
        .from('user_blocks')
        .select('blocked_user_id')
        .eq('blocker_user_id', currentUser.id);

      const { data: blockedMe } = await supabase
        .from('user_blocks')
        .select('blocker_user_id')
        .eq('blocked_user_id', currentUser.id);

      const blockedIds = [
        ...(myBlocks?.map(b => b.blocked_user_id) || []),
        ...(blockedMe?.map(b => b.blocker_user_id) || []),
      ];

      const swipedIds = swipedUsers?.map(s => s.target_user_id) || [];

      // Build base query
      let query = supabase
        .from('profiles')
        .select('*')
        .neq('user_id', currentUser.id);

      if (swipedIds.length > 0) {
        query = query.not('user_id', 'in', `(${swipedIds.join(',')})`);
      }

      if (blockedIds.length > 0) {
        query = query.not('user_id', 'in', `(${blockedIds.join(',')})`);
      }

      const { data: profilesData, error: profilesError } = await query.limit(50);

      if (profilesError) throw profilesError;

      if (!profilesData || profilesData.length === 0) {
        if (mountedRef.current) {
          setProfiles([]);
          setLoading(false);
        }
        isFetchingProfilesRef.current = false;
        return;
      }

      // Get preferences for found profiles
      const profileIds = profilesData.map(p => p.user_id);
      const { data: preferencesData } = await supabase
        .from('preferences')
        .select('*')
        .in('user_id', profileIds);

      // Combine profiles with preferences
      const profilesWithPrefs = profilesData.map(p => {
        const preferences = preferencesData?.find(pref => pref.user_id === p.user_id);
        return { ...p, preferences };
      });

      // Apply filters
      let filteredProfiles = profilesWithPrefs;

      // Gender filter
      const currentSeeking = Array.isArray(currentProfile.preferences?.seeking_genders)
        ? (currentProfile.preferences?.seeking_genders as string[])
        : currentProfile.preferences?.seeking_genders
          ? [currentProfile.preferences?.seeking_genders as unknown as string]
          : [];

      if (currentSeeking.length > 0) {
        filteredProfiles = filteredProfiles.filter(p => currentSeeking.includes(p.gender));
      }

      // Mutual filter
      filteredProfiles = filteredProfiles.filter(p => {
        if (!p.preferences?.seeking_genders) return true;
        const targetSeeking = Array.isArray(p.preferences.seeking_genders)
          ? p.preferences.seeking_genders as string[]
          : [p.preferences.seeking_genders as unknown as string];
        return targetSeeking.includes(currentProfile.gender);
      });

      // Age filter
      if (currentProfile.preferences?.age_min) {
        filteredProfiles = filteredProfiles.filter(p => p.age >= currentProfile.preferences!.age_min!);
      }
      if (currentProfile.preferences?.age_max) {
        filteredProfiles = filteredProfiles.filter(p => p.age <= currentProfile.preferences!.age_max!);
      }

      // Relationship intent filter
      if (currentProfile.preferences?.relationship_intent) {
        const intent = currentProfile.preferences.relationship_intent;
        filteredProfiles = filteredProfiles.filter(p => 
          !p.preferences?.relationship_intent || p.preferences.relationship_intent === intent
        );
      }

      // Distance filter
      if (currentProfile.preferences?.max_distance_km && currentProfile.location) {
        const maxDistance = currentProfile.preferences.max_distance_km;
        const currentLocation = currentProfile.location;
        filteredProfiles = filteredProfiles.filter(p => {
          if (!p.location) return true;
          return calculateDistance(currentLocation, p.location) <= maxDistance;
        });
      }

      // Sort by boost
      const now = new Date();
      filteredProfiles.sort((a, b) => {
        const aBoosted = a.boost_expires_at && new Date(a.boost_expires_at) > now;
        const bBoosted = b.boost_expires_at && new Date(b.boost_expires_at) > now;
        if (aBoosted && !bBoosted) return -1;
        if (!aBoosted && bBoosted) return 1;
        return 0;
      });

      if (mountedRef.current) {
        setProfiles(filteredProfiles);
      }
    } catch (error) {
      // Set empty profiles on error so the empty message shows
      if (mountedRef.current) {
        setProfiles([]);
      }
    } finally {
      isFetchingProfilesRef.current = false;
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  // Initial fetch - only run once when user and profile are available
  useEffect(() => {
    mountedRef.current = true;
    
    // Get stable IDs
    const userId = user?.id;
    const profileUserId = profile?.user_id;
    
    if (!userId || !profileUserId) {
      setLoading(false);
      return;
    }

    // Only fetch if we haven't fetched yet for this user
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    // Single initial fetch
    fetchSwipeCounter();
    fetchPotentialMatches();

    // Fallback timeout - ensure loading stops after 10 seconds max
    const loadingTimeout = setTimeout(() => {
      if (mountedRef.current) {
        setLoading(false);
      }
    }, 10000);

    // Refresh counter every 60 seconds
    const refreshInterval = setInterval(() => {
      fetchSwipeCounter();
    }, 60000);

    return () => {
      mountedRef.current = false;
      clearTimeout(loadingTimeout);
      clearInterval(refreshInterval);
    };
  }, [user?.id, profile?.user_id, fetchSwipeCounter, fetchPotentialMatches]);

  // Reset hasFetched when user changes
  useEffect(() => {
    return () => {
      hasFetchedRef.current = false;
    };
  }, [user?.id]);

  const swipe = useCallback(async (targetUserId: string, action: 'like' | 'pass' | 'superlike') => {
    const currentUser = userRef.current;
    if (!currentUser) return { error: new Error('No user logged in') };

    try {
      let cost = 0;
      if (action === 'like') cost = 1;
      if (action === 'superlike') cost = 2;

      if (!swipeCounter) {
        await fetchSwipeCounter();
      }
      
      if (cost > 0 && swipeCounter && swipeCounter.remaining < cost) {
        return { error: new Error(`Not enough swipes. Requires ${cost} swipe(s).`) };
      }

      const { data, error } = await supabase.rpc('record_swipe', {
        swiper_uuid: currentUser.id,
        target_uuid: targetUserId,
        swipe_action: action
      });

      if (error) throw error;

      // Update local state immediately
      setProfiles(current => current.filter(p => p.user_id !== targetUserId));
      
      if (swipeCounter && !swipeCounter.is_unlimited && cost > 0) {
        setSwipeCounter(prev => prev ? {
          ...prev,
          remaining: Math.max(0, prev.remaining - cost)
        } : null);
      }

      // Sync with server after a delay
      setTimeout(() => fetchSwipeCounter(), 1000);

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }, [swipeCounter, fetchSwipeCounter]);

  const canSwipe = useCallback((action: 'like' | 'pass' | 'superlike' = 'like') => {
    if (swipeCounter?.is_unlimited) return true;
    
    let cost = 0;
    if (action === 'like') cost = 1;
    if (action === 'superlike') cost = 2;
    
    if (cost === 0) return true;
    return (swipeCounter?.remaining || 0) >= cost;
  }, [swipeCounter]);

  const getNextRefillTime = useCallback(() => {
    if (swipeCounter?.next_refill_at) {
      return new Date(swipeCounter.next_refill_at);
    }
    return null;
  }, [swipeCounter]);

  const undoLastSwipe = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser) return { error: new Error('No user logged in') };

    try {
      const { data: lastSwipe, error: fetchError } = await supabase
        .from('swipes')
        .select('*')
        .eq('swiper_user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError || !lastSwipe) {
        return { error: new Error('No swipe to undo') };
      }

      const { error: deleteError } = await supabase
        .from('swipes')
        .delete()
        .eq('id', lastSwipe.id);

      if (deleteError) throw deleteError;

      fetchPotentialMatches();
      fetchSwipeCounter();

      return { error: null };
    } catch (error) {
      return { error };
    }
  }, [fetchPotentialMatches, fetchSwipeCounter]);

  const refreshSwipeCounter = useCallback(async () => {
    await fetchSwipeCounter();
    await fetchPotentialMatches();
  }, [fetchSwipeCounter, fetchPotentialMatches]);

  return {
    profiles,
    swipeCounter,
    loading,
    swipe,
    canSwipe,
    getNextRefillTime,
    undoLastSwipe,
    refreshSwipeCounter,
  };
}
