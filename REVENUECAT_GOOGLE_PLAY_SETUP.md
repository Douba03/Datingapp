# RevenueCat + Google Play Setup (No Stripe Needed) 📱

For Android apps, RevenueCat works directly with Google Play Store - no Stripe required!

---

## 🎯 What You Need

- ✅ RevenueCat account (free until $2,500/month)
- ✅ Google Play Console account
- ✅ Your app already uploaded to Play Console

---

## 📋 Step 1: Create RevenueCat Account

1. **Sign up:** https://app.revenuecat.com/signup
2. **Create project:** "Mali Match"
3. **Add Android app:**
   - Platform: **Android**
   - Package name: `com.anonymous.partnerproductivityapp` (check your `app.json`)

---

## 📋 Step 2: Connect Google Play Store

### In RevenueCat Dashboard:

1. **Go to:** Integrations → Google Play Store
2. **Connect Google Play:**
   - Click "Connect Google Play"
   - Sign in with your Google Play Console account
   - Authorize RevenueCat to access your Play Console
   - Select your app: "Mali Match"

3. **Service Account Setup:**
   - RevenueCat will guide you to create a service account
   - Download the JSON key file
   - Upload it to RevenueCat
   - Grant permissions in Google Play Console

---

## 📋 Step 3: Create Product in Google Play Console

1. **In Google Play Console:**
   - Go to: **Monetize** → **Products** → **Subscriptions**
   - Click **"Create subscription"**
   - Product ID: `premium_monthly_199_android` (must match your code!)
   - Name: "Premium Monthly"
   - Description: "Unlock all premium features"
   - Price: $1.99/month
   - Billing period: Monthly
   - Save and **Activate**

---

## 📋 Step 4: Create Product in RevenueCat

1. **In RevenueCat Dashboard:**
   - Go to: **Products** → **Create Product**
   - Product ID: `premium_monthly_199_android` (must match Play Console!)
   - Name: "Premium Monthly"

2. **Link to Google Play:**
   - Click "Add Store"
   - Select "Google Play Store"
   - Select your subscription product from Play Console
   - Link them together

---

## 📋 Step 5: Create Entitlement

1. **In RevenueCat Dashboard:**
   - Go to: **Entitlements** → **Create Entitlement**
   - Identifier: `premium`
   - Name: "Premium Access"

2. **Attach Product:**
   - Go to your product
   - Add entitlement: `premium`
   - Save

---

## 📋 Step 6: Get RevenueCat API Key

1. **In RevenueCat Dashboard:**
   - Go to: **Project Settings** → **API Keys**
   - Copy your **Public API Key** (starts with `rcbw_`)

2. **Add to `.env.local`:**
   ```env
   EXPO_PUBLIC_REVENUECAT_API_KEY=rcbw_your_key_here
   ```

---

## 📋 Step 7: Install RevenueCat SDK

```bash
npm install react-native-purchases
```

---

## 📋 Step 8: Update Your Code

Replace your purchase service with RevenueCat implementation (see code below).

---

## 💻 Code Integration

### Initialize RevenueCat:

```typescript
import Purchases from 'react-native-purchases';

// Initialize
await Purchases.configure({
  apiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY!,
  appUserID: userId, // Your Supabase user ID
});
```

### Purchase Premium:

```typescript
const offerings = await Purchases.getOfferings();
const premiumPackage = offerings.current?.availablePackages.find(
  p => p.identifier === 'premium_monthly'
);

if (premiumPackage) {
  const { customerInfo } = await Purchases.purchasePackage(premiumPackage);
  
  // Check if user has premium entitlement
  if (customerInfo.entitlements.active['premium']) {
    // Update Supabase user to premium
    await supabase
      .from('users')
      .update({ is_premium: true })
      .eq('id', userId);
  }
}
```

---

## ✅ Checklist

- [ ] RevenueCat account created
- [ ] Google Play Store connected in RevenueCat
- [ ] Service account configured
- [ ] Product created in Google Play Console: `premium_monthly_199_android`
- [ ] Product created in RevenueCat
- [ ] Product linked between Play Console and RevenueCat
- [ ] Entitlement created: `premium`
- [ ] Product attached to entitlement
- [ ] RevenueCat SDK installed: `npm install react-native-purchases`
- [ ] API key added to `.env.local`
- [ ] Code updated to use RevenueCat
- [ ] Test purchase completed

---

## 🚀 Quick Start

1. **Create RevenueCat account** (5 min)
2. **Connect Google Play** (10 min)
3. **Create products** (5 min)
4. **Install SDK** (1 min)
5. **Update code** (10 min)
6. **Test!** 🎉

---

## 📚 Resources

- **RevenueCat Docs:** https://docs.revenuecat.com/
- **Google Play Integration:** https://docs.revenuecat.com/docs/google-play
- **React Native SDK:** https://docs.revenuecat.com/docs/react-native

---

**No Stripe needed for Android!** RevenueCat handles everything with Google Play directly! 🎉

