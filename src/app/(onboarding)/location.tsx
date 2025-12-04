import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../components/theme/colors';
import { useOnboarding } from '../../contexts/OnboardingContext';

export default function LocationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { updateData } = useOnboarding();
  const [loading, setLoading] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [city, setCity] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);

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

      const location = await Location.getCurrentPositionAsync({});
      
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const cityName = address.city || address.subregion || 'Unknown';
      const countryName = address.country || 'Unknown';
      setCity(cityName);
      setCountry(countryName);
      setLocationGranted(true);

      updateData({
        city: cityName,
        country: countryName,
        location: {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        },
      });

    } catch (error) {
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
    <LinearGradient
      colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
      style={styles.container}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.progressContainer}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressBar, { width: '84%' }]}
          />
        </View>
        
        <Text style={styles.stepText}>Step 6 of 7</Text>
      </View>

      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={locationGranted ? [colors.success, '#34D399'] : [colors.primary, colors.primaryDark]}
            style={styles.iconGradient}
          >
            <Ionicons 
              name={locationGranted ? "checkmark" : "location"} 
              size={56} 
              color="#fff" 
            />
          </LinearGradient>
          
          {/* Decorative circles */}
          <View style={[styles.decorCircle, styles.circle1]} />
          <View style={[styles.decorCircle, styles.circle2]} />
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>
            {locationGranted ? 'Location Enabled!' : 'Enable Location'}
          </Text>
          <Text style={styles.subtitle}>
            {locationGranted 
              ? `We found you in ${city}! 📍`
              : 'Help us find matches near you'
            }
          </Text>
        </View>

        {locationGranted && city && (
          <View style={styles.locationCard}>
            <View style={styles.locationIconContainer}>
              <Ionicons name="location" size={28} color={colors.primary} />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationCity}>{city}</Text>
              <Text style={styles.locationCountry}>{country}</Text>
            </View>
            <Ionicons name="checkmark-circle" size={28} color={colors.success} />
          </View>
        )}

        {!locationGranted && (
          <View style={styles.benefitsSection}>
            <BenefitItem
              icon="people"
              title="Find Nearby Matches"
              description="Connect with people in your area"
              color="#FF6B9D"
            />
            <BenefitItem
              icon="heart"
              title="Better Match Quality"
              description="Distance matters in relationships"
              color="#4ECDC4"
            />
            <BenefitItem
              icon="shield-checkmark"
              title="Privacy Protected"
              description="We only show approximate location"
              color="#FFB347"
            />
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {!locationGranted ? (
          <>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={requestLocationPermission}
              disabled={loading}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="location" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Enable Location</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleContinue}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Getting your location...</Text>
          </View>
        </View>
      )}
    </LinearGradient>
  );
}

function BenefitItem({ 
  icon, 
  title, 
  description, 
  color 
}: { 
  icon: string; 
  title: string; 
  description: string;
  color: string;
}) {
  return (
    <View style={styles.benefitItem}>
      <View style={[styles.benefitIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon as any} size={26} color={color} />
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
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  progressContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 107, 157, 0.15)',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  stepText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 28,
    position: 'relative',
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: colors.primary,
    opacity: 0.15,
  },
  circle1: {
    width: 20,
    height: 20,
    top: 0,
    right: '25%',
  },
  circle2: {
    width: 14,
    height: 14,
    bottom: 10,
    left: '25%',
  },
  titleSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 2,
    borderColor: colors.success,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  locationIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  locationInfo: {
    flex: 1,
  },
  locationCity: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  locationCountry: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  benefitsSection: {
    gap: 18,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  benefitIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '700',
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
    paddingTop: 16,
    gap: 14,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
