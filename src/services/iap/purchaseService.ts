import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '../supabase/client';

// Check if running in Expo Go (native modules not available)
const isExpoGo = Constants.appOwnership === 'expo';

// Product IDs - MUST match Google Play Console / App Store Connect exactly
export const PRODUCT_IDS = {
  PREMIUM_MONTHLY: 'premium',
};

// Subscription SKUs
const SUBSCRIPTION_SKUS = ['premium'];

// Supabase Edge Function URL for receipt validation
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://zfnwtnqwokwvuxxwxgsr.supabase.co';
const VALIDATE_RECEIPT_URL = SUPABASE_URL + '/functions/v1/validate-receipt';

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

export interface IAPProduct {
  productId: string;
  title: string;
  description: string;
  price: string;
  priceAmountMicros: number;
  priceCurrencyCode: string;
}

// Lazy load expo-iap to avoid crashes in Expo Go
let expoIap: any = null;
const getExpoIap = async () => {
  if (isExpoGo) {
    console.log('[IAP] Running in Expo Go - IAP not available');
    return null;
  }
  if (!expoIap) {
    try {
      expoIap = await import('expo-iap');
    } catch (e) {
      console.warn('[IAP] Failed to load expo-iap:', e);
      return null;
    }
  }
  return expoIap;
};

export class PurchaseService {
  private static initialized = false;
  private static products: IAPProduct[] = [];
  private static currentUserId: string | null = null;
  private static purchaseUpdateSubscription: { remove: () => void } | null = null;
  private static purchaseErrorSubscription: { remove: () => void } | null = null;

  static subscribe(callback: PurchaseEventCallback): () => void {
    listeners.add(callback);
    return () => listeners.delete(callback);
  }

  private static emit(event: PurchaseEvent) {
    listeners.forEach(callback => callback(event));
  }

  static async initialize(): Promise<boolean> {
    if (this.initialized) {
      console.log('[IAP] Already initialized');
      return true;
    }

    if (Platform.OS === 'web') {
      console.log('[IAP] Web platform - skipping initialization');
      return false;
    }

    if (isExpoGo) {
      console.log('[IAP] Expo Go detected - IAP not available, using fallback');
      this.setFallbackProducts();
      this.initialized = true;
      return false;
    }

    try {
      console.log('[IAP] Initializing expo-iap...');
      
      const iap = await getExpoIap();
      if (!iap) {
        this.setFallbackProducts();
        this.initialized = true;
        return false;
      }

      await iap.initConnection();
      console.log('[IAP] Connected to store');

      await this.setupPurchaseListeners();
      await this.fetchProductsFromStore();

      this.initialized = true;
      console.log('[IAP] Initialized successfully with products:', this.products.length);
      return true;
    } catch (error: any) {
      console.error('[IAP] Initialization error:', error.message);
      this.setFallbackProducts();
      this.initialized = true;
      return false;
    }
  }

  private static async setupPurchaseListeners() {
    const iap = await getExpoIap();
    if (!iap) return;

    if (this.purchaseUpdateSubscription) {
      this.purchaseUpdateSubscription.remove();
    }
    if (this.purchaseErrorSubscription) {
      this.purchaseErrorSubscription.remove();
    }

    this.purchaseUpdateSubscription = iap.purchaseUpdatedListener(
      async (purchase: any) => {
        console.log('[IAP] Purchase updated:', purchase.productId);
        
        const receipt = purchase.transactionReceipt || purchase.purchaseToken;
        if (receipt) {
          try {
            if (!__DEV__) {
              console.log('[IAP] Validating receipt server-side...');
              const validated = await this.validateReceiptServerSide(
                receipt,
                purchase.productId
              );
              
              if (!validated) {
                console.error('[IAP] Server-side validation failed');
                this.emit({ type: 'PURCHASE_FAILED', error: 'Receipt validation failed' });
                return;
              }
            } else {
              await this.updateUserPremiumStatus(true);
            }

            await iap.finishTransaction({ purchase, isConsumable: false });
            console.log('[IAP] Transaction finished');
            
            this.emit({ type: 'PURCHASE_SUCCESS', productId: purchase.productId });
          } catch (err) {
            console.error('[IAP] Error finishing transaction:', err);
            this.emit({ type: 'PURCHASE_FAILED', error: 'Failed to process purchase' });
          }
        }
      }
    );

    this.purchaseErrorSubscription = iap.purchaseErrorListener(
      (error: any) => {
        console.log('[IAP] Purchase error:', error.code, error.message);
        
        if (error.code === 'E_USER_CANCELLED' || error.message?.includes('cancel')) {
          this.emit({ type: 'PURCHASE_CANCELED' });
        } else {
          this.emit({ type: 'PURCHASE_FAILED', error: error.message || 'Purchase failed' });
        }
      }
    );
  }

  private static async fetchProductsFromStore() {
    const iap = await getExpoIap();
    if (!iap) {
      this.setFallbackProducts();
      return;
    }

    try {
      console.log('[IAP] Fetching products...');
      
      const products = await iap.fetchProducts({
        skus: SUBSCRIPTION_SKUS,
        type: 'subs',
      });
      
      if (products && products.length > 0) {
        console.log('[IAP] Products fetched:', products.length);
        
        this.products = products.map((product: any) => ({
          productId: product.productId || product.id,
          title: product.title || product.name || 'Premium',
          description: product.description || 'Unlock all premium features',
          price: product.localizedPrice || product.displayPrice || '$1.99',
          priceAmountMicros: Math.round(parseFloat(String(product.price || '1.99')) * 1000000),
          priceCurrencyCode: product.currency || 'USD',
        }));
      } else {
        console.log('[IAP] No products found, using fallback');
        this.setFallbackProducts();
      }
    } catch (error: any) {
      console.error('[IAP] Error fetching products:', error.message);
      this.setFallbackProducts();
    }
  }

  private static setFallbackProducts() {
    this.products = [{
      productId: PRODUCT_IDS.PREMIUM_MONTHLY,
      title: 'Premium Monthly',
      description: 'Unlock all premium features',
      price: '$1.99',
      priceAmountMicros: 1990000,
      priceCurrencyCode: 'USD',
    }];
  }

  private static async validateReceiptServerSide(
    receipt: string,
    productId: string
  ): Promise<boolean> {
    if (!this.currentUserId) {
      console.error('[IAP] No user ID for server validation');
      return false;
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      const accessToken = session?.session?.access_token;

      const response = await fetch(VALIDATE_RECEIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + accessToken,
        },
        body: JSON.stringify({
          platform: Platform.OS,
          receipt,
          productId,
          userId: this.currentUserId,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('[IAP] Server validation successful');
        await this.updateUserPremiumStatus(true);
        return true;
      } else {
        console.error('[IAP] Server validation failed:', result.error);
        return false;
      }
    } catch (error) {
      console.error('[IAP] Server validation error:', error);
      if (__DEV__) {
        console.log('[IAP] Falling back to local validation in dev mode');
        await this.updateUserPremiumStatus(true);
        return true;
      }
      return false;
    }
  }

  private static async updateUserPremiumStatus(isPremium: boolean) {
    if (!this.currentUserId) return;

    const now = new Date();
    const premiumUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    console.log('[IAP] Setting premium status:', {
      isPremium,
      userId: this.currentUserId,
      premiumUntil: premiumUntil.toISOString(),
    });

    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_premium: isPremium,
        premium_until: isPremium ? premiumUntil.toISOString() : null,
        updated_at: now.toISOString(),
      })
      .eq('id', this.currentUserId);

    if (updateError) {
      console.error('[IAP] Error updating premium status:', updateError);
      
      const { data: authData } = await supabase.auth.getUser();
      const email = authData?.user?.email;

      if (email) {
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: this.currentUserId,
            email: email,
            is_premium: isPremium,
            premium_until: isPremium ? premiumUntil.toISOString() : null,
            updated_at: now.toISOString(),
          });

        if (insertError) {
          console.error('[IAP] Error creating user record:', insertError);
          throw insertError;
        }
      }
    }

    console.log('[IAP] Premium status updated successfully');
  }

  static getProducts(): IAPProduct[] {
    return this.products;
  }

  static getPremiumPrice(): string {
    const product = this.products.find(p => p.productId === PRODUCT_IDS.PREMIUM_MONTHLY);
    return product?.price || '$1.99';
  }

  static async purchasePremium(userId: string): Promise<{ success: boolean; error?: string }> {
    console.log('[IAP] Purchase requested for user:', userId);
    this.currentUserId = userId;
    
    if (Platform.OS === 'web') {
      return { success: false, error: 'In-App Purchases are only available on iOS and Android' };
    }

    if (isExpoGo) {
      // In Expo Go, simulate purchase for testing
      console.log('[IAP] Expo Go detected - simulating purchase');
      return this.simulatePurchase(userId);
    }

    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const iap = await getExpoIap();
      if (!iap) {
        return { success: false, error: 'IAP not available' };
      }

      console.log('[IAP] Requesting subscription for:', PRODUCT_IDS.PREMIUM_MONTHLY);
      
      await iap.requestPurchase({
        request: {
          apple: { sku: PRODUCT_IDS.PREMIUM_MONTHLY },
          google: { skus: [PRODUCT_IDS.PREMIUM_MONTHLY] },
        },
        type: 'subs',
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('[IAP] Purchase error:', error.message, error);
      
      if (error.code === 'E_USER_CANCELLED' || error.message?.includes('cancel')) {
        this.emit({ type: 'PURCHASE_CANCELED' });
        return { success: false };
      }
      
      return { 
        success: false, 
        error: error.message || 'Failed to complete purchase. Please try again.' 
      };
    }
  }

  static async simulatePurchase(userId: string): Promise<{ success: boolean; error?: string }> {
    if (!__DEV__ && !isExpoGo) {
      return { success: false, error: 'Simulation only available in development' };
    }
    
    console.log('[IAP] DEV: Simulating successful purchase for user:', userId);
    this.currentUserId = userId;
    
    try {
      await this.updateUserPremiumStatus(true);
      this.emit({ type: 'PURCHASE_SUCCESS', productId: PRODUCT_IDS.PREMIUM_MONTHLY });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async resetPremium(userId: string): Promise<{ success: boolean; error?: string }> {
    if (!__DEV__ && !isExpoGo) {
      return { success: false, error: 'Reset only available in development' };
    }
    
    console.log('[IAP] DEV: Resetting premium for user:', userId);
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          is_premium: false, 
          premium_until: null,
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      console.log('[IAP] DEV: Premium reset successfully');
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async restorePurchases(): Promise<{ success: boolean; restored: boolean; error?: string }> {
    console.log('[IAP] Restore requested');
    
    if (Platform.OS === 'web') {
      return { success: false, restored: false, error: 'Not available on web' };
    }

    if (isExpoGo) {
      return { success: true, restored: false, error: 'Not available in Expo Go' };
    }

    try {
      const iap = await getExpoIap();
      if (!iap) {
        return { success: false, restored: false, error: 'IAP not available' };
      }

      const purchases = await iap.getAvailablePurchases();
      console.log('[IAP] Available purchases:', purchases?.length || 0);

      if (purchases && purchases.length > 0) {
        const hasPremium = purchases.some(
          (purchase: any) => purchase.productId === PRODUCT_IDS.PREMIUM_MONTHLY
        );

        if (hasPremium) {
          await this.updateUserPremiumStatus(true);
          this.emit({ type: 'RESTORE_SUCCESS', restored: true });
          return { success: true, restored: true };
        }
      }

      this.emit({ type: 'RESTORE_SUCCESS', restored: false });
      return { success: true, restored: false };
    } catch (error: any) {
      console.error('[IAP] Restore error:', error);
      this.emit({ type: 'RESTORE_FAILED', error: error.message });
      return { 
        success: false, 
        restored: false, 
        error: error.message || 'Failed to restore purchases' 
      };
    }
  }

  static async checkSubscriptionStatus(userId: string): Promise<{ isPremium: boolean; expiresAt?: Date; daysRemaining?: number }> {
    try {
      console.log('[IAP] Checking subscription status for:', userId);
      
      const { data, error } = await supabase
        .from('users')
        .select('is_premium, premium_until')
        .eq('id', userId)
        .single();

      if (error || !data) {
        console.log('[IAP] No user data found');
        return { isPremium: false };
      }

      if (data.is_premium) {
        if (data.premium_until) {
          const expiryDate = new Date(data.premium_until);
          const now = new Date();
          const isActive = expiryDate > now;
          
          if (!isActive) {
            console.log('[IAP] Premium expired, updating status');
            await supabase
              .from('users')
              .update({ 
                is_premium: false,
                updated_at: now.toISOString(),
              })
              .eq('id', userId);
            
            return { isPremium: false };
          }
          
          const msRemaining = expiryDate.getTime() - now.getTime();
          const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));
          
          return { isPremium: true, expiresAt: expiryDate, daysRemaining };
        }
        return { isPremium: true };
      }

      return { isPremium: false };
    } catch (error) {
      console.error('[IAP] Error checking subscription:', error);
      return { isPremium: false };
    }
  }

  static async verifyAndSyncSubscription(userId: string): Promise<void> {
    if (Platform.OS === 'web' || isExpoGo) return;
    
    if (__DEV__) {
      console.log('[IAP] Skipping subscription verification in dev mode');
      return;
    }
    
    try {
      console.log('[IAP] Verifying subscription with store...');
      this.currentUserId = userId;
      
      const iap = await getExpoIap();
      if (!iap) return;

      const purchases = await iap.getAvailablePurchases();
      
      if (purchases && purchases.length > 0) {
        const premiumPurchase = purchases.find(
          (purchase: any) => purchase.productId === PRODUCT_IDS.PREMIUM_MONTHLY
        );
        
        if (premiumPurchase) {
          console.log('[IAP] Found active subscription, syncing...');
          await this.updateUserPremiumStatus(true);
        }
      }
    } catch (error) {
      console.error('[IAP] Error verifying subscription:', error);
    }
  }

  static async setUserId(userId: string) {
    this.currentUserId = userId;
    console.log('[IAP] User ID set:', userId);
  }

  static async logoutUser() {
    this.currentUserId = null;
    console.log('[IAP] User logged out');
  }

  static async cleanup() {
    try {
      if (this.purchaseUpdateSubscription) {
        this.purchaseUpdateSubscription.remove();
        this.purchaseUpdateSubscription = null;
      }
      if (this.purchaseErrorSubscription) {
        this.purchaseErrorSubscription.remove();
        this.purchaseErrorSubscription = null;
      }
      
      if (!isExpoGo) {
        const iap = await getExpoIap();
        if (iap) {
          await iap.endConnection();
        }
      }
    } catch (error) {
      console.error('[IAP] Error disconnecting:', error);
    }
    
    this.initialized = false;
    console.log('[IAP] Cleaned up');
  }
}
