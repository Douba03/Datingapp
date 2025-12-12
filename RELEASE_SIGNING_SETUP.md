# Release Signing Setup - Complete Guide 🔐

Complete instructions to set up release signing for your Mali Match app.

---

## 📋 Step 1: Create Release Keystore

### **Command to Create Keystore:**

Open terminal in the `android/app` directory and run:

```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

**You'll be asked for:**
- **Keystore password:** (create a strong password - SAVE THIS!)
- **Re-enter password:** (same password)
- **Your name:** Mali Match (or your name)
- **Organizational unit:** Development
- **Organization:** Mali Match
- **City:** Your city
- **State/Province:** Your state
- **Country code:** Two letters (e.g., SE, US, GB)
- **Key password:** (press Enter to use same as keystore, or enter different password)

**⚠️ IMPORTANT:** Save your passwords securely! You'll need them forever!

---

## 📁 Step 2: Keystore File Location

**Place the keystore file here:**
```
android/app/release.keystore
```

After running the keytool command, the file will be created automatically in `android/app/` directory.

---

## ⚙️ Step 3: Add to gradle.properties

Add these lines to `android/gradle.properties`:

```properties
# Release keystore configuration
MYAPP_RELEASE_STORE_FILE=release.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=YOUR_KEYSTORE_PASSWORD
MYAPP_RELEASE_KEY_PASSWORD=YOUR_KEY_PASSWORD
```

**Replace:**
- `YOUR_KEYSTORE_PASSWORD` with your keystore password
- `YOUR_KEY_PASSWORD` with your key password (if different, otherwise same as keystore)

**⚠️ Security Note:** Add `gradle.properties` to `.gitignore` to avoid committing passwords!

---

## 🔧 Step 4: Update build.gradle

Update the `signingConfigs` and `buildTypes` section in `android/app/build.gradle`:

```gradle
signingConfigs {
    debug {
        storeFile file('debug.keystore')
        storePassword 'android'
        keyAlias 'androiddebugkey'
        keyPassword 'android'
    }
    release {
        if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
            storeFile file(MYAPP_RELEASE_STORE_FILE)
            storePassword MYAPP_RELEASE_STORE_PASSWORD
            keyAlias MYAPP_RELEASE_KEY_ALIAS
            keyPassword MYAPP_RELEASE_KEY_PASSWORD
        }
    }
}
buildTypes {
    debug {
        signingConfig signingConfigs.debug
    }
    release {
        signingConfig signingConfigs.release
        def enableShrinkResources = findProperty('android.enableShrinkResourcesInReleaseBuilds') ?: 'false'
        shrinkResources enableShrinkResources.toBoolean()
        minifyEnabled enableMinifyInReleaseBuilds
        proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        def enablePngCrunchInRelease = findProperty('android.enablePngCrunchInReleaseBuilds') ?: 'true'
        crunchPngs enablePngCrunchInRelease.toBoolean()
    }
}
```

---

## 🚀 Step 5: Build Signed AAB

After setting up everything, build the signed AAB:

```bash
cd android
.\gradlew.bat bundleRelease
```

**Output location:**
```
android/app/build/outputs/bundle/release/app-release.aab
```

This AAB will be properly signed and ready for Google Play Console!

---

## ✅ Complete Setup Checklist

- [ ] Created keystore with alias `my-key-alias`
- [ ] Keystore file placed in `android/app/release.keystore`
- [ ] Added keystore properties to `android/gradle.properties`
- [ ] Updated `signingConfigs` in `android/app/build.gradle`
- [ ] Updated `buildTypes.release` to use `signingConfigs.release`
- [ ] Built signed AAB with `.\gradlew.bat bundleRelease`
- [ ] Verified AAB is signed (not debug-signed)

---

## 🔒 Security Best Practices

1. **Never commit keystore to Git:**
   - Add to `.gitignore`:
     ```
     android/app/release.keystore
     android/gradle.properties
     ```

2. **Backup your keystore:**
   - Copy to secure location (encrypted USB, password manager)
   - If you lose it, you CANNOT update your app!

3. **Use strong passwords:**
   - At least 12 characters
   - Mix of letters, numbers, symbols

4. **Don't share keystore:**
   - Keep it private
   - Only use on secure machines

---

## 🐛 Troubleshooting

### **"Keystore was tampered with, or password was incorrect"**
- Check passwords in `gradle.properties`
- Verify keystore file exists at `android/app/release.keystore`

### **"Could not find property 'MYAPP_RELEASE_STORE_FILE'"**
- Make sure properties are in `android/gradle.properties`
- Check for typos in property names

### **"signingConfig signingConfigs.release" not found**
- Make sure `signingConfigs.release` is defined before `buildTypes`

---

## 📝 Quick Reference

**Create keystore:**
```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

**Build signed AAB:**
```bash
cd android
.\gradlew.bat bundleRelease
```

**File locations:**
- Keystore: `android/app/release.keystore`
- Properties: `android/gradle.properties`
- Build config: `android/app/build.gradle`
- Output AAB: `android/app/build/outputs/bundle/release/app-release.aab`

---

**Ready to set up? Follow the steps above!** 🚀

