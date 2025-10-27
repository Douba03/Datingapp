# 🔍 **Find & Activate Java Installation**

## **🔍 Step 1: Find Java Installer Location**

### **Check Downloads:**
Open File Explorer:
- Go to `Downloads` folder
- Look for file starting with `jdk-25`
- **Note the full path**

### **Common Installer Names:**
- `jdk-25_windows-x64_bin.exe`
- `openjdk-25_windows-x64_bin.zip`

---

## **📦 Step 2: Install Java**

### **If you have .exe installer:**
1. **Double-click** the `.exe` file
2. Click **Next** through all steps
3. **Note the install path** (usually `C:\Program Files\Java\jdk-25`)

### **If you have .zip file:**
1. **Extract** the ZIP
2. **Copy extracted folder** to `C:\Program Files\Java\`
3. **Rename folder** to `jdk-25`

---

## **⚙️ Step 3: Set Environment Variables**

### **Method 1: GUI (EASIEST)**

1. **Press `Win + X`**
2. Click **"System"**
3. Click **"Advanced system settings"** (right side)
4. Click **"Environment Variables"** button
5. Under **"System variables"**, click **"New"**
6. **Variable name:** `JAVA_HOME`
7. **Variable value:** `C:\Program Files\Java\jdk-25`
8. Click **OK**
9. Find **"Path"** variable
10. Click **"Edit"**
11. Click **"New"**
12. Add: `%JAVA_HOME%\bin`
13. Click **OK** on everything

---

### **Method 2: PowerShell (FAST)**

**Run PowerShell as Administrator:**

```powershell
# Replace with your actual Java path
$javaPath = "C:\Program Files\Java\jdk-25"

# Set JAVA_HOME
[Environment]::SetEnvironmentVariable("JAVA_HOME", $javaPath, "Machine")

# Add to Path
$path = [Environment]::GetEnvironmentVariable("Path", "Machine")
[Environment]::SetEnvironmentVariable("Path", "$path;$javaPath\bin", "Machine")
```

---

## **✅ Step 4: Verify**

**Restart terminal and run:**
```bash
java -version
```

**Should show:**
```
java version "25.x.x"
```

---

## **🎯 Tell Me:**

**What's the full path to your Java installation?**

**Example:**
- `C:\Program Files\Java\jdk-25`
- Or wherever you installed it

**Then I'll help you activate it!** ☕

