import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../components/theme/colors';
import { useAuth } from '../../hooks/useAuth';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { supabase } from '../../services/supabase/client';

export default function PackageSelectionScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { updateData } = useOnboarding();
  const [selectedPackage, setSelectedPackage] = useState<'basic' | 'premium' | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePackageSelect = async (packageType: 'basic' | 'premium') => {
    setSelectedPackage(packageType);
    
    // Update onboarding data with selected package
    updateData({ 
      selectedPackage: packageType 
    });

    console.log(`[PackageSelection] User selected: ${packageType}`);

    // If basic, go straight to main app
    if (packageType === 'basic') {
      setLoading(true);
      
      // Save basic package to user record
      if (user) {
        const { error } = await supabase
          .from('users')
          .update({ 
            is_premium: false 
          })
          .eq('id', user.id);

        if (error) {
          console.error('[PackageSelection] Error updating user:', error);
        }
      }

      // Navigate to main app
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 500);
      
      return;
    }

    // If premium, navigate to payment screen
    if (packageType === 'premium') {
      router.push('/(onboarding)/payment?package=premium');
      return;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Plan</Text>
          <Text style={styles.subtitle}>
            Start free or go Premium for the best experience
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
            activeOpacity={0.7}
          >
            <View style={styles.packageHeader}>
              <Text style={styles.packageName}>Basic</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.priceAmount}>$0</Text>
                <Text style={styles.pricePeriod}>Forever</Text>
              </View>
            </View>

            <View style={styles.featuresList}>
              <FeatureItem icon="checkmark-circle" text="10 swipes per day" included />
              <FeatureItem icon="checkmark-circle" text="Unlimited matches" included />
              <FeatureItem icon="checkmark-circle" text="Full messaging" included />
              <FeatureItem icon="checkmark-circle" text="Basic filters" included />
              <FeatureItem icon="close-circle" text="See who liked you" />
              <FeatureItem icon="close-circle" text="Unlimited swipes" />
              <FeatureItem icon="close-circle" text="Undo swipes" />
              <FeatureItem icon="close-circle" text="Profile boost" />
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.selectButtonText}>
                {selectedPackage === 'basic' ? '✓ Selected' : 'Select Plan'}
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
            activeOpacity={0.7}
          >
            {/* Premium Badge */}
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.premiumBadgeText}>MOST POPULAR</Text>
            </View>

            <View style={styles.packageHeader}>
              <Text style={[styles.packageName, styles.premiumName]}>Premium</Text>
              <View style={styles.priceContainer}>
                <Text style={[styles.priceAmount, styles.premiumPrice]}>$1.99</Text>
                <Text style={styles.pricePeriod}>Per month</Text>
              </View>
            </View>

            <View style={styles.featuresList}>
              <FeatureItem icon="checkmark-circle" text="Unlimited swipes" included premium />
              <FeatureItem icon="checkmark-circle" text="See who liked you" included premium />
              <FeatureItem icon="checkmark-circle" text="Undo last 3 swipes" included premium />
              <FeatureItem icon="checkmark-circle" text="1 profile boost/day" included premium />
              <FeatureItem icon="checkmark-circle" text="Advanced filters" included premium />
              <FeatureItem icon="checkmark-circle" text="Read receipts" included premium />
              <FeatureItem icon="checkmark-circle" text="PRO badge" included premium />
              <FeatureItem icon="checkmark-circle" text="Priority support" included premium />
            </View>

            <View style={styles.cardFooter}>
              <Text style={[styles.selectButtonText, styles.premiumButtonText]}>
                {selectedPackage === 'premium' ? '✓ Selected' : 'Select Plan'}
              </Text>
            </View>
          </TouchableOpacity>

        </View>

        {/* Info Footer */}
        <View style={styles.infoFooter}>
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark" size={20} color={colors.success} />
            <Text style={styles.infoText}>Cancel anytime</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="lock-closed" size={20} color={colors.success} />
            <Text style={styles.infoText}>Secure payments</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="arrow-undo" size={20} color={colors.success} />
            <Text style={styles.infoText}>Upgrade or downgrade anytime</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// Feature Item Component
function FeatureItem({ 
  icon, 
  text, 
  included = true, 
  premium = false 
}: { 
  icon: string; 
  text: string; 
  included?: boolean; 
  premium?: boolean;
}) {
  return (
    <View style={styles.featureItem}>
      <Ionicons
        name={icon as any}
        size={20}
        color={included ? (premium ? colors.primary : colors.success) : colors.textSecondary}
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
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    marginTop: 40,
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  packagesContainer: {
    gap: 16,
    marginBottom: 32,
  },
  packageCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: colors.border,
    position: 'relative',
  },
  premiumCard: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  packageCardSelected: {
    borderColor: colors.primary,
    borderWidth: 3,
    backgroundColor: `${colors.primary}15`,
  },
  premiumBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  premiumBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  packageHeader: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  packageName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  premiumName: {
    color: colors.primary,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  priceAmount: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.text,
  },
  premiumPrice: {
    color: colors.primary,
  },
  pricePeriod: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 4,
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
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  cardFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
  premiumButtonText: {
    color: colors.primary,
  },
  infoFooter: {
    gap: 12,
    marginTop: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});

