# Fix AAB Signing Issue 🔐

You got an error because the AAB was signed with a debug keystore. Here are two solutions:

---

## ✅ Solution 1: Let Google Play Sign Automatically (EASIEST - Recommended)

Google Play can sign your app automatically! This is the easiest option.

### **Steps:**

1. **Upload your AAB to Google Play Console**
   - Even though it's debug-signed, upload it anyway
   - Go to: **Production** → **Create new release** → **Upload**

2. **Enable Google Play App Signing**
   - Google Play Console will ask: "Let Google manage and protect your app signing key"
   - Click **"Opt in"** or **"Enable"**
   - Google will re-sign your app automatically!

3. **That's it!** 
   - Google handles all signing
   - You don't need to manage keystores
   - More secure (Google protects your key)

**This is the recommended approach!** ✅

---

## 🔧 Solution 2: Sign Locally with Release Keystore

If you want to sign the app yourself, follow these steps:

### **Step 1: Generate Release Keystore**

Run this command (you'll be asked for passwords):

```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias malimatch -keyalg RSA -keysize 2048 -validity 10000
```

**You'll need to provide:**
- **Keystore password:** (create a strong password - REMEMBER THIS!)
- **Re-enter password:** (same password)
- **Key password:** (can be same as keystore password, or different)
- **Your name:** (e.g., "Your Name" or "Mali Match")
- **Organizational unit:** (e.g., "Development")
- **Organization:** (e.g., "Mali Match" or your company)
- **City:** (e.g., "Stockholm")
- **State/Province:** (e.g., "Stockholm")
- **Country code:** (e.g., "SE" for Sweden)

**Important:** Save these passwords securely! You'll need them for future updates.

### **Step 2: Create keystore.properties File**

Create file: `android/keystore.properties`

```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=malimatch
storeFile=app/release.keystore
```

**Replace:**
- `YOUR_KEYSTORE_PASSWORD` with your keystore password
- `YOUR_KEY_PASSWORD` with your key password

### **Step 3: Update build.gradle**

I'll update the build.gradle file to use the release keystore.

### **Step 4: Rebuild AAB**

```bash
cd android
.\gradlew.bat clean
.\gradlew.bat bundleRelease
```

### **Step 5: Upload New AAB**

Upload the new AAB file to Google Play Console.

---

## 🎯 Which Solution Should You Choose?

**Choose Solution 1 (Google Play Signing) if:**
- ✅ You want the easiest option
- ✅ You don't want to manage keystores
- ✅ You want Google to protect your signing key
- ✅ You're okay with Google handling signing

**Choose Solution 2 (Local Signing) if:**
- ✅ You want full control over signing
- ✅ You need to sign for other stores (like F-Droid)
- ✅ You have specific security requirements

---

## 💡 Recommendation

**Use Solution 1 (Google Play App Signing)** - It's easier, more secure, and Google handles everything!

---

## ⚠️ Important Notes

### **If You Choose Solution 2:**

1. **Backup your keystore!**
   - Copy `android/app/release.keystore` to a safe place
   - Save passwords securely
   - **If you lose the keystore, you CANNOT update your app!**

2. **Never commit keystore to Git!**
   - Add to `.gitignore`:
     ```
     android/app/release.keystore
     android/keystore.properties
     ```

3. **Same keystore for all updates:**
   - Use the same keystore for every app update
   - Google Play requires the same signature

---

## 🚀 Quick Start (Solution 1 - Recommended)

Just upload your current AAB to Google Play Console and enable "Google Play App Signing" when prompted. That's it! ✅

