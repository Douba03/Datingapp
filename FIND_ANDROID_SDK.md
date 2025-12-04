# How to Find Android SDK Location 🔍

## 📱 Method 1: In Android Studio (Easiest)

### **Step-by-Step:**

1. **Open Android Studio**

2. **Go to Settings:**
   - Click **File** → **Settings** (or press `Ctrl+Alt+S`)
   - On Mac: **Android Studio** → **Preferences** (or `Cmd+,`)

3. **Navigate to Android SDK:**
   - In left sidebar: **Appearance & Behavior** → **System Settings** → **Android SDK**
   - OR use search box at top: type "Android SDK"

4. **Find SDK Location:**
   - At the top of the window, you'll see:
     ```
     Android SDK Location: C:\Users\YourName\AppData\Local\Android\Sdk
     ```
   - **Copy this path!**

5. **If SDK Location is Empty:**
   - Click **Edit** button next to it
   - Choose a folder (usually: `C:\Users\YourName\AppData\Local\Android\Sdk`)
   - Click **Next** → **Finish**

---

## 🔧 Method 2: Install SDK if Missing

### **If you don't have Android SDK:**

1. **Open Android Studio**

2. **Go to:** File → Settings → Appearance & Behavior → System Settings → Android SDK

3. **Click "Edit"** next to SDK Location

4. **Choose a location** (recommended: `C:\Users\YourName\AppData\Local\Android\Sdk`)

5. **Click "Next"**

6. **Select SDK Components:**
   - ✅ Android SDK Platform-Tools
   - ✅ Android SDK Build-Tools
   - ✅ Android SDK Platform (API 35)
   - ✅ Android SDK Command-line Tools

7. **Click "Next"** → **Finish**

8. **Wait for download** (may take 10-20 minutes)

---

## 📂 Method 3: Check Default Locations

The SDK is usually in one of these places:

### **Windows:**
```
C:\Users\YourName\AppData\Local\Android\Sdk
C:\Android\Sdk
C:\Program Files\Android\Android Studio\sdk
```

### **To Check:**
1. Open File Explorer
2. Press `Win + R`
3. Type: `%LOCALAPPDATA%\Android\Sdk`
4. Press Enter
5. If folder exists, that's your SDK!

---

## ✅ After Finding SDK:

### **Update local.properties:**

1. **Open:** `android/local.properties`

2. **Add/Update this line:**
   ```
   sdk.dir=C:\\Users\\YourName\\AppData\\Local\\Android\\Sdk
   ```
   **Important:** Use double backslashes `\\` in the path!

3. **Replace `YourName`** with your actual username

---

## 🚀 Verify It Works:

```bash
cd android
.\gradlew.bat --version
```

If this works, SDK is configured correctly! ✅

---

## ⚠️ Still Can't Find It?

### **Option A: Install Android Studio Fresh**

1. Download: https://developer.android.com/studio
2. Install Android Studio
3. Open it → Let it download SDK automatically
4. Then find SDK location using Method 1

### **Option B: Install SDK Command Line Tools**

1. Download: https://developer.android.com/studio#command-tools
2. Extract to: `C:\Android\Sdk`
3. Run SDK Manager to install components

---

## 💡 Quick Check Command:

Run this in PowerShell to check if SDK exists:

```powershell
Test-Path "$env:LOCALAPPDATA\Android\Sdk"
```

If it returns `True`, SDK is at: `C:\Users\YourName\AppData\Local\Android\Sdk`

---

**Need more help?** Let me know what you see in Android Studio! 🎯

