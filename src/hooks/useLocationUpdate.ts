import { useState } from 'react';
import { supabase } from '../services/supabase/client';
import { useAuth } from './useAuth';
import { useLocation } from './useLocation';
import { locationToPoint } from '../utils/location';

export function useLocationUpdate() {
  const { user } = useAuth();
  const { getCurrentLocation } = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateLocation = async () => {
    if (!user) {
      setError('No user logged in');
      return { error: new Error('No user logged in') };
    }

    setLoading(true);
    setError(null);

    try {
      // Get current location
      const locationData = await getCurrentLocation();
      
      if (!locationData) {
        setError('Failed to get current location');
        return { error: new Error('Failed to get current location') };
      }

      // Update profile with new location
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({
          location: locationToPoint(locationData.coords),
          city: locationData.city,
          country: locationData.country,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating location:', updateError);
        setError('Failed to update location');
        return { error: updateError };
      }

      console.log('Location updated successfully:', data);
      return { data, error: null };

    } catch (error) {
      console.error('Error in updateLocation:', error);
      setError('Failed to update location');
      return { error };
    } finally {
      setLoading(false);
    }
  };

  return {
    updateLocation,
    loading,
    error,
  };
}
