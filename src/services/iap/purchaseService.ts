import { Platform, Alert } from 'react-native';
import { supabase } from '../supabase/client';
import * as RNIap from 'react-native-iap';

// Product IDs - MUST match Google Play Console exactly
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
  private static purchaseUpdateSubscription: any = null;
  private static purchaseErrorSubscription: any = null;
  private static currentUserId: string | null = null;

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
   */
  static async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
        console.log('[IAP] Platform does not support IAP (web)');
        return false;
      }

      // Initialize connection to Google Play / App Store
      await RNIap.initConnection();
      console.log('[IAP] Connected to store');

      // Get available products
      const productIds = [PRODUCT_IDS.PREMIUM_MONTHLY].filter(Boolean) as string[];
      
      const products = await RNIap.getProducts({ skus: productIds });
      console.log('[IAP] Available products:', products);

      if (products && products.length > 0) {
        this.products = products.map((product: any) => ({
          productId: product.productId,
          title: product.title || 'Premium Monthly',
          description: product.description || 'Unlock all premium features',
          price: product.localizedPrice || '$1.99',
          priceAmountMicros: product.priceAmountMicros || 1990000,
          priceCurrencyCode: product.currency || 'USD',
        }));
      } else {
        console.warn('[IAP] No products found in store');
        // Use placeholder products for development
        this.products = [{
          productId: PRODUCT_IDS.PREMIUM_MONTHLY || 'premium_monthly_199_android',
          title: 'Premium Monthly',
          description: 'Unlock all premium features',
          price: '$1.99',
          priceAmountMicros: 1990000,
          priceCurrencyCode: 'USD',
        }];
      }

      // Set up purchase listeners
      this.setupPurchaseListeners();

      this.initialized = true;
      console.log('[IAP] Initialized successfully with', this.products.length, 'products');
      return true;
    } catch (error: any) {
      console.error('[IAP] Initialization error:', error.message);
      return false;
    }
  }

  /**
   * Set up listeners for purchase events
   */
  private static setupPurchaseListeners() {
    // Listen for purchase updates
    this.purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(
      async (purchase: RNIap.Purchase) => {
        console.log('[IAP] Purchase updated:', purchase);
        
        try {
          // Acknowledge the purchase (required for Android)
          if (Platform.OS === 'android') {
            await RNIap.acknowledgePurchaseAndroid(purchase.purchaseToken);
          }

          // Update user premium status in Supabase
          if (this.currentUserId) {
            await this.updateUserPremiumStatus(true);
            this.emit({ type: 'PURCHASE_SUCCESS', productId: purchase.productId });
          }
        } catch (error: any) {
          console.error('[IAP] Error processing purchase:', error);
          this.emit({ type: 'PURCHASE_FAILED', error: error.message });
        }
      }
    );

    // Listen for purchase errors
    this.purchaseErrorSubscription = RNIap.purchaseErrorListener(
      (error: RNIap.PurchaseError) => {
        console.error('[IAP] Purchase error:', error);
        
        if (error.code === 'E_USER_CANCELLED') {
          this.emit({ type: 'PURCHASE_CANCELED' });
        } else {
          this.emit({ type: 'PURCHASE_FAILED', error: error.message });
        }
      }
    );
  }

  /**
   * Update user premium status in Supabase
   */
  private static async updateUserPremiumStatus(isPremium: boolean) {
    if (!this.currentUserId) return;

    const { error } = await supabase
      .from('users')
      .update({
        is_premium: isPremium,
        premium_until: isPremium ? new Date('2099-12-31').toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', this.currentUserId);

    if (error) {
      console.error('[IAP] Error updating user premium status:', error);
      throw error;
    }

    console.log('[IAP] User premium status updated:', isPremium);
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

      this.currentUserId = userId;

      const productId = PRODUCT_IDS.PREMIUM_MONTHLY;
      if (!productId) {
        return { success: false, error: 'Product not configured for this platform' };
      }

      console.log('[IAP] Requesting subscription:', productId);
      
      // Request the subscription purchase
      await RNIap.requestSubscription({
        sku: productId,
        andDangerouslyFinishTransactionAutomaticallyIOS: false,
      });

      return { success: true };
    } catch (error: any) {
      console.error('[IAP] Purchase error:', error);
      
      if (error.code === 'E_USER_CANCELLED') {
        this.emit({ type: 'PURCHASE_CANCELED' });
        return { success: false };
      }
      
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

      console.log('[IAP] Restoring purchases...');

      // Get available purchases
      const purchases = await RNIap.getAvailablePurchases();
      console.log('[IAP] Available purchases:', purchases);

      // Check if user has premium subscription
      const hasPremium = purchases.some(
        (purchase: RNIap.Purchase) => purchase.productId === PRODUCT_IDS.PREMIUM_MONTHLY
      );

      if (hasPremium && this.currentUserId) {
        await this.updateUserPremiumStatus(true);
      }

      this.emit({ type: 'RESTORE_SUCCESS', restored: hasPremium });
      return { success: true, restored: hasPremium };
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
   * Set user ID (for tracking)
   */
  static async setUserId(userId: string) {
    this.currentUserId = userId;
    console.log('[IAP] User ID set:', userId);
  }

  /**
   * Log out user
   */
  static async logoutUser() {
    this.currentUserId = null;
    console.log('[IAP] User logged out');
  }

  /**
   * Clean up listeners
   */
  static async cleanup() {
    if (this.purchaseUpdateSubscription) {
      this.purchaseUpdateSubscription.remove();
      this.purchaseUpdateSubscription = null;
    }
    if (this.purchaseErrorSubscription) {
      this.purchaseErrorSubscription.remove();
      this.purchaseErrorSubscription = null;
    }
    await RNIap.endConnection();
    this.initialized = false;
  }
}