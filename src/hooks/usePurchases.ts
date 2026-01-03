import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import { PurchaseService, PurchaseEvent } from '../services/iap/purchaseService';
import { useAuth } from './useAuth';

export function usePurchases() {
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [price, setPrice] = useState('$1.99');
  const purchaseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initializeIAP = async () => {
    const success = await PurchaseService.initialize();
    setInitialized(success);
    
    if (success) {
      // Get the actual price from the store
      const storePrice = PurchaseService.getPremiumPrice();
      setPrice(storePrice);
      
      // Verify and sync subscription with store (handles auto-renewals)
      if (user) {
        await PurchaseService.verifyAndSyncSubscription(user.id);
      }
    }
  };

  const handlePurchaseEvent = useCallback(async (event: PurchaseEvent) => {
    console.log('[usePurchases] Event:', event.type);
    
    // Clear any pending timeout
    if (purchaseTimeoutRef.current) {
      clearTimeout(purchaseTimeoutRef.current);
      purchaseTimeoutRef.current = null;
    }
    
    switch (event.type) {
      case 'PURCHASE_SUCCESS':
        setLoading(false);
        // Refresh user profile to get updated premium status
        // The payment screen will show the celebration modal
        console.log('[usePurchases] Purchase success - refreshing profile...');
        await refreshProfile();
        break;
        
      case 'PURCHASE_FAILED':
        setLoading(false);
        Alert.alert('Purchase Failed', event.error || 'Something went wrong. Please try again.');
        break;
        
      case 'PURCHASE_CANCELED':
        setLoading(false);
        // No alert needed - user chose to cancel
        break;
        
      case 'PURCHASE_PENDING':
        setLoading(false);
        // Alert is shown by PurchaseService
        break;
        
      case 'RESTORE_SUCCESS':
        setRestoring(false);
        if (event.restored) {
          await refreshProfile();
          Alert.alert('Purchases Restored', 'Your premium subscription has been restored!');
        } else {
          Alert.alert('No Purchases Found', 'No previous purchases were found to restore.');
        }
        break;
        
      case 'RESTORE_FAILED':
        setRestoring(false);
        Alert.alert('Restore Failed', event.error || 'Unable to restore purchases.');
        break;
    }
  }, [refreshProfile]);

  // Initialize IAP on mount (only on iOS/Android)
  useEffect(() => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      initializeIAP();
    }
  }, []);

  // Subscribe to purchase events
  useEffect(() => {
    const unsubscribe = PurchaseService.subscribe(handlePurchaseEvent);
    return () => unsubscribe();
  }, [handlePurchaseEvent]);

  /**
   * Purchase premium subscription
   */
  const purchasePremium = useCallback(async (): Promise<boolean> => {
    if (!user) {
      Alert.alert('Error', 'Please sign in to purchase premium');
      return false;
    }

    if (Platform.OS === 'web') {
      Alert.alert(
        'Not Available',
        'In-App Purchases are only available on iOS and Android. Please download the app to purchase premium.',
        [{ text: 'OK' }]
      );
      return false;
    }

    setLoading(true);
    
    // Set a timeout to prevent infinite spinner
    const timeout = setTimeout(() => {
      console.log('[usePurchases] Purchase timeout - resetting loading state');
      setLoading(false);
      purchaseTimeoutRef.current = null;
      // Check if user became premium anyway
      refreshProfile();
    }, 60000); // 60 second timeout
    purchaseTimeoutRef.current = timeout;
    
    const result = await PurchaseService.purchasePremium(user.id);
    
    if (!result.success) {
      clearTimeout(timeout);
      purchaseTimeoutRef.current = null;
      setLoading(false);
      if (result.error) {
        Alert.alert('Purchase Error', result.error);
      }
      return false;
    }

    // Purchase initiated - wait for event (timeout will clear loading if needed)
    return true;
  }, [user, refreshProfile]);

  /**
   * Restore previous purchases
   */
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Restore is only available on iOS and Android.');
      return false;
    }

    setRestoring(true);
    
    const result = await PurchaseService.restorePurchases();
    
    if (!result.success) {
      setRestoring(false);
      return false;
    }

    return result.restored;
  }, []);

  /**
   * Check subscription status
   */
  const checkSubscription = useCallback(async () => {
    if (!user) return { isPremium: false };
    return PurchaseService.checkSubscriptionStatus(user.id);
  }, [user]);

  return {
    // State
    loading,
    restoring,
    initialized,
    price,
    isAvailable: Platform.OS === 'ios' || Platform.OS === 'android',
    
    // Actions
    purchasePremium,
    restorePurchases,
    checkSubscription,
  };
}















