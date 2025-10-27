import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase/client';
import { useAuth } from './useAuth';

interface ProfileStats {
  matches: number;
  likes: number;
  superLikes: number;
  profileViews: number;
  swipeCount: number;
  matchRate: number;
}

export function useProfileStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ProfileStats>({
    matches: 0,
    likes: 0,
    superLikes: 0,
    profileViews: 0,
    swipeCount: 0,
    matchRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get matches count
      const { count: matchesCount } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
        .eq('status', 'active');

      // Get likes received count (swipes where target_user_id is current user and action is like/superlike)
      const { count: likesCount } = await supabase
        .from('swipes')
        .select('*', { count: 'exact', head: true })
        .eq('target_user_id', user.id)
        .in('action', ['like', 'superlike']);

      // Get super likes received count
      const { count: superLikesCount } = await supabase
        .from('swipes')
        .select('*', { count: 'exact', head: true })
        .eq('target_user_id', user.id)
        .eq('action', 'superlike');

      // Get total swipes made by user
      const { count: swipeCount } = await supabase
        .from('swipes')
        .select('*', { count: 'exact', head: true })
        .eq('swiper_user_id', user.id);

      // Calculate match rate (matches / total swipes * 100)
      const matchRate = swipeCount > 0 ? ((matchesCount || 0) / (swipeCount || 1)) * 100 : 0;

      setStats({
        matches: matchesCount || 0,
        likes: likesCount || 0,
        superLikes: superLikesCount || 0,
        profileViews: 0, // This would need to be tracked separately
        swipeCount: swipeCount || 0,
        matchRate: Math.round(matchRate),
      });

    } catch (error) {
      console.error('Error fetching profile stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshStats = () => {
    fetchStats();
  };

  return {
    stats,
    loading,
    refreshStats,
  };
}
