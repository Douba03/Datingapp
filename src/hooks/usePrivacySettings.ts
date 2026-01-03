import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase/client';
import { useAuth } from './useAuth';
import { withTimeout } from '../utils/supabaseHelpers';

const QUERY_TIMEOUT = 8000; // 8 seconds

export interface PrivacySettings {
  show_online_status: boolean;
  show_distance: boolean;
  show_age: boolean;
}

export function usePrivacySettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PrivacySettings>({
    show_online_status: true,
    show_distance: true,
    show_age: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch privacy settings
  const fetchSettings = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      console.log('[PrivacySettings] Fetching settings for user:', user.id);
      
      const queryPromise = new Promise<{ data: any; error: any }>((resolve) => {
        supabase
          .from('privacy_settings')
          .select('*')
          .eq('user_id', user.id)
          .single()
          .then(r => resolve(r));
      });
      
      const { data, error: fetchError } = await withTimeout(
        queryPromise,
        QUERY_TIMEOUT,
        'Loading privacy settings timed out'
      );

      if (fetchError) {
        // If no settings exist, create default ones
        if (fetchError.code === 'PGRST116') {
          console.log('[PrivacySettings] No settings found, creating defaults...');
          const { data: newData, error: insertError } = await supabase
            .from('privacy_settings')
            .insert({
              user_id: user.id,
              show_online_status: true,
              show_distance: true,
              show_age: true,
            })
            .select()
            .single();

          if (insertError) {
            console.error('[PrivacySettings] Error creating settings:', insertError);
            setError(insertError.message);
          } else {
            console.log('[PrivacySettings] Created default settings:', newData);
            setSettings({
              show_online_status: newData.show_online_status,
              show_distance: newData.show_distance,
              show_age: newData.show_age,
            });
          }
        } else {
          console.error('[PrivacySettings] Error fetching settings:', fetchError);
          setError(fetchError.message);
        }
      } else {
        console.log('[PrivacySettings] Settings loaded:', data);
        setSettings({
          show_online_status: data.show_online_status,
          show_distance: data.show_distance,
          show_age: data.show_age,
        });
      }
    } catch (err: any) {
      console.error('[PrivacySettings] Exception:', err);
      setError(err?.message || 'Failed to load privacy settings');
    } finally {
      setLoading(false);
    }
  };

  // Update privacy settings
  const updateSettings = async (updates: Partial<PrivacySettings>) => {
    if (!user) {
      console.error('[PrivacySettings] No user logged in');
      return { error: 'No user logged in' };
    }

    try {
      console.log('[PrivacySettings] Updating settings:', updates);

      const { error: updateError } = await supabase
        .from('privacy_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('[PrivacySettings] Error updating settings:', updateError);
        return { error: updateError.message };
      }

      console.log('[PrivacySettings] ✅ Settings updated successfully');
      
      // Update local state
      setSettings(prev => ({ ...prev, ...updates }));
      
      return { error: null };
    } catch (err: any) {
      console.error('[PrivacySettings] Exception:', err);
      return { error: err?.message || 'Failed to update settings' };
    }
  };

  // Update last seen (call this periodically or on app activity)
  const updateLastSeen = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) {
        console.error('[PrivacySettings] Error updating last_seen:', error);
      } else {
        console.log('[PrivacySettings] ✅ Last seen updated');
      }
    } catch (err: any) {
      console.error('[PrivacySettings] Exception updating last_seen:', err);
    }
  };

  // Load settings on mount
  useEffect(() => {
    fetchSettings();
  }, [user?.id]);

  // Update last_seen every 2 minutes while user is active
  useEffect(() => {
    if (!user) return;

    // Update immediately
    updateLastSeen();

    // Then update every 2 minutes
    const interval = setInterval(() => {
      updateLastSeen();
    }, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(interval);
  }, [user?.id]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    refreshSettings: fetchSettings,
    updateLastSeen,
  };
}

