import { useState, useCallback } from 'react';
import { supabase } from '../services/supabase/client';
import { useAuth } from './useAuth';

export interface WaliRequest {
  id: string;
  match_id: string;
  requester_id: string;
  recipient_id: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  responded_at?: string;
  requester_profile?: any;
  recipient_profile?: any;
}

export interface ProfileView {
  id: string;
  viewer_id: string;
  viewed_id: string;
  viewed_at: string;
  viewer_profile?: any;
}

export interface SuccessfulMatch {
  id: string;
  match_id: string;
  wali_request_id: string;
  user_a_id: string;
  user_b_id: string;
  completed_at: string;
  user_a_profile?: any;
  user_b_profile?: any;
}

export function useWaliSystem() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [waliRequests, setWaliRequests] = useState<WaliRequest[]>([]);
  const [profileViews, setProfileViews] = useState<ProfileView[]>([]);
  const [successfulMatches, setSuccessfulMatches] = useState<SuccessfulMatch[]>([]);

  // Record a profile view when someone views full profile
  const recordProfileView = useCallback(async (viewedUserId: string) => {
    if (!user || user.id === viewedUserId) return;

    try {
      const { error } = await supabase.rpc('record_profile_view', {
        p_viewer_id: user.id,
        p_viewed_id: viewedUserId,
      });

      if (error) {
        console.error('[WaliSystem] Error recording profile view:', error);
      } else {
        console.log('[WaliSystem] Profile view recorded');
      }
    } catch (err) {
      console.error('[WaliSystem] Error:', err);
    }
  }, [user]);

  // Get profile views (who viewed my profile) - Premium only
  const fetchProfileViews = useCallback(async () => {
    if (!user) return [];

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profile_views')
        .select(`
          *,
          viewer:profiles!profile_views_viewer_id_fkey(
            user_id, first_name, photos, age, city
          )
        `)
        .eq('viewed_id', user.id)
        .order('viewed_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const views = (data || []).map(v => ({
        ...v,
        viewer_profile: v.viewer,
      }));

      setProfileViews(views);
      return views;
    } catch (err) {
      console.error('[WaliSystem] Error fetching profile views:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Check if can send wali request (5 days rule)
  const canSendWaliRequest = useCallback(async (matchId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('can_send_wali_request', {
        p_match_id: matchId,
      });

      if (error) {
        console.error('[WaliSystem] Error checking wali eligibility:', error);
        return false;
      }

      return data === true;
    } catch (err) {
      console.error('[WaliSystem] Error:', err);
      return false;
    }
  }, []);

  // Get days until wali request is available
  const getDaysUntilWaliAvailable = useCallback(async (matchId: string): Promise<number> => {
    try {
      const { data: match, error } = await supabase
        .from('matches')
        .select('matched_at')
        .eq('id', matchId)
        .single();

      if (error || !match) return 5;

      const matchDate = new Date(match.matched_at);
      const now = new Date();
      const diffTime = now.getTime() - matchDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      return Math.max(0, 5 - diffDays);
    } catch (err) {
      return 5;
    }
  }, []);

  // Send wali request
  const sendWaliRequest = useCallback(async (
    matchId: string,
    recipientId: string,
    message: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not logged in' };

    setLoading(true);
    try {
      // Check if 5 days have passed
      const canSend = await canSendWaliRequest(matchId);
      if (!canSend) {
        return { success: false, error: 'You must wait 5 days after matching before sending a Wali request' };
      }

      // Check if request already exists
      const { data: existing } = await supabase
        .from('wali_requests')
        .select('id')
        .eq('match_id', matchId)
        .single();

      if (existing) {
        return { success: false, error: 'A Wali request has already been sent for this match' };
      }

      // Create wali request
      const { error } = await supabase
        .from('wali_requests')
        .insert({
          match_id: matchId,
          requester_id: user.id,
          recipient_id: recipientId,
          message: message.trim(),
        });

      if (error) throw error;

      return { success: true };
    } catch (err: any) {
      console.error('[WaliSystem] Error sending wali request:', err);
      return { success: false, error: err.message || 'Failed to send request' };
    } finally {
      setLoading(false);
    }
  }, [user, canSendWaliRequest]);

  // Fetch received wali requests
  const fetchReceivedWaliRequests = useCallback(async () => {
    if (!user) return [];

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wali_requests')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately to avoid foreign key issues
      const requests = await Promise.all((data || []).map(async (r) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id, first_name, photos, age, city, occupation')
          .eq('user_id', r.requester_id)
          .single();
        return {
          ...r,
          requester_profile: profile,
        };
      }));

      setWaliRequests(requests);
      return requests;
    } catch (err) {
      console.error('[WaliSystem] Error fetching wali requests:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch sent wali requests
  const fetchSentWaliRequests = useCallback(async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('wali_requests')
        .select('*')
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately to avoid foreign key issues
      const requests = await Promise.all((data || []).map(async (r) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id, first_name, photos, age, city')
          .eq('user_id', r.recipient_id)
          .single();
        return {
          ...r,
          recipient_profile: profile,
        };
      }));
      return requests;
    } catch (err) {
      console.error('[WaliSystem] Error fetching sent wali requests:', err);
      return [];
    }
  }, [user]);

  // Accept wali request
  const acceptWaliRequest = useCallback(async (requestId: string): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('accept_wali_request', {
        p_request_id: requestId,
      });

      if (error) throw error;

      // Refresh requests
      await fetchReceivedWaliRequests();
      return data === true;
    } catch (err) {
      console.error('[WaliSystem] Error accepting wali request:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, fetchReceivedWaliRequests]);

  // Decline wali request
  const declineWaliRequest = useCallback(async (requestId: string): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('wali_requests')
        .update({ status: 'declined', responded_at: new Date().toISOString() })
        .eq('id', requestId)
        .eq('recipient_id', user.id);

      if (error) throw error;

      // Refresh requests
      await fetchReceivedWaliRequests();
      return true;
    } catch (err) {
      console.error('[WaliSystem] Error declining wali request:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, fetchReceivedWaliRequests]);

  // Fetch successful matches
  const fetchSuccessfulMatches = useCallback(async () => {
    if (!user) return [];

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('successful_matches')
        .select(`
          *,
          user_a:profiles!successful_matches_user_a_id_fkey(
            user_id, first_name, photos, age, city
          ),
          user_b:profiles!successful_matches_user_b_id_fkey(
            user_id, first_name, photos, age, city
          )
        `)
        .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
        .order('completed_at', { ascending: false });

      if (error) throw error;

      const matches = (data || []).map(m => ({
        ...m,
        user_a_profile: m.user_a,
        user_b_profile: m.user_b,
      }));

      setSuccessfulMatches(matches);
      return matches;
    } catch (err) {
      console.error('[WaliSystem] Error fetching successful matches:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Get wali request status for a match
  const getWaliRequestForMatch = useCallback(async (matchId: string): Promise<WaliRequest | null> => {
    try {
      const { data, error } = await supabase
        .from('wali_requests')
        .select('*')
        .eq('match_id', matchId)
        .single();

      if (error) return null;
      return data;
    } catch (err) {
      return null;
    }
  }, []);

  return {
    loading,
    waliRequests,
    profileViews,
    successfulMatches,
    recordProfileView,
    fetchProfileViews,
    canSendWaliRequest,
    getDaysUntilWaliAvailable,
    sendWaliRequest,
    fetchReceivedWaliRequests,
    fetchSentWaliRequests,
    acceptWaliRequest,
    declineWaliRequest,
    fetchSuccessfulMatches,
    getWaliRequestForMatch,
  };
}
