# Upload Mali Match to Google Play Console 📱

Complete guide to upload your AAB file to Google Play Console.

---

## ✅ AAB File Ready!

Your Android App Bundle (AAB) has been built successfully!

**Location:**
```
android/app/build/outputs/bundle/release/app-release.aab
```

**File Size:** ~118 MB (approximate)

---

## 📋 Step-by-Step: Upload to Google Play Console

### **Step 1: Create Google Play Developer Account**

1. Go to: https://play.google.com/console
2. Sign in with your Google account
3. Pay **$25 one-time registration fee**
4. Complete account setup (may take 1-2 days for approval)

---

### **Step 2: Create Your App**

1. In Play Console, click **"Create app"**
2. Fill in the details:
   - **App name:** `Mali Match`
   - **Default language:** English (United States)
   - **App or game:** App
   - **Free or paid:** Free (or Paid if you want)
   - **Declarations:** Accept terms
3. Click **"Create app"**

---

### **Step 3: Complete App Information**

#### **3.1 Store Listing**

Go to: **Store presence** → **Main store listing**

Fill in:
- **App name:** `Mali Match`
- **Short description** (80 characters max):
  ```
  Connect with people nearby. Find your perfect match with Mali Match!
  ```
- **Full description** (4000 characters max):
  ```
  Mali Match is the perfect way to meet new people and find meaningful connections. 
  
  Features:
  • Swipe through profiles
  • Chat with matches
  • See who likes you
  • Premium features available
  
  Download Mali Match today and start connecting!
  ```

**Required Assets:**
- **App icon:** 512x512px PNG (no transparency)
- **Feature graphic:** 1024x500px PNG
- **Screenshots:** At least 2 (phone screenshots)
  - Phone: 16:9 or 9:16 ratio
  - Minimum: 320px, Maximum: 3840px

#### **3.2 App Content**

Go to: **Policy** → **App content**

- **Privacy Policy:** Required! Create a privacy policy page
- **Target audience:** Select appropriate age group
- **Content ratings:** Complete questionnaire

---

### **Step 4: Upload AAB File**

1. Go to: **Production** → **Create new release**

2. **Upload AAB:**
   - Click **"Upload"** button
   - Select your AAB file:
     ```
     android/app/build/outputs/bundle/release/app-release.aab
     ```
   - Wait for upload to complete

3. **Release notes:**
   - Add what's new in this version:
     ```
     Initial release of Mali Match!
     - Connect with people nearby
     - Swipe through profiles
     - Chat with matches
     - Premium features available
     ```

4. Click **"Save"**

---

### **Step 5: Set Up App Signing**

Google Play will handle app signing automatically:

1. Go to: **Setup** → **App signing**
2. Google will generate a signing key for you
3. This is automatic - no action needed!

---

### **Step 6: Complete Content Rating**

1. Go to: **Policy** → **App content** → **Content ratings**
2. Fill out the questionnaire:
   - Select appropriate categories
   - Answer questions about your app
3. Submit for rating
4. **Wait 1-2 days** for rating to complete

---

### **Step 7: Set Up Pricing & Distribution**

1. Go to: **Pricing & distribution**

2. **Pricing:**
   - Select **Free** or **Paid**
   - If paid, set price

3. **Countries:**
   - Select countries where app will be available
   - Or select "All countries"

4. **Declarations:**
   - ✅ Content guidelines
   - ✅ Export laws
   - ✅ US sanctions

5. Click **"Save"**

---

### **Step 8: Review & Publish**

1. Go to: **Production** → **Releases**

2. **Check all sections:**
   - ✅ Store listing (complete)
   - ✅ App content (complete)
   - ✅ Content rating (approved)
   - ✅ Pricing & distribution (complete)
   - ✅ Production release (AAB uploaded)

3. **All sections should have green checkmarks!**

4. Click **"Start rollout to Production"**

5. **Review process:**
   - Google will review your app
   - Usually takes **1-7 days**
   - You'll get email when approved/rejected

6. **Once approved:** Your app goes live! 🎉

---

## ⚠️ Important Notes

### **Before Uploading:**

1. **Package Name:**
   - Current: `com.anonymous.partnerproductivityapp`
   - You can keep this OR change it
   - If changing, update `app.json` and rebuild

2. **Version Code:**
   - Current: `1` (versionCode in build.gradle)
   - Must increase with each update

3. **Version Name:**
   - Current: `1.0.0` (versionName)
   - Update for each release

### **App Signing:**

- Google Play will sign your app automatically
- You don't need to create a keystore manually
- Google manages the signing key

### **Testing Before Release:**

**Option 1: Internal Testing**
1. Upload AAB to **Internal testing** track
2. Add testers' email addresses
3. Testers can install via Play Store link
4. Test everything before production!

**Option 2: Closed Testing**
1. Upload to **Closed testing** track
2. Invite up to 100 testers
3. Get feedback before public release

---

## 🐛 Troubleshooting

### **"Upload failed"**
- ✅ Check file size (max 150MB for AAB)
- ✅ Verify it's `.aab` not `.apk`
- ✅ Check internet connection

### **"Package name already exists"**
- ✅ Change package name in `app.json`:
  ```json
  "android": {
    "package": "com.yourcompany.malimatch"
  }
  ```
- ✅ Run `npx expo prebuild --clean`
- ✅ Rebuild AAB

### **"Missing required information"**
- ✅ Complete all sections with red warnings
- ✅ Add privacy policy URL
- ✅ Complete content rating
- ✅ Add app screenshots

### **"App rejected"**
- ✅ Check email for specific reasons
- ✅ Fix issues mentioned
- ✅ Resubmit

---

## 📱 After Publishing

### **Monitor Your App:**

1. **Play Console Dashboard:**
   - View downloads
   - Check ratings & reviews
   - Monitor crashes

2. **Update Your App:**
   - Make changes
   - Increase version code
   - Build new AAB
   - Upload to Production

3. **Respond to Reviews:**
   - Go to: **Ratings & reviews**
   - Reply to user feedback

---

## 🎯 Quick Checklist

Before publishing, make sure:

- [ ] Google Play Developer account created ($25)
- [ ] App created in Play Console
- [ ] Store listing complete (name, description, screenshots)
- [ ] Privacy policy added
- [ ] Content rating completed
- [ ] AAB file uploaded
- [ ] Pricing & distribution set
- [ ] All sections have green checkmarks
- [ ] Tested app thoroughly

---

## 📚 Resources

- **Google Play Console:** https://play.google.com/console
- **Play Console Help:** https://support.google.com/googleplay/android-developer
- **AAB Format:** https://developer.android.com/guide/app-bundle

---

## 🚀 Next Steps

1. **Create Google Play account** (if not done)
2. **Create app** in Play Console
3. **Complete store listing** (add screenshots, description)
4. **Upload AAB file** from:
   ```
   android/app/build/outputs/bundle/release/app-release.aab
   ```
5. **Complete all sections** (content rating, privacy policy, etc.)
6. **Submit for review**
7. **Wait for approval** (1-7 days)
8. **App goes live!** 🎉

---

**Your AAB file is ready to upload!** 📦

Good luck with your launch! 🚀

