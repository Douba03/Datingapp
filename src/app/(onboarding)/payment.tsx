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
import { colors as staticColors } from '../../components/theme/colors';
import { useTheme } from '../../contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../hooks/useAuth';
import { usePurchases } from '../../hooks/usePurchases';
import { PremiumSuccessModal } from '../../components/premium/PremiumSuccessModal';

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ package: string }>();
  const { user, refreshProfile } = useAuth();
  const { colors } = useTheme();
  const { 
    purchasePremium, 
    restorePurchases, 
    loading: purchaseLoading, 
    restoring,
    price,
    isAvailable: iapAvailable,
    initialized: iapInitialized
  } = usePurchases();
  const packageType = params.package || 'premium';
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [wasNotPremium, setWasNotPremium] = useState(!user?.is_premium);

  // Listen for premium status changes and show celebration
  useEffect(() => {
    if (user?.is_premium && wasNotPremium) {
      // User just became premium - show celebration!
      setShowSuccessModal(true);
      setWasNotPremium(false);
    }
  }, [user?.is_premium, wasNotPremium]);

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    router.replace('/(tabs)');
  };

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

  // Development-only: Simulate purchase for testing
  const handleDevPurchase = async () => {
    if (!user) return;
    
    const { PurchaseService } = await import('../../services/iap/purchaseService');
    const result = await PurchaseService.simulatePurchase(user.id);
    
    if (result.success) {
      await refreshProfile();
      // Success modal will show automatically via useEffect
    } else {
      Alert.alert('Error', result.error || 'Failed to simulate purchase');
    }
  };

  // Development-only: Reset premium for testing
  const handleDevReset = async () => {
    if (!user) return;
    
    const { PurchaseService } = await import('../../services/iap/purchaseService');
    const result = await PurchaseService.resetPremium(user.id);
    
    if (result.success) {
      await refreshProfile();
      Alert.alert('DEV: Premium Reset', 'Premium status cleared!');
    } else {
      Alert.alert('Error', result.error || 'Failed to reset premium');
    }
  };

  // Force hide DEV buttons for production - set to false
  const isDev = false; // Was: __DEV__

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        {/* Header - Settings style */}
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <View style={styles.headerLeft}>
            <View style={styles.logoRow}>
              <TouchableOpacity
                style={styles.backButtonCircle}
                onPress={() => router.back()}
                disabled={purchaseLoading}
              >
                <Ionicons name="arrow-back" size={20} color={colors.text} />
              </TouchableOpacity>
              <View style={styles.titleContainer}>
                <Text style={[styles.title, { color: colors.text }]}>Premium</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Complete your purchase</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Premium Badge */}
        <View style={styles.badgeContainer}>
          <View style={[styles.badge, { backgroundColor: `${colors.primary}20`, borderColor: colors.primary }]}>
            <Ionicons name="star" size={32} color="#FFD700" />
            <Text style={[styles.badgeText, { color: colors.primary }]}>PREMIUM</Text>
          </View>
        </View>

        {/* Order Summary */}
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>Order Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Plan</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>Premium Monthly</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Price</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>$1.99</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Billing</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>Monthly</Text>
          </View>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>$1.99</Text>
          </View>
        </View>

        {/* Features Reminder */}
        <View style={[styles.featuresCard, { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}30` }]}>
          <Text style={[styles.featuresTitle, { color: colors.text }]}>What you get:</Text>
          <View style={styles.featuresList}>
            <FeatureRow text="Unlimited swipes" colors={colors} />
            <FeatureRow text="See who liked you" colors={colors} />
            <FeatureRow text="Undo last swipes" colors={colors} />
            <FeatureRow text="Profile boost (1/day)" colors={colors} />
            <FeatureRow text="Advanced filters" colors={colors} />
            <FeatureRow text="PRO badge" colors={colors} />
          </View>
        </View>

        {/* Purchase Button */}
        <TouchableOpacity
          style={[styles.paymentButton, purchaseLoading && styles.paymentButtonDisabled]}
          onPress={handlePurchasePremium}
          disabled={purchaseLoading}
        >
          {purchaseLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="star" size={20} color="#fff" />
              <Text style={styles.paymentButtonText}>
                Subscribe - {price}/mo
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* DEV: Test Buttons - only visible in development */}
        {isDev && (
          <View style={styles.devButtonsContainer}>
            <TouchableOpacity
              style={[styles.devButton, { backgroundColor: colors.surfaceElevated }]}
              onPress={handleDevPurchase}
            >
              <Ionicons name="flask" size={16} color={colors.success} />
              <Text style={[styles.devButtonText, { color: colors.success }]}>
                DEV: Activate Premium
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.devButton, { backgroundColor: colors.surfaceElevated }]}
              onPress={handleDevReset}
            >
              <Ionicons name="refresh" size={16} color={colors.error} />
              <Text style={[styles.devButtonText, { color: colors.error }]}>
                DEV: Reset Premium
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Security Info */}
        <View style={styles.securityInfo}>
          <Ionicons name="shield-checkmark" size={20} color={colors.success} />
          <Text style={[styles.securityText, { color: colors.textSecondary }]}>
            Your payment is secure and encrypted
          </Text>
        </View>
      </ScrollView>

      {/* Premium Success Celebration Modal */}
      <PremiumSuccessModal 
        visible={showSuccessModal} 
        onClose={handleSuccessClose} 
      />
    </SafeAreaView>
  );
}

// Feature Row Component
function FeatureRow({ text, colors }: { text: string; colors: any }) {
  return (
    <View style={styles.featureRow}>
      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
      <Text style={[styles.featureRowText, { color: colors.text }]}>{text}</Text>
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
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    marginHorizontal: 4,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 20,
    shadowColor: staticColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerLeft: {
    flex: 1,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'column',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  badgeContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 2,
  },
  badgeText: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  totalRow: {
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  featuresCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  featuresList: {
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureRowText: {
    fontSize: 14,
    fontWeight: '500',
  },
  paymentButton: {
    backgroundColor: staticColors.primary,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
    shadowColor: staticColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  paymentButtonDisabled: {
    opacity: 0.6,
  },
  paymentButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  devButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  devButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  devButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  securityText: {
    fontSize: 13,
  },
});

