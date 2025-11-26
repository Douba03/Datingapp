# 🍎 Apple In-App Purchase (IAP) Setup Guide

**For:** iOS Premium Subscription ($1.99/month)

---

## 📋 **REQUIREMENTS**

1. ✅ Apple Developer Account ($99/year)
2. ✅ App Store Connect access
3. ✅ `expo-in-app-purchases` package (already installed ✅)
4. ✅ iOS app with Bundle ID configured

---

## 🚀 **STEP 1: Configure App Store Connect**

### 1.1 Create App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Navigate to **"My Apps"**
3. Click **"+" → "New App"**
4. Fill in:
   - **Platform:** iOS
   - **Name:** Partner Productivity App (or your app name)
   - **Primary Language:** English
   - **Bundle ID:** `com.anonymous.partnerproductivityapp` (from your app.json)
   - **SKU:** `partner-productivity-ios-001`
   - **User Access:** Full Access

### 1.2 Create In-App Purchase Product

1. In your app, go to **"Features" → "In-App Purchases"**
2. Click **"+" → "Create"**
3. Choose **"Auto-Renewable Subscriptions"**
4. Create Subscription Group (if first time):
   - **Reference Name:** Premium Subscription
   - **ID:** `premium_subscription_group`

5. Create Subscription Product:
   - **Type:** Auto-Renewable Subscription
   - **Reference Name:** Premium Monthly
   - **Product ID:** `premium_monthly_199`
   - **Subscription Duration:** 1 Month
   - **Price:** $1.99 USD

6. Fill in Subscription Information:
   - **Display Name:** Premium Monthly
   - **Description:** Unlimited swipes, see who liked you, undo swipes, profile boost, and more!

7. Add Subscription Localizations:
   - **Language:** English (U.S.)
   - **Name:** Premium Monthly
   - **Description:** Get unlimited swipes, see who liked you, undo your last swipe, boost your profile once per day, and more premium features!

8. Review and Submit:
   - Review all information
   - Click **"Save"** and **"Submit for Review"** (or mark as "Ready to Submit" when app is ready)

---

## 🔧 **STEP 2: Configure app.json**

Your `app.json` is already configured for iOS:

```json
{
  "expo": {
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.anonymous.partnerproductivityapp"
    },
    "plugins": [
      "expo-in-app-purchases"
    ]
  }
}
```

**Note:** Make sure your Bundle ID matches what you set in App Store Connect!

---

## 💻 **STEP 3: Implement IAP in Code**

### 3.1 Create IAP Service

**File:** `src/services/iap/purchaseService.ts` (NEW)

```typescript
import * as InAppPurchases from 'expo-in-app-purchases';
import { Platform, Alert } from 'react-native';
import { supabase } from '../supabase/client';

// Product IDs (must match App Store Connect)
const PRODUCT_IDS = {
  PREMIUM_MONTHLY: Platform.select({
    ios: 'premium_monthly_199',
    android: 'premium_monthly_199_android', // Set up in Google Play Console
  }),
};

export class PurchaseService {
  private static initialized = false;

  /**
   * Initialize In-App Purchases
   * Call this once when app starts
   */
  static async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
        console.warn('[IAP] Platform does not support IAP');
        return false;
      }

      const isConnected = await InAppPurchases.connectAsync();
      
      if (!isConnected) {
        console.error('[IAP] Failed to connect to store');
        return false;
      }

      // Set up purchase listener
      InAppPurchases.setPurchaseListener(({ response, errorCode }) => {
        if (response) {
          this.handlePurchaseUpdate(response);
        } else if (errorCode) {
          console.error('[IAP] Purchase error:', errorCode);
        }
      });

      this.initialized = true;
      console.log('[IAP] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[IAP] Initialization error:', error);
      return false;
    }
  }

  /**
   * Get available products
   */
  static async getProducts(): Promise<InAppPurchases.InAppPurchase[]> {
    try {
      const products = await InAppPurchases.getProductsAsync([
        PRODUCT_IDS.PREMIUM_MONTHLY!,
      ]);

      return products.results;
    } catch (error) {
      console.error('[IAP] Error fetching products:', error);
      return [];
    }
  }

  /**
   * Purchase Premium Subscription
   */
  static async purchasePremium(userId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      if (!this.initialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          return { success: false, error: 'Failed to initialize IAP' };
        }
      }

      if (!PRODUCT_IDS.PREMIUM_MONTHLY) {
        return { success: false, error: 'Product ID not configured' };
      }

      console.log('[IAP] Initiating purchase:', PRODUCT_IDS.PREMIUM_MONTHLY);

      // Purchase the product
      await InAppPurchases.purchaseItemAsync(PRODUCT_IDS.PREMIUM_MONTHLY);

      // The purchase listener will handle the result
      return { success: true };
    } catch (error: any) {
      console.error('[IAP] Purchase error:', error);
      return {
        success: false,
        error: error.message || 'Purchase failed',
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
      if (!this.initialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          return { success: false, restored: false, error: 'Failed to initialize IAP' };
        }
      }

      console.log('[IAP] Restoring purchases...');

      // Restore purchases
      await InAppPurchases.restorePurchasesAsync();

      return { success: true, restored: true };
    } catch (error: any) {
      console.error('[IAP] Restore error:', error);
      return {
        success: false,
        restored: false,
        error: error.message || 'Restore failed',
      };
    }
  }

  /**
   * Handle purchase updates from listener
   */
  private static async handlePurchaseUpdate(
    response: InAppPurchases.InAppPurchaseResponse
  ) {
    console.log('[IAP] Purchase update:', response);

    for (const purchase of response.results) {
      if (purchase) {
        await this.verifyAndActivatePurchase(purchase);
      }
    }

    // Finish the transaction
    if (response.results.length > 0) {
      const receipts = response.results.map((p) => p?.acknowledged ? undefined : p?.transactionReceipt).filter(Boolean);
      if (receipts.length > 0) {
        await InAppPurchases.finishTransactionAsync(receipts[0]!, false);
      }
    }
  }

  /**
   * Verify purchase receipt and activate premium
   */
  private static async verifyAndActivatePurchase(
    purchase: InAppPurchases.InAppPurchase
  ) {
    try {
      // Get user ID from auth
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('[IAP] No user logged in');
        return;
      }

      // Verify receipt with your backend or Apple's servers
      // For now, we'll update the user directly
      // In production, verify receipt on your backend first!
      
      const { error } = await supabase
        .from('users')
        .update({
          is_premium: true,
          premium_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        })
        .eq('id', user.id);

      if (error) {
        console.error('[IAP] Error activating premium:', error);
        return;
      }

      console.log('[IAP] Premium activated successfully');

      // TODO: Save receipt to database for verification
      // Save subscription info:
      // - product_id: purchase.productId
      // - transaction_id: purchase.transactionId
      // - receipt: purchase.transactionReceipt
      // - purchase_date: purchase.purchaseTime

    } catch (error) {
      console.error('[IAP] Error verifying purchase:', error);
    }
  }

  /**
   * Check if user has active subscription
   */
  static async checkSubscriptionStatus(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_premium, premium_until')
        .eq('id', userId)
        .single();

      if (error || !data) return false;

      // Check if premium is active
      if (!data.is_premium) return false;

      // Check if subscription hasn't expired
      if (data.premium_until) {
        const expiryDate = new Date(data.premium_until);
        return expiryDate > new Date();
      }

      return data.is_premium;
    } catch (error) {
      console.error('[IAP] Error checking subscription:', error);
      return false;
    }
  }

  /**
   * Disconnect from store (call when app closes)
   */
  static async disconnect() {
    try {
      await InAppPurchases.disconnectAsync();
      this.initialized = false;
      console.log('[IAP] Disconnected');
    } catch (error) {
      console.error('[IAP] Disconnect error:', error);
    }
  }
}
```

---

### 3.2 Update Payment Screen

**File:** `src/app/(onboarding)/payment.tsx`

Update `handlePurchasePremium`:

```typescript
import { PurchaseService } from '../../services/iap/purchaseService';

const handlePurchasePremium = async () => {
  if (!user) {
    Alert.alert('Error', 'You must be logged in to purchase Premium');
    router.replace('/(auth)/login');
    return;
  }

  setProcessingPayment(true);

  try {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      // Use In-App Purchase
      const result = await PurchaseService.purchasePremium(user.id);
      
      if (result.success) {
        // Purchase initiated, listener will handle completion
        // Show loading state until purchase completes
        Alert.alert(
          'Processing Purchase',
          'Your purchase is being processed...',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Purchase Failed', result.error || 'Could not complete purchase');
      }
    } else {
      // Web - not supported
      Alert.alert(
        'Premium Purchase',
        'In-App Purchases are only available on iOS and Android. Please use the mobile app.',
        [{ text: 'OK' }]
      );
    }
  } catch (error: any) {
    console.error('[Payment] Purchase error:', error);
    Alert.alert('Error', error.message || 'Failed to initiate purchase');
  } finally {
    setProcessingPayment(false);
  }
};
```

---

### 3.3 Initialize IAP on App Start

**File:** `App.tsx` or `_layout.tsx`

```typescript
import { useEffect } from 'react';
import { PurchaseService } from './src/services/iap/purchaseService';
import { Platform } from 'react-native';

export default function RootLayout() {
  useEffect(() => {
    // Initialize IAP when app starts
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      PurchaseService.initialize().catch(console.error);
    }

    // Cleanup on unmount
    return () => {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        PurchaseService.disconnect().catch(console.error);
      }
    };
  }, []);

  // ... rest of your app
}
```

---

## 🧪 **STEP 4: Testing**

### 4.1 Test in Sandbox

1. **Create Sandbox Test Account:**
   - App Store Connect → Users and Access → Sandbox Testers
   - Click **"+" → Add Tester**
   - Use a **new** email address (not your Apple ID)
   - Create password

2. **Test on Device:**
   - Sign out of your Apple ID in Settings → App Store
   - Build and install your app on a physical iOS device
   - When prompted, sign in with **Sandbox Test Account**
   - Try purchasing Premium subscription
   - It will be FREE in sandbox mode!

3. **Verify Purchase:**
   - Check that `is_premium` is set to `true` in database
   - Verify `premium_until` is set correctly
   - Test premium features work

### 4.2 Test Restore Purchases

```typescript
// In your settings/profile screen
const handleRestorePurchases = async () => {
  const result = await PurchaseService.restorePurchases();
  
  if (result.success && result.restored) {
    Alert.alert('Success', 'Your purchases have been restored!');
  } else {
    Alert.alert('No Purchases', result.error || 'No purchases found to restore');
  }
};
```

---

## 🔒 **STEP 5: Receipt Verification (Production)**

### Important: Verify Receipts on Your Backend!

**For Production:** You MUST verify receipts on your backend server, not in the app!

1. **Create Backend Endpoint:**
   - Receive receipt from app
   - Verify with Apple's servers: `https://buy.itunes.apple.com/verifyReceipt`
   - Validate receipt and activate premium

2. **Update Purchase Handler:**
   - Send receipt to your backend
   - Backend verifies and updates `is_premium` in database
   - App receives confirmation

**Example Backend Verification (Supabase Edge Function):**

```typescript
// supabase/functions/verify-receipt/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const { receipt, userId } = await req.json();

  // Verify with Apple
  const response = await fetch('https://buy.itunes.apple.com/verifyReceipt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      'receipt-data': receipt,
      'password': process.env.APPLE_SHARED_SECRET, // From App Store Connect
      'exclude-old-transactions': true,
    }),
  });

  const verification = await response.json();

  if (verification.status === 0) {
    // Valid receipt - activate premium
    await supabase
      .from('users')
      .update({
        is_premium: true,
        premium_until: calculateExpiry(verification.latest_receipt_info),
      })
      .eq('id', userId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: false }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

---

## 📝 **STEP 6: Subscription Management**

### Handle Subscription Status Changes

1. **Check Subscription Status Regularly:**
   - When app opens
   - When user navigates to premium features
   - Periodically in background

2. **Update Premium Status:**
   - If subscription expired, set `is_premium = false`
   - If subscription active, set `is_premium = true`

3. **Handle Cancellations:**
   - User can cancel in Settings → Subscriptions
   - Subscription remains active until end of billing period
   - Track cancellation in your database

---

## ⚠️ **IMPORTANT NOTES**

1. **Bundle ID Must Match:**
   - App Store Connect Bundle ID = `app.json` bundle identifier
   - Currently: `com.anonymous.partnerproductivityapp`

2. **Product IDs Must Match:**
   - App Store Connect Product ID = Code Product ID
   - Currently: `premium_monthly_199`

3. **Test in Sandbox First:**
   - Always test with Sandbox accounts before production
   - Sandbox purchases are FREE

4. **Receipt Verification:**
   - **DO NOT** verify receipts in app code (can be faked)
   - **ALWAYS** verify on your backend server

5. **Subscription Duration:**
   - Auto-renewable subscriptions renew automatically
   - User can cancel anytime in Settings → Subscriptions

---

## 🔗 **RESOURCES**

- [Expo In-App Purchases Docs](https://docs.expo.dev/versions/latest/sdk/in-app-purchases/)
- [Apple In-App Purchase Guide](https://developer.apple.com/in-app-purchase/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Receipt Validation](https://developer.apple.com/documentation/appstorereceipts)

---

## ✅ **CHECKLIST**

- [ ] Apple Developer Account created
- [ ] App created in App Store Connect
- [ ] In-App Purchase product created
- [ ] Product ID matches code (`premium_monthly_199`)
- [ ] Bundle ID matches (`com.anonymous.partnerproductivityapp`)
- [ ] IAP service implemented
- [ ] Payment screen updated
- [ ] IAP initialized on app start
- [ ] Sandbox test account created
- [ ] Tested purchase in sandbox
- [ ] Tested restore purchases
- [ ] Backend receipt verification set up (production)
- [ ] Subscription status checking implemented

---

**Ready to implement?** Follow the steps above, starting with App Store Connect setup! 🚀



