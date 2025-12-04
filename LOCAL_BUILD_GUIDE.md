# Local Build Guide 📱

Yes! You can build locally and upload manually to Google Play Console.

## ✅ Why Local Builds?

- **Full control** over native modules
- **No EAS build limits** (free tier has queue limits)
- **Faster iteration** - build when you want
- **Native code works** - can configure react-native-iap properly

---

## 🛠️ Prerequisites

### **1. Android Studio**
- Download: https://developer.android.com/studio
- Install Android SDK (API 35)
- Install Android SDK Build Tools

### **2. Java Development Kit (JDK)**
- Install JDK 17 or higher
- Set `JAVA_HOME` environment variable

### **3. Android SDK Path**
- Set `ANDROID_HOME` environment variable
- Usually: `C:\Users\YourName\AppData\Local\Android\Sdk`

---

## 📱 Build Steps

### **Step 1: Generate Native Projects**

```bash
npx expo prebuild
```

This creates `android/` and `ios/` folders with native code.

---

### **Step 2: Build APK Locally**

```bash
# For Android
npx expo run:android --variant release

# Or use Gradle directly
cd android
./gradlew assembleRelease
```

**Output:** `android/app/build/outputs/apk/release/app-release.apk`

---

### **Step 3: Build AAB (for Google Play)**

```bash
cd android
./gradlew bundleRelease
```

**Output:** `android/app/build/outputs/bundle/release/app-release.aab`

---

### **Step 4: Upload to Google Play Console**

1. Go to: https://play.google.com/console
2. Select your app → **Testing** → **Internal testing**
3. Click **Create new release**
4. Upload the `.aab` file
5. Fill in release notes
6. **Save** → **Review release** → **Start rollout**

---

## 🔧 Configure react-native-iap for Local Builds

### **Android Configuration:**

1. **Open Android Studio:**
   ```bash
   # Open the android folder
   code android
   ```

2. **Check `android/build.gradle`:**
   ```gradle
   buildscript {
       ext {
           kotlinVersion = "2.1.20"
       }
       dependencies {
           classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion"
       }
   }
   ```

3. **Check `android/app/build.gradle`:**
   - Should already have react-native-iap dependency (added by Expo)

4. **Build:**
   ```bash
   cd android
   ./gradlew clean
   ./gradlew bundleRelease
   ```

---

## 🚀 Quick Commands

```bash
# 1. Generate native projects
npx expo prebuild

# 2. Build release APK
npx expo run:android --variant release

# 3. Build release AAB (for Google Play)
cd android && ./gradlew bundleRelease

# 4. Find your AAB file
# Location: android/app/build/outputs/bundle/release/app-release.aab
```

---

## ⚠️ Important Notes

1. **First time setup:**
   - `npx expo prebuild` creates native folders
   - You only need to do this once (unless you change native config)

2. **Subsequent builds:**
   - Just run `./gradlew bundleRelease` in `android/` folder
   - Much faster!

3. **Native modules:**
   - `react-native-iap` will work in local builds
   - Native code is compiled properly

4. **Signing:**
   - First build: Expo generates a debug keystore
   - For production: Create your own keystore (see below)

---

## 🔐 Production Signing

### **Create Keystore:**

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

### **Configure in `android/app/build.gradle`:**

```gradle
android {
    ...
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
}
```

---

## 🎯 Advantages of Local Builds

✅ **No build queue** - build instantly  
✅ **Native modules work** - full control  
✅ **Free** - no EAS build credits needed  
✅ **Faster** - no upload/download time  
✅ **Debugging** - can debug native code  

---

## 📋 Comparison

| Method | Speed | Native Modules | Cost |
|--------|-------|----------------|------|
| **EAS Build** | Slow (15-20 min) | Limited | Free tier limits |
| **Local Build** | Fast (5-10 min) | Full support | Free |

---

## 🐛 Troubleshooting

**"Command not found: gradlew"**
- Make sure you're in `android/` folder
- Run: `chmod +x gradlew` (Linux/Mac)

**"SDK not found"**
- Set `ANDROID_HOME` environment variable
- Install Android SDK in Android Studio

**"react-native-iap not found"**
- Run: `cd android && ./gradlew clean`
- Then: `npx expo prebuild --clean`

---

**Ready to build locally?** Follow the steps above! 🚀

