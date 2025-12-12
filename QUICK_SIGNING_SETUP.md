# Quick Release Signing Setup 🚀

## ✅ What I've Already Done

1. ✅ Updated `android/app/build.gradle` with release signing configuration
2. ✅ Added keystore properties template to `android/gradle.properties`
3. ✅ Added keystore files to `.gitignore` for security

---

## 📋 What You Need to Do

### **Step 1: Create the Keystore**

Run this command in terminal:

```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

**Answer the questions:**
- Keystore password: (create strong password - SAVE IT!)
- Re-enter password: (same)
- Your name: Mali Match
- Organization: Mali Match
- City, State, Country: (your location)
- Key password: (press Enter to use same as keystore)

---

### **Step 2: Update gradle.properties**

Open `android/gradle.properties` and replace:
- `YOUR_KEYSTORE_PASSWORD` with your actual keystore password
- `YOUR_KEY_PASSWORD` with your key password (or same as keystore)

**Location:** `android/gradle.properties` (lines 75-78)

---

### **Step 3: Build Signed AAB**

```bash
cd android
.\gradlew.bat bundleRelease
```

**Output:** `android/app/build/outputs/bundle/release/app-release.aab`

This AAB will be properly signed! ✅

---

## 📝 Summary

**1. Command to create keystore:**
```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

**2. Keystore location:**
```
android/app/release.keystore
```

**3. gradle.properties (already added, just update passwords):**
```properties
MYAPP_RELEASE_STORE_FILE=release.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=YOUR_KEYSTORE_PASSWORD
MYAPP_RELEASE_KEY_PASSWORD=YOUR_KEY_PASSWORD
```

**4. build.gradle (already updated):**
- `signingConfigs.release` added
- `buildTypes.release` now uses `signingConfigs.release`

**5. Build command:**
```bash
cd android
.\gradlew.bat bundleRelease
```

---

## ⚠️ Important

- **Save your passwords!** You'll need them for every update
- **Backup the keystore file!** If you lose it, you can't update your app
- **Don't commit passwords to Git!** (Already in .gitignore)

---

**Everything is configured! Just create the keystore and update the passwords!** 🎉

