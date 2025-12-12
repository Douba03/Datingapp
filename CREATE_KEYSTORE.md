# Create Release Keystore - Step by Step 🔐

Follow these steps to create a release keystore for signing your app.

---

## 📋 What You'll Need

Before running the command, prepare:
- A strong password (you'll need to remember this!)
- Your name or organization name
- Your location (city, state, country)

---

## 🚀 Step-by-Step Instructions

### **Step 1: Open Terminal/Command Prompt**

Navigate to your project:
```bash
cd C:\Users\qossai\Desktop\partner-productivity-app\android\app
```

### **Step 2: Run Keytool Command**

Copy and paste this command:

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias malimatch -keyalg RSA -keysize 2048 -validity 10000
```

### **Step 3: Answer the Questions**

You'll be asked several questions. Here's what to enter:

1. **Enter keystore password:**
   - Type a strong password (e.g., `MaliMatch2024!`)
   - Press Enter
   - **IMPORTANT:** Write this password down! You'll need it forever!

2. **Re-enter new password:**
   - Type the same password again
   - Press Enter

3. **What is your first and last name?**
   - Example: `Mali Match` or your name
   - Press Enter

4. **What is the name of your organizational unit?**
   - Example: `Development` or `Mobile Apps`
   - Press Enter

5. **What is the name of your organization?**
   - Example: `Mali Match` or your company name
   - Press Enter

6. **What is the name of your City or Locality?**
   - Example: `Stockholm` or your city
   - Press Enter

7. **What is the name of your State or Province?**
   - Example: `Stockholm` or your state
   - Press Enter

8. **What is the two-letter country code for this unit?**
   - Example: `SE` (Sweden), `US` (USA), `GB` (UK)
   - Press Enter

9. **Is CN=Mali Match, OU=Development, O=Mali Match, L=Stockholm, ST=Stockholm, C=SE correct?**
   - Type: `yes`
   - Press Enter

10. **Enter key password for <malimatch>:**
    - You can press Enter to use the same password as keystore
    - Or type a different password (if different, remember it!)

### **Step 4: Done!**

You should see:
```
[Storing release.keystore]
```

The keystore file is created at:
```
android/app/release.keystore
```

---

## 📝 Example Session

Here's what it looks like:

```
Enter keystore password: MaliMatch2024!
Re-enter new password: MaliMatch2024!
What is your first and last name?
  [Unknown]:  Mali Match
What is the name of your organizational unit?
  [Unknown]:  Development
What is the name of your organization?
  [Unknown]:  Mali Match
What is the name of your City or Locality?
  [Unknown]:  Stockholm
What is the name of your State or Province?
  [Unknown]:  Stockholm
What is the two-letter country code for this unit?
  [Unknown]:  SE
Is CN=Mali Match, OU=Development, O=Mali Match, L=Stockholm, ST=Stockholm, C=SE correct?
  [no]:  yes

Generating 2,048 bit RSA key pair and self-signed certificate (SHA256withRSA) with a validity of 10,000 days
        for: CN=Mali Match, OU=Development, O=Mali Match, L=Stockholm, ST=Stockholm, C=SE
[Storing release.keystore]
```

---

## ⚠️ IMPORTANT: Save Your Passwords!

**Write down and save securely:**
- Keystore password: `_________________`
- Key password: `_________________` (if different)
- Key alias: `malimatch`

**If you lose these, you CANNOT update your app on Google Play!**

---

## 🔒 Security Tips

1. **Don't share the keystore file** with anyone
2. **Don't commit it to Git** (add to `.gitignore`)
3. **Backup the keystore** to a secure location (encrypted USB, cloud storage with encryption)
4. **Use a password manager** to store passwords

---

## ✅ After Creating Keystore

Once the keystore is created, I'll help you:
1. Create `keystore.properties` file
2. Update `build.gradle` to use it
3. Rebuild the AAB with proper signing

---

**Ready? Run the keytool command now!** 🚀

