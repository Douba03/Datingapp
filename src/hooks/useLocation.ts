import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Location as LocationType } from '../utils/location';

export interface LocationData {
  coords: LocationType;
  city: string;
  country: string;
  address?: string;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  // Check permission status on mount
  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setPermissionGranted(status === 'granted');
    } catch (error) {
      console.error('Error checking location permission:', error);
      setPermissionGranted(false);
    }
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setPermissionGranted(false);
        setError('Location permission denied');
        return false;
      }

      setPermissionGranted(true);
      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setError('Failed to request location permission');
      setPermissionGranted(false);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async (): Promise<LocationData | null> => {
    try {
      setLoading(true);
      setError(null);

      // Check permission first
      const hasPermission = permissionGranted || await requestLocationPermission();
      if (!hasPermission) {
        setError('Location permission required');
        return null;
      }

      // Get current position
      const locationResult = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        mayShowUserSettingsDialog: true,
      });

      const coords: LocationType = {
        lat: locationResult.coords.latitude,
        lng: locationResult.coords.longitude,
      };

      // Reverse geocode to get address
      const [address] = await Location.reverseGeocodeAsync({
        latitude: coords.lat,
        longitude: coords.lng,
      });

      const locationData: LocationData = {
        coords,
        city: address.city || address.subregion || 'Unknown',
        country: address.country || 'Unknown',
        address: address.formattedAddress || undefined,
      };

      setLocation(locationData);
      return locationData;

    } catch (error) {
      console.error('Error getting current location:', error);
      setError('Failed to get current location');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const watchLocation = (callback: (location: LocationData) => void) => {
    if (!permissionGranted) {
      console.warn('Location permission not granted for watching');
      return null;
    }

    return Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 30000, // 30 seconds
        distanceInterval: 100, // 100 meters
      },
      async (locationResult) => {
        try {
          const coords: LocationType = {
            lat: locationResult.coords.latitude,
            lng: locationResult.coords.longitude,
          };

          // Reverse geocode to get address
          const [address] = await Location.reverseGeocodeAsync({
            latitude: coords.lat,
            longitude: coords.lng,
          });

          const locationData: LocationData = {
            coords,
            city: address.city || address.subregion || 'Unknown',
            country: address.country || 'Unknown',
            address: address.formattedAddress || undefined,
          };

          setLocation(locationData);
          callback(locationData);
        } catch (error) {
          console.error('Error in location watch callback:', error);
        }
      }
    );
  };

  return {
    location,
    loading,
    error,
    permissionGranted,
    requestLocationPermission,
    getCurrentLocation,
    watchLocation,
    checkPermissionStatus,
  };
}
