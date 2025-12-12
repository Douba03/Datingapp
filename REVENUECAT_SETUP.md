# RevenueCat Setup Guide 💳

Complete guide to integrate RevenueCat with Stripe for your Mali Match app.

---

## 🎯 What You Need

- ✅ RevenueCat account (free until $2,500/month)
- ✅ Stripe account with secret key: `sk_BPGvdOwKscJebArDGWpBbGYiaipHg`
- ✅ Your app (already built)

---

## 📋 Step 1: Create RevenueCat Account

1. **Sign up:** https://app.revenuecat.com/signup
2. **Create a new project:** "Mali Match"
3. **Add your app:**
   - Platform: **Android** (and iOS if you have it)
   - Package name: `com.anonymous.partnerproductivityapp` (check your `app.json`)

---

## 📋 Step 2: Configure Stripe Integration

### In RevenueCat Dashboard:

1. **Go to:** Integrations → Stripe
2. **Connect Stripe:**
   - Click "Connect Stripe"
   - Enter your Stripe Secret Key: `sk_BPGvdOwKscJebArDGWpBbGYiaipHg`
   - Authorize RevenueCat to access Stripe

3. **Create Products in RevenueCat:**
   - Go to: **Products** → **Create Product**
   - Product ID: `premium_monthly`
   - Name: "Premium Monthly"
   - Type: **Subscription**
   - Price: $1.99/month (or your price)

4. **Link to Stripe:**
   - In the product, click "Add Store"
   - Select "Stripe"
   - Create Stripe Product/Price ID
   - Link them together

---

## 📋 Step 3: Install RevenueCat SDK

```bash
npm install react-native-purchases
```

---

## 📋 Step 4: Get RevenueCat API Key

1. **In RevenueCat Dashboard:**
   - Go to: **Project Settings** → **API Keys**
   - Copy your **Public API Key** (starts with `rcbw_` or `pk_`)

2. **Add to `.env.local`:**
   ```env
   EXPO_PUBLIC_REVENUECAT_API_KEY=rcbw_your_key_here
   ```

---

## 📋 Step 5: Update Your Purchase Service

Replace your current `purchaseService.ts` with RevenueCat implementation.

---

## 📋 Step 6: Configure Products

### In RevenueCat Dashboard:

1. **Create Entitlement:**
   - Go to: **Entitlements** → **Create Entitlement**
   - Identifier: `premium`
   - Name: "Premium Access"

2. **Attach Product to Entitlement:**
   - Go to your product
   - Add entitlement: `premium`
   - Save

---

## 📋 Step 7: Set Up Webhook (Important!)

RevenueCat needs to notify your backend when purchases happen:

1. **In RevenueCat Dashboard:**
   - Go to: **Project Settings** → **Webhooks**
   - Add webhook URL: `https://your-backend.com/revenuecat-webhook`
   - Or use Supabase Edge Function (recommended)

2. **Webhook Events to Listen For:**
   - `INITIAL_PURCHASE`
   - `RENEWAL`
   - `CANCELLATION`

---

## 🎨 Templates (Optional)

RevenueCat provides **pre-built paywall templates** you can use:

1. **In RevenueCat Dashboard:**
   - Go to: **Paywalls** → **Create Paywall**
   - Choose a template
   - Customize colors, text, layout
   - Copy the code/configuration

2. **Or build your own:**
   - Use RevenueCat SDK to fetch products
   - Build custom UI (like you already have)
   - Call RevenueCat purchase methods

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

## 🔄 Sync with Supabase

When a purchase happens, RevenueCat webhook should update Supabase:

1. **Create Supabase Edge Function** (or API endpoint)
2. **Listen for RevenueCat webhook**
3. **Update user in Supabase:**

```typescript
// In your webhook handler
const userId = webhook.event.app_user_id; // RevenueCat user ID
const isPremium = webhook.event.entitlements.active['premium'];

await supabase
  .from('users')
  .update({ 
    is_premium: isPremium,
    premium_until: isPremium ? new Date('2099-12-31') : null
  })
  .eq('id', userId);
```

---

## ✅ Checklist

- [ ] RevenueCat account created
- [ ] Stripe connected in RevenueCat
- [ ] Product created: `premium_monthly`
- [ ] Entitlement created: `premium`
- [ ] Product linked to entitlement
- [ ] RevenueCat SDK installed: `npm install react-native-purchases`
- [ ] API key added to `.env.local`
- [ ] Code updated to use RevenueCat
- [ ] Webhook configured
- [ ] Test purchase completed

---

## 🚀 Quick Start

**You don't need to build templates** - RevenueCat provides them, or you can use your existing UI!

1. **Set up RevenueCat account** (5 min)
2. **Connect Stripe** (2 min)
3. **Create product** (2 min)
4. **Install SDK** (1 min)
5. **Update code** (10 min)
6. **Test!** 🎉

---

## 📚 Resources

- **RevenueCat Docs:** https://docs.revenuecat.com/
- **React Native SDK:** https://docs.revenuecat.com/docs/react-native
- **Stripe Integration:** https://docs.revenuecat.com/docs/stripe
- **Webhooks:** https://docs.revenuecat.com/docs/webhooks

---

**Ready to integrate?** Start with Step 1: Create RevenueCat account! 🚀

