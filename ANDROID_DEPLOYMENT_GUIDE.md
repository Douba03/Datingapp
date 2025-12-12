# Android App Deployment Guide 📱

Complete guide to build and host your Android app.

---

## 🎯 Three Ways to Deploy Your App

### **Option 1: Build Locally (APK for Direct Install)**
Build an APK file you can install directly on devices.

### **Option 2: Build with EAS (Cloud Build)**
Use Expo's cloud service to build your app (recommended).

### **Option 3: Upload to Google Play Store**
Publish your app to the official Play Store.

---

## 📦 Option 1: Build APK Locally

### **Step 1: Build Release APK**

```bash
cd android
.\gradlew.bat assembleRelease
```

**Output location:**
```
android/app/build/outputs/apk/release/app-release.apk
```

### **Step 2: Install on Device**

**Method A: USB Connection**
1. Enable **Developer Options** on your Android phone:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
2. Enable **USB Debugging**:
   - Settings → Developer Options → USB Debugging
3. Connect phone via USB
4. Run:
   ```bash
   adb install android/app/build/outputs/apk/release/app-release.apk
   ```

**Method B: Transfer File**
1. Copy `app-release.apk` to your phone
2. Open file manager on phone
3. Tap the APK file to install
4. Allow "Install from Unknown Sources" if prompted

---

## ☁️ Option 2: Build with EAS (Recommended)

EAS Build creates production-ready builds in the cloud.

### **Step 1: Install EAS CLI**

```bash
npm install -g eas-cli
```

### **Step 2: Login to Expo**

```bash
eas login
```

Create account if needed: https://expo.dev

### **Step 3: Configure Project**

```bash
eas build:configure
```

### **Step 4: Build for Android**

**Preview Build (APK for testing):**
```bash
eas build --platform android --profile preview
```

**Production Build (AAB for Play Store):**
```bash
eas build --platform android --profile production
```

### **Step 5: Download Build**

1. Visit: https://expo.dev/accounts/[your-account]/builds
2. Click on your build
3. Download the APK or AAB file

**Build time:** ~15-20 minutes

---

## 🏪 Option 3: Upload to Google Play Store

### **Prerequisites:**

1. **Google Play Developer Account**
   - Cost: $25 one-time fee
   - Sign up: https://play.google.com/console

2. **App Bundle (AAB) File**
   - Required format for Play Store
   - Not APK (APK is for direct install only)

### **Step 1: Build Production AAB**

**Using EAS (Easiest):**
```bash
eas build --platform android --profile production
```

**Or Build Locally:**
```bash
cd android
.\gradlew.bat bundleRelease
```

**Output location:**
```
android/app/build/outputs/bundle/release/app-release.aab
```

### **Step 2: Create App in Play Console**

1. Go to: https://play.google.com/console
2. Click **"Create app"**
3. Fill in:
   - App name: "Partner Productivity App"
   - Default language: English
   - App or game: App
   - Free or paid: Free
4. Accept terms and create

### **Step 3: Complete Store Listing**

Fill in required information:
- **App icon** (512x512px)
- **Feature graphic** (1024x500px)
- **Screenshots** (at least 2)
- **Short description** (80 chars max)
- **Full description** (4000 chars max)
- **Privacy Policy URL** (required)

### **Step 4: Upload AAB File**

1. Go to **Production** → **Create new release**
2. Click **"Upload"**
3. Select your `.aab` file
4. Add **Release notes** (what's new in this version)
5. Click **"Save"**

### **Step 5: Complete Content Rating**

1. Go to **Content rating**
2. Fill out questionnaire
3. Submit for rating (takes 1-2 days)

### **Step 6: Set Up Pricing & Distribution**

1. Go to **Pricing & distribution**
2. Select countries
3. Choose **Free** or **Paid**
4. Accept declarations

### **Step 7: Review & Publish**

1. Review all sections (green checkmarks)
2. Click **"Start rollout to Production"**
3. App will be reviewed (1-7 days)
4. Once approved, app goes live! 🎉

---

## 🔐 Important: Signing Your App

### **For Local Builds:**

Your app is already signed with a debug keystore. For production:

1. **Generate release keystore:**
   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Update `android/app/build.gradle`:**
   ```gradle
   signingConfigs {
       release {
           storeFile file('my-release-key.keystore')
           storePassword 'your-password'
           keyAlias 'my-key-alias'
           keyPassword 'your-password'
       }
   }
   buildTypes {
       release {
           signingConfig signingConfigs.release
       }
   }
   ```

### **For EAS Builds:**

EAS handles signing automatically! Just run:
```bash
eas credentials
```

---

## 📋 Build Profiles Explained

From your `eas.json`:

- **`preview`**: APK for testing, install directly
- **`development`**: Dev client with hot reload
- **`production`**: AAB for Google Play Store

---

## 🚀 Quick Start Commands

```bash
# Build APK locally (for direct install)
cd android
.\gradlew.bat assembleRelease

# Build with EAS (cloud)
eas build --platform android --profile preview

# Build for Play Store
eas build --platform android --profile production

# Submit to Play Store (after building)
eas submit --platform android
```

---

## ⚠️ Common Issues

### **"App not installed" error**
- Uninstall old version first
- Check if device has enough storage
- Verify APK is not corrupted

### **"Package name already exists"**
- Change package name in `app.json`:
  ```json
  "android": {
    "package": "com.yourcompany.yourapp"
  }
  ```
- Run `npx expo prebuild --clean` to regenerate

### **"Upload failed" in Play Console**
- Make sure you're uploading `.aab` not `.apk`
- Check file size (max 150MB for AAB)
- Verify signing is correct

---

## 📱 Testing Before Release

1. **Internal Testing:**
   - Upload to Play Console → Internal testing track
   - Add testers' email addresses
   - Testers can install via Play Store link

2. **Closed Beta:**
   - Create closed testing track
   - Invite up to 100 testers
   - Get feedback before public release

---

## 🎯 Recommended Workflow

1. **Development:** Use `expo run:android` for testing
2. **Preview:** Build APK with `eas build --profile preview`
3. **Test:** Install APK on real devices
4. **Production:** Build AAB with `eas build --profile production`
5. **Publish:** Upload to Google Play Console

---

## 📚 Additional Resources

- **EAS Build Docs:** https://docs.expo.dev/build/introduction/
- **Google Play Console:** https://play.google.com/console
- **Android App Bundle Guide:** https://developer.android.com/guide/app-bundle

---

**Your app is ready to deploy!** 🚀

Choose the method that works best for you:
- **Quick testing:** Local APK build
- **Easy deployment:** EAS Build
- **Public release:** Google Play Store

