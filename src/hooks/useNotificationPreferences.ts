import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase/client';
import { useAuth } from './useAuth';

export interface NotificationPreferences {
  push_enabled: boolean;
  match_notifications: boolean;
  message_notifications: boolean;
  like_notifications: boolean;
}

export function useNotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    push_enabled: true,
    match_notifications: true,
    message_notifications: true,
    like_notifications: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch notification preferences
  const fetchPreferences = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      console.log('[NotificationPrefs] Fetching preferences for user:', user.id);
      
      const { data, error: fetchError } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        // If no preferences exist, create default ones
        if (fetchError.code === 'PGRST116') {
          console.log('[NotificationPrefs] No preferences found, creating defaults...');
          const { data: newData, error: insertError } = await supabase
            .from('notification_preferences')
            .insert({
              user_id: user.id,
              push_enabled: true,
              match_notifications: true,
              message_notifications: true,
              like_notifications: true,
            })
            .select()
            .single();

          if (insertError) {
            console.error('[NotificationPrefs] Error creating preferences:', insertError);
            setError(insertError.message);
          } else {
            console.log('[NotificationPrefs] Created default preferences:', newData);
            setPreferences({
              push_enabled: newData.push_enabled,
              match_notifications: newData.match_notifications,
              message_notifications: newData.message_notifications,
              like_notifications: newData.like_notifications,
            });
          }
        } else {
          console.error('[NotificationPrefs] Error fetching preferences:', fetchError);
          setError(fetchError.message);
        }
      } else {
        console.log('[NotificationPrefs] Preferences loaded:', data);
        setPreferences({
          push_enabled: data.push_enabled,
          match_notifications: data.match_notifications,
          message_notifications: data.message_notifications,
          like_notifications: data.like_notifications,
        });
      }
    } catch (err: any) {
      console.error('[NotificationPrefs] Exception:', err);
      setError(err?.message || 'Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  // Update notification preferences
  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!user) {
      console.error('[NotificationPrefs] No user logged in');
      return { error: 'No user logged in' };
    }

    try {
      console.log('[NotificationPrefs] Updating preferences:', updates);

      const { error: updateError } = await supabase
        .from('notification_preferences')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('[NotificationPrefs] Error updating preferences:', updateError);
        return { error: updateError.message };
      }

      console.log('[NotificationPrefs] ✅ Preferences updated successfully');
      
      // Update local state
      setPreferences(prev => ({ ...prev, ...updates }));
      
      return { error: null };
    } catch (err: any) {
      console.error('[NotificationPrefs] Exception:', err);
      return { error: err?.message || 'Failed to update preferences' };
    }
  };

  // Load preferences on mount
  useEffect(() => {
    fetchPreferences();
  }, [user?.id]);

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    refreshPreferences: fetchPreferences,
  };
}

