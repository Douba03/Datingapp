# ⚡ **Quick Java Setup**

## **🎯 What You Need to Do:**

### **1. Find Java Installer:**
Check your **Downloads** folder for:
- `jdk-17_windows-x64_bin.exe`
- Or similar file

### **2. Install Java:**
- Double-click the installer
- Click "Next" through all prompts
- **Note the install location** (usually `C:\Program Files\Java\jdk-17`)

### **3. Set JAVA_HOME (EASIEST METHOD):**

**Press `Win + R`, type:**
```
sysdm.cpl
```
**Press Enter**

**Then:**
1. Click "Advanced" tab
2. Click "Environment Variables"
3. Under "System variables", click "New"
4. Variable name: `JAVA_HOME`
5. Variable value: `C:\Program Files\Java\jdk-17`
6. Click OK
7. Find "Path" variable
8. Click "Edit"
9. Click "New"
10. Add: `%JAVA_HOME%\bin`
11. Click OK on everything

### **4. Restart Terminal**

**Close ALL terminal windows, open new one!**

### **5. Verify Java:**

```bash
java -version
```

**Should show Java version!**

---

## **🚀 Then Build APK:**

```bash
cd android
.\gradlew.bat assembleRelease
```

---

## **💡 Or Tell Me:**

**Where did you download the Java installer?**
**I'll help you install and configure it!** ☕

