# 📱 **Test on Mobile Devices (iOS/Android)**

## **✅ Current Status:**
- Real-time chat is working on web!
- Now let's test on mobile devices

---

## **📱 Testing Methods:**

### **Option 1: Expo Go App (Easiest)**

#### **For iOS:**
1. **Install Expo Go** from App Store
   - Search: "Expo Go"
   - Install the app

2. **Open your project in terminal:**
   ```bash
   npx expo start
   ```

3. **Scan the QR code** with your iPhone camera
   - Opens in Expo Go app
   - App loads on your phone

4. **Test the chat!**

#### **For Android:**
1. **Install Expo Go** from Google Play Store
   - Search: "Expo Go"
   - Install the app

2. **Open your project in terminal:**
   ```bash
   npx expo start
   ```

3. **Scan the QR code** with Expo Go app
   - Opens the app on your phone
   - Or use the tunnel URL

4. **Test the chat!**

---

### **Option 2: Development Build (More Features)**

For this option, you need to build the app:

#### **For iOS (Mac required):**
```bash
# Build for iOS simulator
npx expo run:ios

# Or build for physical device (requires Apple Developer account)
eas build --platform ios
```

#### **For Android:**
```bash
# Build for Android emulator
npx expo run:android

# Or build for physical device
eas build --platform android
```

---

## **🎯 Recommended: Use Expo Go**

**Expo Go is fastest** and perfect for testing real-time features!

### **Steps:**

1. **Install Expo Go on your phone:**
   - **iOS:** App Store → "Expo Go"
   - **Android:** Google Play → "Expo Go"

2. **Start the server:**
   ```bash
   npx expo start
   ```

3. **Connect your phone:**
   - **iOS:** Open Camera app → Scan QR code
   - **Android:** Open Expo Go app → Scan QR code

4. **Test the app on your phone!**

---

## **🧪 What to Test:**

### **Real-time Chat on Mobile:**
1. ✅ **Open chat** on both devices (phone + web)
2. ✅ **Send message** from phone
3. ✅ **Check web** - message should appear instantly
4. ✅ **Send reply** from web
5. ✅ **Check phone** - message should appear instantly

### **Test Scenarios:**
- ✅ **Send text messages**
- ✅ **Send photos** (if media upload works)
- ✅ **Test with multiple chats**
- ✅ **Test notifications** (if push notifications are enabled)

---

## **📱 Current Server:**

Your server is running on:
```
http://localhost:8082
```

To test on mobile, you need to:

### **Option A: Same Network (LAN)**
If your phone is on the same WiFi:
- Find your computer's local IP: `192.168.x.x`
- Expo will show the LAN URL

### **Option B: Tunnel (Easiest)**
Expo can create a tunnel so you can test from anywhere:
```bash
npx expo start --tunnel
```

---

## **🚀 Start Testing Now:**

### **Step 1: Install Expo Go**
- **iOS:** https://apps.apple.com/app/expo-go/id982107779
- **Android:** https://play.google.com/store/apps/details?id=host.exp.exponent

### **Step 2: Run with Tunnel**
In your terminal, run:
```bash
npx expo start --tunnel
```

### **Step 3: Scan QR Code**
- **iOS:** Open Camera → Scan QR code
- **Android:** Open Expo Go → Scan QR code

### **Step 4: Test Real-time Chat!**
Open the app on your phone and test the chat feature!

---

## **🎯 Quick Commands:**

```bash
# Start with tunnel (works from anywhere)
npx expo start --tunnel

# Start on specific network (faster)
npx expo start --lan

# Start normally (same network only)
npx expo start
```

---

## **📱 Let's Test Now!**

1. **Install Expo Go** on your phone
2. **Run with tunnel** (so it works from anywhere)
3. **Scan QR code** with your phone
4. **Test the real-time chat!**

**Ready to test on mobile?** 🚀📱

