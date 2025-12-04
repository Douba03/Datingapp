import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../components/theme/colors';
import { useAuth } from '../../hooks/useAuth';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { supabase } from '../../services/supabase/client';

export default function PackageSelectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { updateData } = useOnboarding();
  const [selectedPackage, setSelectedPackage] = useState<'basic' | 'premium' | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePackageSelect = async (packageType: 'basic' | 'premium') => {
    setSelectedPackage(packageType);
    updateData({ selectedPackage: packageType });

    if (packageType === 'basic') {
      setLoading(true);
      
      if (user) {
        const { error } = await supabase
          .from('users')
          .update({ 
            is_premium: false,
            onboarding_completed: true
          })
          .eq('id', user.id);

        if (error) {
          console.error('[PackageSelection] Error updating user:', error);
        }
      }

      setTimeout(() => {
        router.replace('/(tabs)');
      }, 500);
      
      return;
    }

    if (packageType === 'premium') {
      // Also mark onboarding as complete for premium path
      // so user doesn't get stuck if they cancel payment
      if (user) {
        const { error } = await supabase
          .from('users')
          .update({ 
            onboarding_completed: true
          })
          .eq('id', user.id);

        if (error) {
          console.error('[PackageSelection] Error marking onboarding complete:', error);
        }
      }
      router.push('/(onboarding)/payment?package=premium');
      return;
    }
  };

  return (
    <LinearGradient
      colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="sparkles" size={48} color="#FFD700" />
          <Text style={styles.title}>Choose Your Plan</Text>
          <Text style={styles.subtitle}>
            Start free or unlock premium features
          </Text>
        </View>

        {/* Package Cards */}
        <View style={styles.packagesContainer}>
          
          {/* BASIC Package */}
          <TouchableOpacity
            style={[
              styles.packageCard,
              selectedPackage === 'basic' && styles.packageCardSelected
            ]}
            onPress={() => handlePackageSelect('basic')}
            activeOpacity={0.8}
          >
            <View style={styles.packageHeader}>
              <View style={styles.basicIconContainer}>
                <Ionicons name="heart-outline" size={28} color={colors.textSecondary} />
              </View>
              <Text style={styles.packageName}>Basic</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.priceAmount}>Free</Text>
                <Text style={styles.pricePeriod}>Forever</Text>
              </View>
            </View>

            <View style={styles.featuresList}>
              <FeatureItem text="10 swipes per day" included />
              <FeatureItem text="Unlimited matches" included />
              <FeatureItem text="Full messaging" included />
              <FeatureItem text="See who liked you" />
              <FeatureItem text="Unlimited swipes" />
              <FeatureItem text="Undo swipes" />
            </View>

            <View style={styles.selectButton}>
              <Text style={[
                styles.selectButtonText,
                selectedPackage === 'basic' && styles.selectButtonTextSelected
              ]}>
                {selectedPackage === 'basic' ? '✓ Starting...' : 'Start Free'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* PREMIUM Package */}
          <TouchableOpacity
            style={[
              styles.packageCard,
              styles.premiumCard,
              selectedPackage === 'premium' && styles.packageCardSelected
            ]}
            onPress={() => handlePackageSelect('premium')}
            activeOpacity={0.8}
          >
            {/* Premium Badge */}
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={14} color="#fff" />
              <Text style={styles.premiumBadgeText}>MOST POPULAR</Text>
            </View>

            <View style={styles.packageHeader}>
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={styles.premiumIconContainer}
              >
                <Ionicons name="diamond" size={28} color="#fff" />
              </LinearGradient>
              <Text style={[styles.packageName, styles.premiumName]}>Premium</Text>
              <View style={styles.priceContainer}>
                <Text style={[styles.priceAmount, styles.premiumPrice]}>$1.99</Text>
                <Text style={styles.pricePeriod}>per month</Text>
              </View>
            </View>

            <View style={styles.featuresList}>
              <FeatureItem text="Unlimited swipes" included premium />
              <FeatureItem text="See who liked you" included premium />
              <FeatureItem text="Undo last swipes" included premium />
              <FeatureItem text="Profile boost daily" included premium />
              <FeatureItem text="Advanced filters" included premium />
              <FeatureItem text="PRO badge" included premium />
            </View>

            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.premiumSelectButton}
            >
              <Text style={styles.premiumSelectText}>
                {selectedPackage === 'premium' ? '✓ Selected' : 'Get Premium'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Trust Indicators */}
        <View style={styles.trustSection}>
          <View style={styles.trustItem}>
            <Ionicons name="shield-checkmark" size={18} color={colors.success} />
            <Text style={styles.trustText}>Cancel anytime</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="lock-closed" size={18} color={colors.success} />
            <Text style={styles.trustText}>Secure payments</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="refresh" size={18} color={colors.success} />
            <Text style={styles.trustText}>Easy upgrade</Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

function FeatureItem({ 
  text, 
  included = false, 
  premium = false 
}: { 
  text: string; 
  included?: boolean; 
  premium?: boolean;
}) {
  return (
    <View style={styles.featureItem}>
      <Ionicons
        name={included ? "checkmark-circle" : "close-circle"}
        size={20}
        color={included ? (premium ? colors.primary : colors.success) : '#D1D5DB'}
      />
      <Text style={[
        styles.featureText,
        !included && styles.featureTextDisabled
      ]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  packagesContainer: {
    gap: 20,
    marginBottom: 28,
  },
  packageCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 2,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  premiumCard: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}05`,
    position: 'relative',
  },
  packageCardSelected: {
    borderWidth: 3,
    shadowOpacity: 0.15,
  },
  premiumBadge: {
    position: 'absolute',
    top: -14,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  premiumBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  packageHeader: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  basicIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  premiumIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  packageName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  premiumName: {
    color: colors.primary,
  },
  priceContainer: {
    alignItems: 'center',
  },
  priceAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text,
  },
  premiumPrice: {
    color: colors.primary,
  },
  pricePeriod: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  featuresList: {
    gap: 12,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  featureTextDisabled: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  selectButton: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  selectButtonTextSelected: {
    color: colors.primary,
  },
  premiumSelectButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  premiumSelectText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  trustSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
    marginTop: 8,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
