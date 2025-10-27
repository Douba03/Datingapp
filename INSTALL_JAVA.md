# ☕ **Install & Activate Java**

## **🔧 Step-by-Step Setup:**

### **Step 1: Install Java**
1. ✅ You downloaded Java JDK 17
2. **Run the installer**
3. Follow prompts to install

### **Step 2: Find Java Location**
**Usually installed at:**
```
C:\Program Files\Java\jdk-17
```
**Or:**
```
C:\Program Files (x86)\Java\jdk-17
```

---

## **🔧 Step 3: Set Environment Variables**

### **Option A: GUI (EASIEST)**

1. **Press `Win + R`**
2. **Type:** `sysdm.cpl`
3. **Press Enter**
4. **Click "Advanced" tab**
5. **Click "Environment Variables"**
6. **Under "System variables", click "New"**
7. **Variable name:** `JAVA_HOME`
8. **Variable value:** `C:\Program Files\Java\jdk-17`
9. **Click OK**
10. **Find "Path" in System variables**
11. **Click "Edit"**
12. **Click "New"**
13. **Add:** `C:\Program Files\Java\jdk-17\bin`
14. **Click OK on all windows**

---

### **Option B: PowerShell (FAST)**

**Run in PowerShell as Administrator:**

```powershell
$javaPath = "C:\Program Files\Java\jdk-17"
[Environment]::SetEnvironmentVariable("JAVA_HOME", $javaPath, "Machine")
$path = [Environment]::GetEnvironmentVariable("Path", "Machine")
[Environment]::SetEnvironmentVariable("Path", "$path;$javaPath\bin", "Machine")
```

**Restart terminal after this!**

---

## **✅ Step 4: Verify**

**Open NEW terminal and run:**
```bash
java -version
```

**Should see:**
```
java version "17.x.x"
```

---

## **🚀 Step 5: Build APK**

**After Java is installed:**
```bash
cd android
.\gradlew.bat assembleRelease
```

---

## **🎯 Quick Check:**

**Tell me the exact path where Java installed** (check Downloads or Program Files), and I'll help you set it up! 📍

