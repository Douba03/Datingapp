# Native IAP Setup Guide

This guide explains how to configure `react-native-iap` for real in-app purchases.

## ✅ What's Already Done

1. ✅ `expo-dev-client` installed
2. ✅ `react-native-iap` installed  
3. ✅ Billing permission added to `app.json`
4. ✅ Code updated to use `react-native-iap`

## 📱 Step-by-Step Setup

### **Step 1: Build a Custom Development Client**

You need a custom dev client (not Expo Go) because `react-native-iap` requires native code:

```bash
# For Android
npx eas build --profile development --platform android

# For iOS (requires Apple Developer account)
npx eas build --profile development --platform ios
```

**Wait for the build to complete** (~15-20 minutes)

---

### **Step 2: Install the Custom Dev Client**

1. **Download** the APK/AAB from the EAS build link
2. **Install** it on your device:
   - Android: Transfer APK to phone and install
   - iOS: Install via TestFlight or direct install

---

### **Step 3: Run Your App**

```bash
npx expo start --dev-client
```

Then:
- Scan the QR code with your **custom dev client** (NOT Expo Go!)
- Or press `a` for Android / `i` for iOS

---

### **Step 4: Test In-App Purchases**

1. **Google Play Console:**
   - Create subscription product: `premium_monthly_199_android`
   - Add your email as a **License Tester**
   - Upload your app to **Internal Testing** track

2. **Test Purchase:**
   - Open app → Premium → Subscribe
   - Google Play payment sheet should appear!
   - As a license tester, you won't be charged

---

### **Step 5: Build Production Version**

After testing, build for production:

```bash
npx eas build --profile production --platform android
```

Upload this AAB to Google Play Console.

---

## 🔧 How It Works

### **Development Mode:**
- Uses **custom dev client** (includes native code)
- Can test real IAP with Google Play test accounts
- Hot reload still works!

### **Production Mode:**
- Uses **production build** (includes native code)
- Real payments work for all users
- Published to Google Play Store

---

## ⚠️ Important Notes

1. **Expo Go won't work** - You MUST use a custom dev client
2. **Native code is included** in the build (that's why it works!)
3. **Google Play setup required** - Create subscription products first
4. **Test accounts** - Add yourself as a license tester to avoid charges

---

## 🐛 Troubleshooting

**"react-native-iap not available"**
- Make sure you're using custom dev client, not Expo Go
- Rebuild: `npx eas build --profile development`

**"Purchase failed"**
- Check Google Play Console - is subscription created?
- Are you a license tester?
- Is app uploaded to Internal Testing track?

**Build fails**
- Make sure `expo-dev-client` is in `app.json` plugins
- Check that `react-native-iap` is in `package.json`

---

## 📚 Next Steps

1. Build custom dev client
2. Test IAP functionality
3. Create subscription in Google Play Console
4. Build production version
5. Publish to Google Play!

---

**Questions?** Check the [react-native-iap docs](https://github.com/hyochan/react-native-iap)

