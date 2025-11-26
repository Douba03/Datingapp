import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../components/theme/colors';
import { useAuth } from '../../hooks/useAuth';
import { usePurchases } from '../../hooks/usePurchases';
import { supabase } from '../../services/supabase/client';

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ package: string }>();
  const { user, refreshProfile } = useAuth();
  const { 
    purchasePremium, 
    restorePurchases, 
    loading: purchaseLoading, 
    restoring,
    price,
    isAvailable: iapAvailable,
    initialized: iapInitialized
  } = usePurchases();
  const [skipLoading, setSkipLoading] = useState(false);

  const packageType = params.package || 'premium';

  // Listen for premium status changes and navigate
  useEffect(() => {
    if (user?.is_premium) {
      // User became premium, navigate to main app
      Alert.alert('🎉 Welcome to Premium!', 'Enjoy all your premium features!', [
        { text: 'Get Started', onPress: () => router.replace('/(tabs)') }
      ]);
    }
  }, [user?.is_premium]);

  const handlePurchasePremium = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to purchase Premium');
      router.replace('/(auth)/login');
      return;
    }

    console.log('[Payment] Initiating premium purchase for user:', user.id);
    await purchasePremium();
  };

  const handleRestorePurchases = async () => {
    const restored = await restorePurchases();
    if (restored) {
      await refreshProfile();
    }
  };

  const handleSkipPayment = async () => {
    if (!user) return;

    // For testing, let's just upgrade the user to premium
    Alert.alert(
      'Skip Payment (Testing)',
      'Would you like to skip payment and upgrade to Premium for testing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upgrade to Premium',
          onPress: async () => {
            setLoading(true);
            try {
              // Directly update user to premium for testing
              const { error } = await supabase
                .from('users')
                .update({
                  is_premium: true,
                  premium_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
                })
                .eq('id', user.id);

              if (error) {
                console.error('[Payment] Error upgrading user:', error);
                Alert.alert('Error', 'Failed to upgrade to Premium');
                setLoading(false);
                return;
              }

              console.log('[Payment] Successfully upgraded user to Premium');

              // Navigate to main app
              Alert.alert('Success!', 'Welcome to Premium!', [
                { text: 'Get Started', onPress: () => router.replace('/(tabs)') }
              ]);
            } catch (error) {
              console.error('[Payment] Error upgrading user:', error);
              Alert.alert('Error', 'Something went wrong');
              setLoading(false);
            }
          },
        },
      ]
    );
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={processingPayment}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Complete Your Purchase</Text>
        </View>

        {/* Premium Badge */}
        <View style={styles.badgeContainer}>
          <View style={styles.badge}>
            <Ionicons name="star" size={32} color="#FFD700" />
            <Text style={styles.badgeText}>PREMIUM</Text>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Plan</Text>
            <Text style={styles.summaryValue}>Premium Monthly</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Price</Text>
            <Text style={styles.summaryValue}>$1.99</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Billing</Text>
            <Text style={styles.summaryValue}>Monthly</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>$1.99</Text>
          </View>
        </View>

        {/* Features Reminder */}
        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>What you get:</Text>
          <View style={styles.featuresList}>
            <FeatureRow text="Unlimited swipes" />
            <FeatureRow text="See who liked you" />
            <FeatureRow text="Undo last swipes" />
            <FeatureRow text="Profile boost (1/day)" />
            <FeatureRow text="Advanced filters" />
            <FeatureRow text="PRO badge" />
          </View>
        </View>

        {/* Purchase Button */}
        <TouchableOpacity
          style={[styles.paymentButton, (loading || processingPayment) && styles.paymentButtonDisabled]}
          onPress={handlePurchasePremium}
          disabled={loading || processingPayment}
        >
          {processingPayment ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="star" size={24} color="#fff" />
              <Text style={styles.paymentButtonText}>
                Subscribe to Premium - $1.99/month
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Testing Option */}
        <View style={styles.testingSection}>
          <View style={styles.mobileNote}>
            <Ionicons name="information-circle" size={20} color={colors.textSecondary} />
            <Text style={styles.mobileNoteText}>
              In-App Purchase (Apple/Google) coming soon! For testing, use "Skip Payment" below.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkipPayment}
            disabled={loading || processingPayment}
          >
            <Text style={styles.skipButtonText}>
              Skip Payment (Testing Only)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Security Info */}
        <View style={styles.securityInfo}>
          <Ionicons name="shield-checkmark" size={20} color={colors.success} />
          <Text style={styles.securityText}>
            Your payment is secure and encrypted
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Feature Row Component
function FeatureRow({ text }: { text: string }) {
  return (
    <View style={styles.featureRow}>
      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
      <Text style={styles.featureRowText}>{text}</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    marginRight: 12,
    padding: 8,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  badgeContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${colors.primary}20`,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  badgeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: 1,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  totalRow: {
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
  },
  featuresCard: {
    backgroundColor: `${colors.primary}10`,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureRowText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  paymentButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  paymentButtonDisabled: {
    opacity: 0.6,
  },
  paymentButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  testingSection: {
    marginTop: 16,
  },
  mobileNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}10`,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  mobileNoteText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  securityText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});

