import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase/client';
import { Profile } from '../types/user';
import { ConnectionRequest, RequestCounter, REQUEST_CONSTANTS, DeclineReason } from '../types/requests';
import { useAuth } from './useAuth';
import { calculateDistance } from '../utils/location';
import { calculateCompatibility } from '../utils/compatibility';
import { AppState, AppStateStatus } from 'react-native';

export function useRequests() {
  const { user, profile } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [requestCounter, setRequestCounter] = useState<RequestCounter | null>(null);
  const [incomingRequests, setIncomingRequests] = useState<(ConnectionRequest & { sender_profile?: Profile })[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<(ConnectionRequest & { receiver_profile?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const lastFetchRef = useRef<number>(0);
  const profilesLengthRef = useRef<number>(0);

  useEffect(() => {
    profilesLengthRef.current = profiles.length;
  }, [profiles.length]);

  useEffect(() => {
    if (!user || !profile) return;

    fetchRequestCounter();
    fetchProfiles();
    fetchIncomingRequests();
    fetchOutgoingRequests();

    // Subscribe to new requests
    const requestSubscription = supabase
      .channel('connection-requests')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'connection_requests' },
        (payload) => {
          console.log('[useRequests] Request change:', payload);
          fetchIncomingRequests();
          fetchOutgoingRequests();
        }
      )
      .subscribe();

    // Subscribe to new profiles (real-time updates)
    const profilesSubscription = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profiles' },
        (payload) => {
          console.log('[useRequests] New profile created:', payload);
          fetchProfiles();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          console.log('[useRequests] Profile updated:', payload);
          fetchProfiles();
        }
      )
      .subscribe();

    // Subscribe to hidden profiles changes
    const hiddenProfilesSubscription = supabase
      .channel('hidden-profiles-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hidden_profiles', filter: `user_id=eq.${user.id}` },
        (payload) => {
          console.log('[useRequests] Hidden profiles changed:', payload);
          fetchProfiles();
        }
      )
      .subscribe();

    // Refresh when app comes to foreground
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        const now = Date.now();
        if (now - lastFetchRef.current > 30000) {
          console.log('[useRequests] App came to foreground, refreshing...');
          fetchProfiles();
          fetchIncomingRequests();
        }
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      requestSubscription.unsubscribe();
      profilesSubscription.unsubscribe();
      hiddenProfilesSubscription.unsubscribe();
      appStateSubscription.remove();
    };
  }, [user?.id, profile?.user_id]);

  const fetchRequestCounter = async () => {
    if (!user) return;

    try {
      let counter: RequestCounter | null = null;

      console.log('[useRequests] Fetching request counter for user:', user.id);
      const { data, error } = await supabase
        .from('request_counters')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        console.log('[useRequests] No request counter found, creating one. Error:', error);
        const { data: created, error: createError } = await supabase
          .from('request_counters')
          .insert({ 
            user_id: user.id, 
            remaining: REQUEST_CONSTANTS.MAX_REQUESTS_PER_DAY 
          })
          .select()
          .single();

        if (createError) {
          console.error('[useRequests] Failed to create request counter:', createError);
        } else {
          console.log('[useRequests] Request counter created successfully:', created);
          counter = created as unknown as RequestCounter;
        }
      } else {
        console.log('[useRequests] Request counter found:', data);
        // Check if refill time has passed
        const counterData = data as any;
        if (counterData.next_refill_at && counterData.remaining <= 0) {
          const refillTime = new Date(counterData.next_refill_at);
          const now = new Date();

          if (now >= refillTime) {
            console.log('[useRequests] Refilling requests');
            const { data: refilled, error: refillError } = await supabase
              .from('request_counters')
              .update({
                remaining: REQUEST_CONSTANTS.MAX_REQUESTS_PER_DAY,
                last_exhausted_at: null,
                next_refill_at: null,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', user.id)
              .select()
              .single();

            if (!refillError) {
              counter = refilled as unknown as RequestCounter;
            } else {
              counter = counterData as RequestCounter;
            }
          } else {
            counter = counterData as RequestCounter;
          }
        } else {
          counter = counterData as RequestCounter;
        }
      }

      setRequestCounter(counter);
    } catch (error) {
      console.error('[useRequests] Error fetching request counter:', error);
    }
  };

  const fetchProfiles = async () => {
    if (!user || !profile) return;

    try {
      setLoading(true);
      lastFetchRef.current = Date.now();

      // Get users we've already sent requests to
      const { data: sentRequests } = await supabase
        .from('connection_requests')
        .select('receiver_id')
        .eq('sender_id', user.id);

      // Get users who have sent us requests (we can see them in incoming)
      const { data: receivedRequests } = await supabase
        .from('connection_requests')
        .select('sender_id')
        .eq('receiver_id', user.id);

      // Get accepted connections (already chatting)
      const { data: acceptedConnections } = await supabase
        .from('connection_requests')
        .select('sender_id, receiver_id')
        .eq('status', 'accepted')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

      // Get blocked users
      const { data: myBlocks } = await supabase
        .from('user_blocks')
        .select('blocked_user_id')
        .eq('blocker_user_id', user.id);

      const { data: blockedMe } = await supabase
        .from('user_blocks')
        .select('blocker_user_id')
        .eq('blocked_user_id', user.id);

      // Get hidden profiles (users marked as "Not What I'm Looking For")
      const { data: hiddenProfiles } = await supabase
        .from('hidden_profiles')
        .select('hidden_user_id')
        .eq('user_id', user.id);

      const excludeIds = new Set<string>();
      excludeIds.add(user.id);
      
      sentRequests?.forEach(r => excludeIds.add(r.receiver_id));
      receivedRequests?.forEach(r => excludeIds.add(r.sender_id));
      acceptedConnections?.forEach(c => {
        excludeIds.add(c.sender_id);
        excludeIds.add(c.receiver_id);
      });
      myBlocks?.forEach(b => excludeIds.add(b.blocked_user_id));
      blockedMe?.forEach(b => excludeIds.add(b.blocker_user_id));
      hiddenProfiles?.forEach(h => excludeIds.add(h.hidden_user_id));

      // Fetch profiles
      let query = supabase
        .from('profiles')
        .select('*')
        .neq('user_id', user.id);

      const excludeArray = Array.from(excludeIds);
      if (excludeArray.length > 1) {
        query = query.not('user_id', 'in', `(${excludeArray.join(',')})`);
      }

      const { data: profilesData, error: profilesError } = await query.limit(50);

      if (profilesError) {
        console.error('[useRequests] Profiles query error:', profilesError);
        throw profilesError;
      }

      if (!profilesData || profilesData.length === 0) {
        setProfiles([]);
        setLoading(false);
        return;
      }

      // Get preferences for filtering
      const profileIds = profilesData.map(p => p.user_id);
      const { data: preferencesData } = await supabase
        .from('preferences')
        .select('*')
        .in('user_id', profileIds);

      // Get premium status for each user
      const { data: usersData } = await supabase
        .from('users')
        .select('id, is_premium')
        .in('id', profileIds);

      // Combine profiles with their preferences and premium status
      let allProfiles = profilesData.map(p => {
        const preferences = preferencesData?.find(pref => pref.user_id === p.user_id);
        const userData = usersData?.find(u => u.id === p.user_id);
        return { ...p, preferences, is_premium: userData?.is_premium || false };
      });

      // Get current user's seeking genders
      const currentSeeking = Array.isArray(profile.preferences?.seeking_genders)
        ? profile.preferences.seeking_genders
        : profile.preferences?.seeking_genders
          ? [profile.preferences.seeking_genders]
          : [];

      console.log('[useRequests] Current user gender:', profile.gender);
      console.log('[useRequests] Current user seeking:', currentSeeking);
      console.log('[useRequests] Total profiles before filtering:', allProfiles.length);

      // MAIN FILTER: Only filter by gender (show opposite gender)
      // If user has set seeking_genders, only show those genders
      // If no preferences set, show all profiles
      let filteredProfiles = allProfiles;
      if (currentSeeking.length > 0) {
        filteredProfiles = allProfiles.filter(p => {
          const matches = currentSeeking.includes(p.gender);
          if (!matches) {
            console.log(`[useRequests] Filtering out ${p.first_name} - gender ${p.gender} not in seeking ${currentSeeking}`);
          }
          return matches;
        });
        console.log('[useRequests] After gender filter:', filteredProfiles.length);
      } else {
        console.log('[useRequests] No seeking_genders set, showing all profiles');
      }

      // NOTE: We do NOT filter based on whether the other person is seeking us
      // All profiles with the correct gender should be visible
      // The compatibility score will prioritize mutual interest

      // Get age preferences (used for scoring, not hard filtering)
      const ageMin = profile.preferences?.age_min ?? 18;
      const ageMax = profile.preferences?.age_max ?? 99;

      // Calculate compatibility scores for ALL filtered profiles
      const profilesWithScores = filteredProfiles.map(p => {
        const compatibility = calculateCompatibility(p, profile, profile.preferences);
        
        // Calculate additional score bonuses
        let bonusScore = 0;
        
        // Bonus for mutual interest (they're also seeking our gender)
        const theirSeeking = Array.isArray(p.preferences?.seeking_genders)
          ? p.preferences.seeking_genders
          : p.preferences?.seeking_genders
            ? [p.preferences.seeking_genders]
            : [];
        if (theirSeeking.length > 0 && theirSeeking.includes(profile.gender)) {
          bonusScore += 20; // Mutual interest bonus
        }
        
        // Bonus for being within age preference
        if (p.age && p.age >= ageMin && p.age <= ageMax) {
          bonusScore += 10; // Age preference bonus
        }
        
        // Bonus for having photos
        if (p.photos && p.photos.length > 0) {
          bonusScore += 5;
        }
        
        // Bonus for having bio
        if (p.bio && p.bio.trim().length > 0) {
          bonusScore += 5;
        }
        
        // PREMIUM BONUS - Premium profiles appear higher
        if (p.is_premium) {
          bonusScore += 25; // Premium users get priority visibility
        }
        
        // Distance bonus (closer = higher score)
        if (profile.preferences?.max_distance_km && profile.location && p.location) {
          const distance = calculateDistance(profile.location, p.location);
          if (!isNaN(distance)) {
            if (distance <= profile.preferences.max_distance_km) {
              bonusScore += 10; // Within preferred distance
            } else if (distance <= profile.preferences.max_distance_km * 2) {
              bonusScore += 5; // Somewhat close
            }
          }
        }
        
        return {
          ...p,
          compatibilityScore: compatibility.score + bonusScore,
          compatibilityMatches: compatibility.matches,
          compatibilityMismatches: compatibility.mismatches
        };
      });

      // Sort by compatibility score (highest first), then by random for equal scores
      profilesWithScores.sort((a, b) => {
        const scoreDiff = b.compatibilityScore - a.compatibilityScore;
        if (scoreDiff !== 0) return scoreDiff;
        return Math.random() - 0.5; // Random order for equal scores
      });

      // LIMIT TO MAX 20 PROFILES
      const MAX_PROFILES = 20;
      const limitedProfiles = profilesWithScores.slice(0, MAX_PROFILES);

      console.log('[useRequests] Total matching profiles:', profilesWithScores.length);
      console.log('[useRequests] Limited to:', limitedProfiles.length, '(max', MAX_PROFILES, ')');
      console.log('[useRequests] Top compatibility scores:', 
        limitedProfiles.slice(0, 5).map(p => ({
          name: p.first_name,
          score: p.compatibilityScore,
          matches: p.compatibilityMatches
        }))
      );
      
      setProfiles(limitedProfiles);
    } catch (error) {
      console.error('[useRequests] Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIncomingRequests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('connection_requests')
        .select('*')
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useRequests] Error fetching incoming requests:', error);
        return;
      }

      // Fetch sender profiles
      if (data && data.length > 0) {
        const senderIds = data.map(r => r.sender_id);
        const { data: senderProfiles } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', senderIds);

        const requestsWithProfiles = data.map(request => ({
          ...request,
          sender_profile: senderProfiles?.find(p => p.user_id === request.sender_id)
        }));

        setIncomingRequests(requestsWithProfiles);
      } else {
        setIncomingRequests([]);
      }
    } catch (error) {
      console.error('[useRequests] Error fetching incoming requests:', error);
    }
  };

  const fetchOutgoingRequests = async () => {
    if (!user) return;

    try {
      console.log('[useRequests] 📤 Fetching outgoing requests for user:', user.id);
      
      const { data, error } = await supabase
        .from('connection_requests')
        .select('*')
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useRequests] ❌ Error fetching outgoing requests:', error);
        return;
      }

      console.log('[useRequests] Found', data?.length || 0, 'outgoing requests');
      console.log('[useRequests] Outgoing requests:', data);

      // Fetch receiver profiles
      if (data && data.length > 0) {
        const receiverIds = data.map(r => r.receiver_id);
        console.log('[useRequests] Fetching profiles for receiver IDs:', receiverIds);
        
        const { data: receiverProfiles, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', receiverIds);

        if (profileError) {
          console.error('[useRequests] ❌ Error fetching receiver profiles:', profileError);
        } else {
          console.log('[useRequests] ✅ Found', receiverProfiles?.length || 0, 'receiver profiles');
          console.log('[useRequests] Receiver profiles:', receiverProfiles);
        }

        const requestsWithProfiles = data.map(request => {
          const profile = receiverProfiles?.find(p => p.user_id === request.receiver_id);
          if (!profile) {
            console.warn('[useRequests] ⚠️ No profile found for receiver:', request.receiver_id);
          }
          return {
            ...request,
            receiver_profile: profile
          };
        });

        console.log('[useRequests] ✅ Outgoing requests with profiles:', requestsWithProfiles);
        setOutgoingRequests(requestsWithProfiles);
      } else {
        console.log('[useRequests] No outgoing requests found');
        setOutgoingRequests([]);
      }
    } catch (error) {
      console.error('[useRequests] ❌ Error fetching outgoing requests:', error);
    }
  };

  const sendRequest = async (targetUserId: string, message?: string) => {
    if (!user) return { error: new Error('Inte inloggad') };

    console.log('========================================');
    console.log('[useRequests] 📤 SENDING REQUEST');
    console.log('[useRequests] From user:', user.id);
    console.log('[useRequests] To user:', targetUserId);
    console.log('[useRequests] Message:', message);
    console.log('[useRequests] User premium:', user.is_premium);
    console.log('[useRequests] Counter:', requestCounter);
    console.log('========================================');

    // Check request limit for non-premium users
    if (!user.is_premium && (!requestCounter || requestCounter.remaining <= 0)) {
      console.log('[useRequests] ❌ Request blocked - no credits. Counter:', requestCounter);
      return { error: new Error('Inga förfrågningar kvar idag') };
    }

    try {
      console.log('[useRequests] Step 1: Inserting into connection_requests table...');
      const { data, error } = await supabase
        .from('connection_requests')
        .insert({
          sender_id: user.id,
          receiver_id: targetUserId,
          status: 'pending',
          message: message || null,
        })
        .select()
        .single();

      if (error) {
        console.error('[useRequests] ❌ Insert failed:', error);
        throw error;
      }

      console.log('[useRequests] ✅ Request inserted successfully!');
      console.log('[useRequests] Request ID:', data?.id);
      console.log('[useRequests] Request data:', data);

      // Update counter for non-premium users
      if (!user.is_premium && requestCounter) {
        console.log('[useRequests] Step 2: Updating request counter...');
        const newRemaining = requestCounter.remaining - 1;
        
        const updateData: any = {
          remaining: newRemaining,
          updated_at: new Date().toISOString()
        };

        if (newRemaining <= 0) {
          const refillTime = new Date();
          refillTime.setHours(refillTime.getHours() + REQUEST_CONSTANTS.REFILL_HOURS);
          updateData.next_refill_at = refillTime.toISOString();
          updateData.last_exhausted_at = new Date().toISOString();
        }

        await supabase
          .from('request_counters')
          .update(updateData)
          .eq('user_id', user.id);

        setRequestCounter(prev => prev ? { ...prev, ...updateData } : null);
        console.log('[useRequests] ✅ Counter updated. Remaining:', newRemaining);
      }

      // Remove profile from list
      setProfiles(prev => prev.filter(p => p.user_id !== targetUserId));

      // Refresh outgoing requests to show the new request immediately
      console.log('[useRequests] Step 3: Refreshing outgoing requests...');
      await fetchOutgoingRequests();

      console.log('[useRequests] ✅ Request sent successfully!');
      console.log('========================================');
      return { data, error: null };
    } catch (error) {
      console.error('[useRequests] ❌ Error sending request:', error);
      console.log('========================================');
      return { error };
    }
  };

  const respondToRequest = async (
    requestId: string, 
    accept: boolean, 
    declineReason?: DeclineReason,
    declineNote?: string
  ) => {
    if (!user) return { error: new Error('Inte inloggad') };

    try {
      const updateData: any = {
        status: accept ? 'accepted' : 'declined',
        responded_at: new Date().toISOString(),
      };

      if (!accept && declineReason) {
        updateData.decline_reason = declineReason;
        if (declineNote) {
          updateData.decline_note = declineNote;
        }
      }

      const { data, error } = await supabase
        .from('connection_requests')
        .update(updateData)
        .eq('id', requestId)
        .eq('receiver_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Remove from incoming requests
      setIncomingRequests(prev => prev.filter(r => r.id !== requestId));

      console.log(`[useRequests] Request ${accept ? 'accepted' : 'declined'}`);
      return { data, error: null };
    } catch (error) {
      console.error('[useRequests] Error responding to request:', error);
      return { error };
    }
  };

  const canSendRequest = () => {
    if (user?.is_premium) return true;
    if (!requestCounter) return false;
    return requestCounter.remaining > 0;
  };

  const getNextRefillTime = () => {
    if (!requestCounter?.next_refill_at) return null;
    return new Date(requestCounter.next_refill_at);
  };

  return {
    profiles,
    requestCounter,
    incomingRequests,
    outgoingRequests,
    loading,
    sendRequest,
    respondToRequest,
    canSendRequest,
    getNextRefillTime,
    refetch: fetchProfiles,
    refetchRequests: () => {
      fetchIncomingRequests();
      fetchOutgoingRequests();
    },
  };
}
