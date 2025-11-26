import { Platform, Alert } from 'react-native';
import { supabase } from '../supabase/client';

// Product IDs - MUST match App Store Connect / Google Play Console exactly
export const PRODUCT_IDS = {
  PREMIUM_MONTHLY: Platform.select({
    ios: 'premium_monthly_199',
    android: 'premium_monthly_199_android',
    default: 'premium_monthly_199',
  }),
};

// Event emitter for purchase updates
type PurchaseEventCallback = (event: PurchaseEvent) => void;
export type PurchaseEvent = 
  | { type: 'PURCHASE_SUCCESS'; productId: string }
  | { type: 'PURCHASE_FAILED'; error: string }
  | { type: 'PURCHASE_CANCELED' }
  | { type: 'PURCHASE_PENDING' }
  | { type: 'RESTORE_SUCCESS'; restored: boolean }
  | { type: 'RESTORE_FAILED'; error: string };

const listeners: Set<PurchaseEventCallback> = new Set();

// Lazy load the native module only when needed (not on web)
let InAppPurchases: typeof import('expo-in-app-purchases') | null = null;

const getInAppPurchases = async () => {
  if (Platform.OS === 'web') {
    return null;
  }
  
  if (!InAppPurchases) {
    try {
      InAppPurchases = await import('expo-in-app-purchases');
    } catch (error) {
      console.warn('[IAP] Failed to load expo-in-app-purchases:', error);
      return null;
    }
  }
  
  return InAppPurchases;
};

export interface Product {
  productId: string;
  title: string;
  description: string;
  price: string;
  priceAmountMicros: number;
  priceCurrencyCode: string;
}

export class PurchaseService {
  private static initialized = false;
  private static products: Product[] = [];

  /**
   * Subscribe to purchase events
   */
  static subscribe(callback: PurchaseEventCallback): () => void {
    listeners.add(callback);
    return () => listeners.delete(callback);
  }

  /**
   * Emit purchase event to all listeners
   */
  private static emit(event: PurchaseEvent) {
    listeners.forEach(callback => callback(event));
  }

  /**
   * Initialize In-App Purchases
   * Call this once when app starts on iOS/Android
   */
  static async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
        console.log('[IAP] Platform does not support IAP (web)');
        return false;
      }

      const IAP = await getInAppPurchases();
      if (!IAP) {
        console.warn('[IAP] Native module not available');
        return false;
      }

      // Connect to store
      await IAP.connectAsync();
      console.log('[IAP] Connected to store');

      // Set up purchase listener
      IAP.setPurchaseListener((result) => {
        this.handlePurchaseUpdate(result);
      });

      // Pre-fetch products
      await this.fetchProducts();

      this.initialized = true;
      console.log('[IAP] Initialized successfully');
      return true;
    } catch (error: any) {
      console.warn('[IAP] Initialization error:', error.message);
      return false;
    }
  }

  /**
   * Fetch available products from store
   */
  private static async fetchProducts(): Promise<void> {
    try {
      const IAP = await getInAppPurchases();
      if (!IAP || !PRODUCT_IDS.PREMIUM_MONTHLY) return;

      const response = await IAP.getProductsAsync([PRODUCT_IDS.PREMIUM_MONTHLY]);
      
      if (response.responseCode === IAP.IAPResponseCode.OK && response.results) {
        this.products = response.results.map((p: any) => ({
          productId: p.productId,
          title: p.title,
          description: p.description,
          price: p.price,
          priceAmountMicros: p.priceAmountMicros,
          priceCurrencyCode: p.priceCurrencyCode,
        }));
        console.log('[IAP] Products loaded:', this.products.length);
      }
    } catch (error) {
      console.error('[IAP] Error fetching products:', error);
    }
  }

  /**
   * Get available products
   */
  static getProducts(): Product[] {
    return this.products;
  }

  /**
   * Get premium product price string (e.g., "$1.99")
   */
  static getPremiumPrice(): string {
    const product = this.products.find(p => p.productId === PRODUCT_IDS.PREMIUM_MONTHLY);
    return product?.price || '$1.99';
  }

  /**
   * Purchase Premium Subscription
   */
  static async purchasePremium(userId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      if (Platform.OS === 'web') {
        return { success: false, error: 'In-App Purchases are only available on iOS and Android' };
      }

      if (!this.initialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          return { 
            success: false, 
            error: 'Unable to connect to store. Please check your internet connection.' 
          };
        }
      }

      if (!PRODUCT_IDS.PREMIUM_MONTHLY) {
        return { success: false, error: 'Product not configured' };
      }

      const IAP = await getInAppPurchases();
      if (!IAP) {
        return { success: false, error: 'Store not available' };
      }

      console.log('[IAP] Initiating purchase:', PRODUCT_IDS.PREMIUM_MONTHLY);

      // Start purchase flow - result comes through the listener
      await IAP.purchaseItemAsync(PRODUCT_IDS.PREMIUM_MONTHLY);

      return { success: true };
    } catch (error: any) {
      console.error('[IAP] Purchase error:', error);
      this.emit({ type: 'PURCHASE_FAILED', error: error.message });
      return {
        success: false,
        error: error.message || 'Purchase failed. Please try again.',
      };
    }
  }

  /**
   * Restore previous purchases
   */
  static async restorePurchases(): Promise<{
    success: boolean;
    restored: boolean;
    error?: string;
  }> {
    try {
      if (Platform.OS === 'web') {
        return { success: false, restored: false, error: 'Not available on web' };
      }

      if (!this.initialized) {
        await this.initialize();
      }

      const IAP = await getInAppPurchases();
      if (!IAP) {
        return { success: false, restored: false, error: 'Store not available' };
      }

      console.log('[IAP] Restoring purchases...');

      const response = await IAP.getPurchaseHistoryAsync();

      if (response.responseCode === IAP.IAPResponseCode.OK && response.results) {
        let restoredCount = 0;
        
        for (const purchase of response.results) {
          if (purchase) {
            const activated = await this.verifyAndActivatePurchase(purchase);
            if (activated) {
              restoredCount++;
              // Finish the transaction
              if (!purchase.acknowledged) {
                await IAP.finishTransactionAsync(purchase, false);
              }
            }
          }
        }

        const restored = restoredCount > 0;
        this.emit({ type: 'RESTORE_SUCCESS', restored });
        
        return { success: true, restored };
      }

      this.emit({ type: 'RESTORE_SUCCESS', restored: false });
      return { success: true, restored: false };
    } catch (error: any) {
      console.error('[IAP] Restore error:', error);
      this.emit({ type: 'RESTORE_FAILED', error: error.message });
      return {
        success: false,
        restored: false,
        error: error.message || 'Restore failed',
      };
    }
  }

  /**
   * Handle purchase updates from the store
   */
  private static async handlePurchaseUpdate(result: any) {
    console.log('[IAP] Purchase update received:', JSON.stringify(result, null, 2));

    const IAP = await getInAppPurchases();
    if (!IAP) return;

    switch (result.responseCode) {
      case IAP.IAPResponseCode.OK:
        if (result.results && result.results.length > 0) {
          for (const purchase of result.results) {
            if (purchase && !purchase.acknowledged) {
              console.log('[IAP] Processing purchase:', purchase.productId);
              
              const activated = await this.verifyAndActivatePurchase(purchase);
              
              if (activated) {
                // Finish the transaction
                await IAP.finishTransactionAsync(purchase, false);
                this.emit({ type: 'PURCHASE_SUCCESS', productId: purchase.productId });
              }
            }
          }
        }
        break;

      case IAP.IAPResponseCode.USER_CANCELED:
        console.log('[IAP] User canceled purchase');
        this.emit({ type: 'PURCHASE_CANCELED' });
        break;

      case IAP.IAPResponseCode.DEFERRED:
        console.log('[IAP] Purchase deferred (Ask to Buy)');
        this.emit({ type: 'PURCHASE_PENDING' });
        Alert.alert(
          'Purchase Pending',
          'Your purchase requires approval. You will be notified when it\'s approved.'
        );
        break;

      default:
        console.error('[IAP] Purchase failed:', result.errorCode);
        this.emit({ type: 'PURCHASE_FAILED', error: 'Purchase failed' });
        break;
    }
  }

  /**
   * Verify purchase and activate premium
   * In production, you should verify the receipt on your backend!
   */
  private static async verifyAndActivatePurchase(purchase: any): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('[IAP] No user logged in');
        return false;
      }

      console.log('[IAP] Activating premium for user:', user.id);
      console.log('[IAP] Purchase details:', {
        productId: purchase.productId,
        transactionId: purchase.transactionId,
        purchaseTime: purchase.purchaseTime,
      });

      // TODO: In production, send the receipt to your backend for verification
      // const receiptData = Platform.OS === 'ios' 
      //   ? purchase.transactionReceipt 
      //   : purchase.purchaseToken;
      // 
      // const verified = await fetch('YOUR_BACKEND/verify-receipt', {
      //   method: 'POST',
      //   body: JSON.stringify({ receipt: receiptData, platform: Platform.OS }),
      // });

      // Calculate expiry date (30 days from now for monthly subscription)
      const premiumUntil = new Date();
      premiumUntil.setDate(premiumUntil.getDate() + 30);

      // Update user's premium status
      const { error } = await supabase
        .from('users')
        .update({
          is_premium: true,
          premium_until: premiumUntil.toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('[IAP] Error updating premium status:', error);
        Alert.alert('Error', 'Failed to activate premium. Please contact support.');
        return false;
      }

      // Store purchase record for tracking
      await supabase
        .from('purchases')
        .insert({
          user_id: user.id,
          product_id: purchase.productId,
          transaction_id: purchase.transactionId || purchase.orderId,
          platform: Platform.OS,
          purchase_time: purchase.purchaseTime 
            ? new Date(purchase.purchaseTime).toISOString() 
            : new Date().toISOString(),
          status: 'completed',
        })
        .single();

      console.log('[IAP] Premium activated successfully!');
      
      Alert.alert(
        '🎉 Welcome to Premium!',
        'Your subscription is now active. Enjoy unlimited swipes, see who liked you, and more!',
        [{ text: 'Awesome!' }]
      );

      return true;
    } catch (error) {
      console.error('[IAP] Error verifying purchase:', error);
      Alert.alert('Error', 'Failed to verify purchase. Please contact support.');
      return false;
    }
  }

  /**
   * Check if user has active premium subscription
   */
  static async checkSubscriptionStatus(userId: string): Promise<{
    isPremium: boolean;
    expiresAt?: Date;
  }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_premium, premium_until')
        .eq('id', userId)
        .single();

      if (error || !data) {
        return { isPremium: false };
      }

      // Check if premium and not expired
      if (data.is_premium) {
        if (data.premium_until) {
          const expiryDate = new Date(data.premium_until);
          const isActive = expiryDate > new Date();
          
          if (!isActive) {
            // Premium expired, update status
            await supabase
              .from('users')
              .update({ is_premium: false })
              .eq('id', userId);
            
            return { isPremium: false };
          }
          
          return { isPremium: true, expiresAt: expiryDate };
        }
        return { isPremium: true };
      }

      return { isPremium: false };
    } catch (error) {
      console.error('[IAP] Error checking subscription:', error);
      return { isPremium: false };
    }
  }

  /**
   * Disconnect from store (call when app closes)
   */
  static async disconnect() {
    try {
      if (Platform.OS === 'web') return;

      const IAP = await getInAppPurchases();
      if (!IAP) return;

      await IAP.disconnectAsync();
      this.initialized = false;
      console.log('[IAP] Disconnected from store');
    } catch (error) {
      console.warn('[IAP] Disconnect error:', error);
    }
  }
}
