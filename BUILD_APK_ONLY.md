# 📱 **Build APK Without Device**

## **Problem:**
No Android device/emulator connected.

## **Solution:**
Build APK without running on device!

---

## **🚀 Build APK:**

### **Step 1: Generate Android Project**
```bash
npx expo prebuild --platform android
```

### **Step 2: Build APK**
```bash
cd android
./gradlew assembleRelease
```

**On Windows:**
```bash
cd android
gradlew.bat assembleRelease
```

---

## **📂 Find Your APK:**

After build completes, find APK at:
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## **🎯 Then:**
1. Transfer APK to your phone
2. Install APK
3. Open and test!

---

## **⚡ Quick Command:**

**Run this in your terminal:**
```bash
npx expo prebuild --platform android --clean
```

Then:
```bash
cd android && gradlew.bat assembleRelease
```

**Let me know when it's done!** 🚀

