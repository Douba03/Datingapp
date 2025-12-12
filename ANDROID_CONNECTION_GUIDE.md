# Android Connection Guide

## Current Status
✅ Android SDK: Found  
✅ ADB: Working  
❌ **No Android device/emulator connected**

## How to Connect Android

### Option 1: Physical Android Device (USB)

1. **Enable Developer Options on your phone:**
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - You'll see "You are now a developer!"

2. **Enable USB Debugging:**
   - Go to Settings → Developer Options
   - Enable "USB Debugging"
   - Enable "Install via USB" (if available)

3. **Connect via USB:**
   - Connect your phone to PC with USB cable
   - On your phone, tap "Allow USB debugging" when prompted
   - Check "Always allow from this computer" if you want

4. **Verify connection:**
   ```powershell
   $env:ANDROID_HOME = "C:\Users\qossai\AppData\Local\Android\Sdk"
   & "$env:ANDROID_HOME\platform-tools\adb.exe" devices
   ```
   You should see your device listed (e.g., `ABC123XYZ    device`)

5. **Run the app:**
   ```bash
   npx expo run:android
   ```

### Option 2: Android Studio Emulator

1. **Open Android Studio**

2. **Start an emulator:**
   - Click "Device Manager" (phone icon)
   - Click "Create Device" if you don't have one
   - Select a device (e.g., Pixel 6)
   - Download a system image (API 33 or 34 recommended)
   - Click "Finish" and then "Play" button to start

3. **Wait for emulator to boot** (may take 1-2 minutes)

4. **Verify connection:**
   ```powershell
   $env:ANDROID_HOME = "C:\Users\qossai\AppData\Local\Android\Sdk"
   & "$env:ANDROID_HOME\platform-tools\adb.exe" devices
   ```
   You should see `emulator-5554    device`

5. **Run the app:**
   ```bash
   npx expo run:android
   ```

### Option 3: Build APK (No Connection Needed)

If you can't connect a device, build an APK and install it manually:

```bash
npx eas build --platform android --profile production
```

Then download and install the APK on your phone.

## Troubleshooting

### "No devices found"
- Make sure USB debugging is enabled
- Try a different USB cable
- Try a different USB port
- Restart ADB: `adb kill-server && adb start-server`

### "Device unauthorized"
- Check your phone for "Allow USB debugging" prompt
- Revoke USB debugging authorizations in Developer Options
- Reconnect and allow again

### "ADB not found"
- Make sure Android SDK is installed
- Set ANDROID_HOME environment variable:
  ```powershell
  [System.Environment]::SetEnvironmentVariable('ANDROID_HOME', 'C:\Users\qossai\AppData\Local\Android\Sdk', 'User')
  ```

### Emulator won't start
- Check BIOS virtualization settings (SVM Mode / Intel VT-x)
- Make sure Hyper-V is enabled in Windows Features
- Try a different system image (API level)

## Quick Check Commands

```powershell
# Check connected devices
$env:ANDROID_HOME = "C:\Users\qossai\AppData\Local\Android\Sdk"
& "$env:ANDROID_HOME\platform-tools\adb.exe" devices

# Restart ADB
& "$env:ANDROID_HOME\platform-tools\adb.exe" kill-server
& "$env:ANDROID_HOME\platform-tools\adb.exe" start-server

# Check Android SDK
Test-Path "C:\Users\qossai\AppData\Local\Android\Sdk"
```




