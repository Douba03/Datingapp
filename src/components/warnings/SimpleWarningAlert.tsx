import React, { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { supabase } from '../../services/supabase/client';
import { useAuth } from '../../hooks/useAuth';
import { WarningModal } from './WarningModal';

export function SimpleWarningAlert() {
  // Wrap everything in try-catch to prevent white screen
  try {
    const { user } = useAuth();
    const [checkedWarnings, setCheckedWarnings] = useState<Set<string>>(new Set());
    const [isTableReady, setIsTableReady] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [currentWarning, setCurrentWarning] = useState<{ id: string; reason: string } | null>(null);

    useEffect(() => {
    if (!user) {
      console.log('[SimpleWarningAlert] No user, skipping');
      return;
    }

    if (hasError) {
      console.log('[SimpleWarningAlert] Previous error detected, not retrying');
      return;
    }

    console.log('[SimpleWarningAlert] User logged in, waiting 2 seconds before checking warnings...');

    // Wait 2 seconds after user logs in before checking for warnings
    const delayTimer = setTimeout(() => {
      console.log('[SimpleWarningAlert] Starting check for user:', user.id);
      checkForWarnings();
    }, 2000);

    const checkForWarnings = async () => {
      try {
        const { data, error } = await supabase
          .from('user_warnings')
          .select('*')
          .eq('user_id', user.id)
          .eq('acknowledged', false)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[SimpleWarningAlert] ❌ Query error:', error);
          console.error('[SimpleWarningAlert] Error code:', error.code);
          console.error('[SimpleWarningAlert] Error message:', error.message);
          
          // If table doesn't exist, silently fail
          if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
            console.log('[SimpleWarningAlert] user_warnings table not found - please run the SQL migration');
            setIsTableReady(false);
            setHasError(true);
            return;
          }
          
          // Any other error - mark as error and stop
          console.error('[SimpleWarningAlert] Unexpected error, disabling component');
          setHasError(true);
          return;
        }

        console.log('[SimpleWarningAlert] ✅ Query successful, found', data?.length || 0, 'warnings');
        
        // Table exists and query succeeded
        setIsTableReady(true);

        if (data && data.length > 0) {
          console.log('[SimpleWarningAlert] 🚨 SHOWING ALERT for warnings:', data);
          
          // Show alert for the FIRST unacknowledged warning
          const warning = data[0];
          
          if (!checkedWarnings.has(warning.id)) {
            console.log('[SimpleWarningAlert] 🔔 Displaying alert popup for warning:', warning.id);
            setCheckedWarnings(prev => new Set(prev).add(warning.id));
            
            // Show the custom modal
            setCurrentWarning({
              id: warning.id,
              reason: warning.reason,
            });
          } else {
            console.log('[SimpleWarningAlert] Warning already shown in this session:', warning.id);
          }
        } else {
          console.log('[SimpleWarningAlert] No unacknowledged warnings to show');
        }
      } catch (err: any) {
        console.error('[SimpleWarningAlert] ❌ Exception caught:', err);
        console.error('[SimpleWarningAlert] Exception message:', err?.message);
        console.error('[SimpleWarningAlert] Exception stack:', err?.stack);
        setHasError(true);
      }
    };

    // Cleanup function to clear the timer
    const cleanup = () => {
      clearTimeout(delayTimer);
    };

    // Only subscribe if table exists (after delay)
    if (!isTableReady) {
      console.log('[SimpleWarningAlert] Waiting for table check to complete...');
      return cleanup;
    }

    // Subscribe to new warnings
    const subscription = supabase
      .channel('user_warnings_alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_warnings',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[SimpleWarningAlert] New warning received:', payload);
          const newWarning = payload.new as any;
          
          if (!checkedWarnings.has(newWarning.id)) {
            // Show the custom modal for realtime warnings too
            setCurrentWarning({
              id: newWarning.id,
              reason: newWarning.reason,
            });
            setCheckedWarnings(prev => new Set(prev).add(newWarning.id));
          }
        }
      )
      .subscribe();

    return () => {
      clearTimeout(delayTimer);
      subscription.unsubscribe();
    };
  }, [user, isTableReady]);

    const handleAcknowledge = async () => {
      if (!currentWarning) return;

      console.log('[SimpleWarningAlert] User acknowledged warning:', currentWarning.id);

      try {
        const { error: updateError } = await supabase
          .from('user_warnings')
          .update({ 
            acknowledged: true, 
            acknowledged_at: new Date().toISOString() 
          })
          .eq('id', currentWarning.id);
        
        if (updateError) {
          console.error('[SimpleWarningAlert] Error acknowledging:', updateError);
        } else {
          console.log('[SimpleWarningAlert] ✅ Warning acknowledged successfully');
        }
      } catch (err) {
        console.error('[SimpleWarningAlert] Exception acknowledging:', err);
      }

      // Close the modal
      setCurrentWarning(null);
    };

    // Render the warning modal
    return (
      <WarningModal
        visible={currentWarning !== null}
        reason={currentWarning?.reason || ''}
        onAcknowledge={handleAcknowledge}
      />
    );
  } catch (err: any) {
    console.error('[SimpleWarningAlert] ❌ Component error:', err);
    console.error('[SimpleWarningAlert] Component crashed, returning null');
    return null;
  }
}

