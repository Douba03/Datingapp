# Connect Premium Payments 💳

Complete guide to enable real in-app purchases for your Android app.

---

## 🎯 Two Options for Premium Payments

### **Option 1: Google Play In-App Purchases (Recommended for Android)**
- Native Android payment system
- Handles subscriptions automatically
- Requires Google Play Console setup

### **Option 2: Stripe Payment Gateway (Alternative)**
- Works on web, iOS, and Android
- More flexible payment options
- Requires Stripe account setup

---

## 📱 Option 1: Google Play In-App Purchases

### **Step 1: Set Up Google Play Console** 

1. **Create Google Play Developer Account**
   - Go to: https://play.google.com/console
   - Pay $25 one-time fee
   - Complete account setup

2. **Create Your App**
   - Click "Create app"
   - Fill in app details
   - Package name: `com.anonymous.partnerproductivityapp` (or change it)

3. **Set Up Subscription Product**
   - Go to: **Monetize** → **Products** → **Subscriptions**
   - Click **"Create subscription"**
   - Product ID: `premium_monthly_199_android` (must match your code!)
   - Name: "Premium Monthly"
   - Description: "Unlock all premium features"
   - Price: $1.99/month (or your price)
   - Billing period: Monthly
   - Save and activate

### **Step 2: Add react-native-iap Back**

Since we removed it to fix the build, we need to add it back with proper configuration:

```bash
npm install react-native-iap@^14.4.46
```

### **Step 3: Update app.json**

Make sure you have the billing permission (already there):

```json
{
  "expo": {
    "android": {
      "permissions": [
        "com.android.vending.BILLING"
      ]
    },
    "plugins": [
      "expo-dev-client"
    ]
  }
}
```

### **Step 4: Rebuild Your App**

You need to rebuild because `react-native-iap` requires native code:

```bash
# Clean previous build
cd android
.\gradlew.bat clean
cd ..

# Rebuild with IAP included
cd android
.\gradlew.bat assembleRelease
```

### **Step 5: Upload to Google Play (Internal Testing)**

1. **Build AAB for Play Store:**
   ```bash
   cd android
   .\gradlew.bat bundleRelease
   ```

2. **Upload to Play Console:**
   - Go to: **Production** → **Create new release**
   - Upload the `.aab` file from:
     ```
     android/app/build/outputs/bundle/release/app-release.aab
     ```
   - Add release notes
   - Save

3. **Add Testers:**
   - Go to: **Testing** → **Internal testing**
   - Add your email as a tester
   - Share the testing link

### **Step 6: Test Purchases**

1. **Install the app** from Internal Testing track
2. **Open app** → Go to Premium section
3. **Tap "Upgrade to Premium"**
4. **Google Play payment sheet** should appear!
5. **Complete test purchase** (you won't be charged as a tester)

---

## 💳 Option 2: Stripe Payment Gateway

If you want more flexibility or need web payments:

### **Step 1: Create Stripe Account**

1. Sign up: https://stripe.com
2. Get your **Publishable Key** and **Secret Key**
3. Add to `.env.local`:
   ```env
   EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   ```

### **Step 2: Install Stripe**

```bash
npm install @stripe/stripe-react-native
```

### **Step 3: Create Payment Screen**

Create a new component for Stripe checkout (similar to your current premium screen but with Stripe integration).

### **Step 4: Set Up Backend**

You'll need a backend API to:
- Create payment intents
- Verify payments
- Update user premium status in Supabase

---

## 🔧 Current Code Status

Your code is already set up to handle IAP! It just needs:

1. ✅ **Product ID configured:** `premium_monthly_199_android`
2. ✅ **Purchase service ready:** `src/services/iap/purchaseService.ts`
3. ✅ **UI components ready:** Premium screens and upgrade prompts
4. ⏳ **Missing:** `react-native-iap` package (removed to fix build)

---

## 🚀 Quick Start: Enable Google Play IAP

### **1. Re-add react-native-iap:**

```bash
npm install react-native-iap@^14.4.46
```

### **2. Rebuild app:**

```bash
cd android
.\gradlew.bat clean
.\gradlew.bat assembleRelease
```

### **3. Set up Google Play Console:**

- Create subscription: `premium_monthly_199_android`
- Upload app to Internal Testing
- Add yourself as tester

### **4. Test:**

- Install app from Play Console
- Try purchasing premium
- Payment should work! 🎉

---

## ⚠️ Important Notes

### **For Development/Testing:**

1. **License Testers:**
   - Add your email in Play Console → **Settings** → **License testing**
   - Test purchases won't charge you

2. **Test Cards:**
   - Google provides test card numbers for testing
   - Check Play Console docs for test cards

3. **Internal Testing:**
   - Upload app to Internal Testing track first
   - Test IAP before going to production

### **For Production:**

1. **Product ID Must Match:**
   - Code: `premium_monthly_199_android`
   - Play Console: `premium_monthly_199_android`
   - Must be EXACTLY the same!

2. **App Must Be Published:**
   - At least to Internal Testing track
   - IAP won't work in development builds without Play Console setup

3. **Subscription Management:**
   - Google Play handles renewals automatically
   - Your code just needs to check subscription status

---

## 🐛 Troubleshooting

### **"react-native-iap not available"**
- ✅ Make sure package is installed: `npm install react-native-iap`
- ✅ Rebuild app after installing
- ✅ Check that you're using a release build, not Expo Go

### **"Purchase failed" or "Product not found"**
- ✅ Check product ID matches exactly in code and Play Console
- ✅ Make sure app is uploaded to Play Console (Internal Testing)
- ✅ Verify subscription is "Active" in Play Console
- ✅ Check you're signed in with a test account

### **"Build fails with react-native-iap"**
- This is why we removed it before
- The new version should work, but if it fails:
  - Try: `npx expo prebuild --clean`
  - Or use EAS Build instead: `eas build --platform android`

### **"Payment sheet doesn't appear"**
- ✅ Check internet connection
- ✅ Verify Google Play Services is updated on device
- ✅ Make sure you're testing on a real device (not emulator)
- ✅ Check Play Console - is subscription active?

---

## 📋 Checklist

Before payments will work:

- [ ] Google Play Developer account created ($25)
- [ ] App created in Play Console
- [ ] Subscription product created: `premium_monthly_199_android`
- [ ] `react-native-iap` installed: `npm install react-native-iap`
- [ ] App rebuilt with IAP: `.\gradlew.bat assembleRelease`
- [ ] AAB uploaded to Play Console (Internal Testing)
- [ ] You're added as License Tester
- [ ] App installed from Play Console (not direct APK)
- [ ] Test purchase attempted

---

## 🎯 Recommended Workflow

1. **Development:**
   - Use "Skip Payment" button for testing features
   - Code is ready, just in placeholder mode

2. **Testing:**
   - Set up Play Console
   - Add `react-native-iap`
   - Build and upload to Internal Testing
   - Test real purchases

3. **Production:**
   - Verify everything works in testing
   - Build production AAB
   - Upload to Production track
   - Publish to Play Store

---

## 💡 Alternative: Keep Placeholder Mode

If you want to launch without real payments first:

- Your current "Skip Payment" button works
- Users can test premium features
- Add real payments later when ready
- Just update the code to remove the "Skip Payment" button

---

## 📚 Resources

- **Google Play Console:** https://play.google.com/console
- **react-native-iap Docs:** https://github.com/hyochan/react-native-iap
- **Google Play Billing:** https://developer.android.com/google/play/billing
- **Stripe Docs:** https://stripe.com/docs

---

**Ready to enable payments?** Start with Step 1: Set up Google Play Console! 🚀

