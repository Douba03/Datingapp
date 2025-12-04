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

export interface Product {
  productId: string;
  title: string;
  description: string;
  price: string;
  priceAmountMicros: number;
  priceCurrencyCode: string;
}

// IAP module placeholder - will be replaced with react-native-iap after Google Play setup
let RNIap: any = null;

/**
 * Purchase Service
 * Currently uses placeholder mode - real IAP will be added after Google Play setup
 */
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

      // Try to load react-native-iap (works in local builds with native code)
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        try {
          // @ts-ignore - Optional native module
          const iapModule = require('react-native-iap');
          
          if (iapModule && typeof iapModule.initConnection === 'function') {
            RNIap = iapModule;
            console.log('[IAP] react-native-iap loaded successfully');
          } else {
            console.log('[IAP] react-native-iap module structure invalid - using placeholder mode');
            return this.initializePlaceholder();
          }
        } catch (e: any) {
          // Module not available - this happens in Expo Go or if native code isn't built
          console.log('[IAP] react-native-iap not available - using placeholder mode');
          console.log('[IAP] Build locally with: npx expo run:android');
          return this.initializePlaceholder();
        }
      } else {
        return this.initializePlaceholder();
      }

      // Initialize connection to store
      if (!RNIap) {
        return this.initializePlaceholder();
      }
      
      try {
        const connection = await RNIap.initConnection();
        console.log('[IAP] Connection result:', connection);
      } catch (e: any) {
        console.warn('[IAP] Failed to initialize connection:', e?.message || e);
        return this.initializePlaceholder();
      }

      // Get subscriptions from store
      if (!RNIap || typeof RNIap.getSubscriptions !== 'function') {
        return this.initializePlaceholder();
      }
      
      const productIds = [PRODUCT_IDS.PREMIUM_MONTHLY].filter(Boolean) as string[];
      
      try {
        const subscriptions = await RNIap.getSubscriptions({ skus: productIds });
        console.log('[IAP] Subscriptions:', subscriptions);
        
        if (subscriptions && subscriptions.length > 0) {
          this.products = subscriptions.map((sub: any) => ({
            productId: sub.productId,
            title: sub.title || 'Premium Monthly',
            description: sub.description || 'Unlock all premium features',
            price: sub.localizedPrice || '$1.99',
            priceAmountMicros: parseInt(sub.price || '1990000'),
            priceCurrencyCode: sub.currency || 'USD',
          }));
        } else {
          // No products found, use placeholder
          return this.initializePlaceholder();
        }
      } catch (productError: any) {
        console.warn('[IAP] Could not fetch products:', productError?.message || productError);
        // Use placeholder products
        return this.initializePlaceholder();
      }

      // Set up purchase listeners
      this.setupPurchaseListeners();

      this.initialized = true;
      console.log('[IAP] Initialized successfully with', this.products.length, 'products');
      return true;
    } catch (error: any) {
      console.warn('[IAP] Initialization error:', error.message);
      return this.initializePlaceholder();
    }
  }

  /**
   * Initialize with placeholder (fallback)
   */
  private static initializePlaceholder(): boolean {
    this.products = [
      {
        productId: PRODUCT_IDS.PREMIUM_MONTHLY || 'premium_monthly_199_android',
        title: 'Premium Monthly',
        description: 'Unlock all premium features',
        price: '$1.99',
        priceAmountMicros: 1990000,
        priceCurrencyCode: 'USD',
      },
    ];
    this.initialized = true;
    console.log('[IAP] Initialized in placeholder mode');
    return true;
  }

  /**
   * Set up listeners for purchase events
   */
  private static setupPurchaseListeners() {
    if (!RNIap || typeof RNIap.purchaseUpdatedListener !== 'function') {
      console.warn('[IAP] Cannot setup listeners - module not available');
      return;
    }

    // Listen for successful purchases
    this.purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(
      async (purchase: any) => {
        console.log('[IAP] Purchase updated:', purchase);
        
        const receipt = purchase.transactionReceipt;
        if (receipt) {
          try {
            // Verify and process the purchase
            await this.processPurchase(purchase);
            
            // Acknowledge the purchase (Android requirement)
            if (Platform.OS === 'android' && !purchase.isAcknowledgedAndroid) {
              await RNIap?.acknowledgePurchaseAndroid({ token: purchase.purchaseToken });
            }
            
            // Finish the transaction
            await RNIap?.finishTransaction({ purchase, isConsumable: false });
            
            this.emit({ type: 'PURCHASE_SUCCESS', productId: purchase.productId });
          } catch (error: any) {
            console.error('[IAP] Error processing purchase:', error);
            this.emit({ type: 'PURCHASE_FAILED', error: error.message });
          }
        }
      }
    );

    // Listen for purchase errors
    this.purchaseErrorSubscription = RNIap.purchaseErrorListener(
      (error: any) => {
        console.log('[IAP] Purchase error:', error);
        
        if (error.code === 'E_USER_CANCELLED') {
          this.emit({ type: 'PURCHASE_CANCELED' });
        } else {
          this.emit({ type: 'PURCHASE_FAILED', error: error.message });
        }
      }
    );
  }

  /**
   * Process a successful purchase
   */
  private static async processPurchase(purchase: any) {
    if (!this.currentUserId) {
      throw new Error('No user ID set for purchase');
    }

    // Update user to premium in Supabase
    const { error } = await supabase
      .from('users')
      .update({
        is_premium: true,
        premium_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        premium_transaction_id: purchase.transactionId || purchase.orderId,
      })
      .eq('id', this.currentUserId);

    if (error) {
      console.error('[IAP] Error updating user premium status:', error);
      throw error;
    }

    // Record the payment in payments table
    await supabase.from('payments').insert({
      user_id: this.currentUserId,
      amount_cents: 199,
      currency: 'USD',
      status: 'succeeded',
      provider: Platform.OS === 'ios' ? 'apple' : 'google',
      product: purchase.productId,
      metadata: {
        transaction_id: purchase.transactionId || purchase.orderId,
        purchase_token: purchase.purchaseToken,
      },
    });

    console.log('[IAP] Successfully upgraded user to premium');
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

      // Store user ID for processing
      this.currentUserId = userId;

      // Check if react-native-iap is available
      if (!RNIap || typeof RNIap.requestSubscription !== 'function') {
        // Show placeholder message
        Alert.alert(
          'Test Mode',
          'Real payments require publishing to Google Play. Use "Skip Payment" button to test premium features.',
          [{ text: 'OK' }]
        );
        this.emit({ type: 'PURCHASE_CANCELED' });
        return { success: false, error: 'IAP not available in development' };
      }

      const productId = PRODUCT_IDS.PREMIUM_MONTHLY;
      if (!productId) {
        return { success: false, error: 'Product not configured for this platform' };
      }

      console.log('[IAP] Requesting subscription:', productId);
      
      // Request the subscription purchase
      await RNIap.requestSubscription({
        sku: productId,
        // For Android, you need to specify the offer token for subscriptions
        ...(Platform.OS === 'android' && {
          subscriptionOffers: [{ sku: productId, offerToken: '' }],
        }),
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

      if (!RNIap || typeof RNIap.getAvailablePurchases !== 'function') {
        Alert.alert(
          'Test Mode',
          'Restore purchases is not available in development mode.',
          [{ text: 'OK' }]
        );
        this.emit({ type: 'RESTORE_SUCCESS', restored: false });
        return { success: true, restored: false };
      }

      console.log('[IAP] Restoring purchases...');
      
      const purchases = await RNIap.getAvailablePurchases();
      console.log('[IAP] Available purchases:', purchases);
      
      // Check if user has any premium purchases
      const hasPremium = purchases.some(
        (p: any) => p.productId === PRODUCT_IDS.PREMIUM_MONTHLY
      );

      if (hasPremium) {
        // Process the restoration
        const latestPurchase = purchases.find(
          (p: any) => p.productId === PRODUCT_IDS.PREMIUM_MONTHLY
        );
        if (latestPurchase && this.currentUserId) {
          await this.processPurchase(latestPurchase);
        }
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
   * Disconnect from store (call when app closes)
   */
  static async disconnect() {
    try {
      if (this.purchaseUpdateSubscription) {
        this.purchaseUpdateSubscription.remove();
        this.purchaseUpdateSubscription = null;
      }
      if (this.purchaseErrorSubscription) {
        this.purchaseErrorSubscription.remove();
        this.purchaseErrorSubscription = null;
      }
      
      if (RNIap) {
        await RNIap.endConnection();
      }
      
      this.initialized = false;
      console.log('[IAP] Disconnected');
    } catch (error) {
      console.warn('[IAP] Error disconnecting:', error);
    }
  }
}
