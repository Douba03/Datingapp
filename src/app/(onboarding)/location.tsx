import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { colors } from '../../components/theme/colors';
import { useOnboarding } from '../../contexts/OnboardingContext';

export default function LocationScreen() {
  const router = useRouter();
  const { updateData } = useOnboarding();
  const [loading, setLoading] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [city, setCity] = useState<string | null>(null);

  const requestLocationPermission = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Location Access',
          'We need your location to find matches nearby. You can change this later in settings.',
          [
            { text: 'Skip for now', style: 'cancel', onPress: handleSkip },
            { text: 'Try Again', onPress: requestLocationPermission },
          ]
        );
        setLoading(false);
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({});
      
      // Reverse geocode to get city
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const cityName = address.city || address.subregion || 'Unknown';
      setCity(cityName);
      setLocationGranted(true);

      // Save location data to context
      updateData({
        city: cityName,
        country: address.country || 'Unknown',
        location: {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        },
      });
      
      console.log('[Location] Saved location data');

    } catch (error) {
      console.error('Location error:', error);
      Alert.alert(
        'Error',
        'Failed to get your location. Please try again or skip for now.',
        [
          { text: 'Skip', onPress: handleSkip },
          { text: 'Retry', onPress: requestLocationPermission },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Save default location
    updateData({
      city: 'Unknown',
      country: 'Unknown',
    });
    router.push('/(onboarding)/complete');
  };

  const handleContinue = () => {
    if (locationGranted) {
      router.push('/(onboarding)/complete');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with progress */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: '84%' }]} />
        </View>
      </View>

      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="location" size={64} color={colors.primary} />
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Enable location</Text>
          <Text style={styles.subtitle}>
            Help us find matches near you. We'll never share your exact location.
          </Text>
        </View>

        {locationGranted && city && (
          <View style={styles.locationCard}>
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            <Text style={styles.locationText}>📍 {city}</Text>
            <Text style={styles.locationSubtext}>Location enabled successfully!</Text>
          </View>
        )}

        {!locationGranted && (
          <View style={styles.benefitsSection}>
            <BenefitItem
              icon="people"
              title="Find Nearby Matches"
              description="Connect with people in your area"
            />
            <BenefitItem
              icon="heart"
              title="Better Match Quality"
              description="Distance is an important factor in compatibility"
            />
            <BenefitItem
              icon="shield-checkmark"
              title="Privacy Protected"
              description="We only show your approximate location"
            />
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {!locationGranted && (
          <>
            <Button
              title={loading ? 'Getting Location...' : 'Enable Location'}
              onPress={requestLocationPermission}
              disabled={loading}
              style={styles.primaryButton}
            />
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          </>
        )}

        {locationGranted && (
          <Button
            title="Continue"
            onPress={handleContinue}
            style={styles.primaryButton}
          />
        )}
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function BenefitItem({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <View style={styles.benefitItem}>
      <View style={styles.benefitIcon}>
        <Ionicons name={icon as any} size={28} color={colors.primary} />
      </View>
      <View style={styles.benefitText}>
        <Text style={styles.benefitTitle}>{title}</Text>
        <Text style={styles.benefitDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
    marginBottom: 12,
  },
  progressContainer: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleSection: {
    marginBottom: 48,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  locationCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.success,
  },
  locationText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  locationSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  benefitsSection: {
    gap: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 16,
  },
  primaryButton: {
    paddingVertical: 16,
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
