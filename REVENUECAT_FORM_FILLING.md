# RevenueCat Google Play Form - What to Fill 📝

## 🎯 Form Fields Explained

### 1. **App name** ✅
```
Mali Match
```
(or keep `mali match (Play Store)` - both work)

---

### 2. **Google Play package name** ⚠️ REQUIRED
```
com.anonymous.partnerproductivityapp
```

**⚠️ IMPORTANT:** Replace `pemium` with the correct package name above!

**Where to find it:**
- File: `android/app/build.gradle`
- Line: `applicationId 'com.anonymous.partnerproductivityapp'`

---

### 3. **Service Account Credentials** ⚠️ REQUIRED

You need to upload a **JSON file** from Google Cloud Console.

#### Step-by-Step Guide:

**A. Create Service Account in Google Cloud:**

1. **Go to:** https://console.cloud.google.com
2. **Select or create project** (can use your Play Console project)
3. **Enable API:**
   - Go to **APIs & Services** → **Library**
   - Search: "Google Play Android Developer API"
   - Click **Enable**

4. **Create Service Account:**
   - Go to **IAM & Admin** → **Service Accounts**
   - Click **Create Service Account**
   - Name: `revenuecat-service-account`
   - Description: "For RevenueCat Google Play integration"
   - Click **Create and Continue**
   - Role: **Service Account User**
   - Click **Done**

5. **Create JSON Key:**
   - Click on your new service account
   - Go to **Keys** tab
   - Click **Add Key** → **Create new key**
   - Select **JSON**
   - Click **Create**
   - **JSON file downloads automatically** ⬇️

**B. Grant Play Console Access:**

1. **Go to:** https://play.google.com/console
2. **Select your app:** "Mali Match"
3. **Go to:** **Setup** → **API access**
4. **Link Service Account:**
   - Click **Link service account**
   - Enter the **email** from your JSON file (looks like: `revenuecat-service-account@your-project.iam.gserviceaccount.com`)
   - Click **Grant Access**
   - **Permissions needed:**
     - ✅ View financial data
     - ✅ Manage orders

5. **Upload JSON to RevenueCat:**
   - Go back to RevenueCat form
   - Click the upload area
   - Select the downloaded JSON file
   - File uploaded! ✅

---

### 4. **Financial Reports Bucket ID** (Optional)

**Leave default:** `pubsite_prod_1234567890000000000`

**OR** create a bucket if you want historical data:

1. **Go to:** Google Cloud Console → **Cloud Storage**
2. **Create bucket:**
   - Name: `mali-match-play-reports`
   - Location: Same as your project
   - Click **Create**
3. **Copy bucket ID** and paste in RevenueCat form

**Note:** This is optional - you can skip it for now and add later.

---

## ✅ Quick Checklist

- [ ] **App name:** `Mali Match`
- [ ] **Package name:** `com.anonymous.partnerproductivityapp` (NOT "pemium"!)
- [ ] **Service Account:** Created in Google Cloud
- [ ] **JSON Key:** Downloaded from Google Cloud
- [ ] **Play Console:** Service account linked with permissions
- [ ] **JSON File:** Uploaded to RevenueCat form
- [ ] **Bucket ID:** Left default (optional)
- [ ] **Click:** "Save changes" ✅

---

## 🚨 Common Mistakes

1. ❌ **Wrong package name:** Using "pemium" instead of `com.anonymous.partnerproductivityapp`
2. ❌ **Missing permissions:** Not granting Play Console access to service account
3. ❌ **Wrong JSON:** Using wrong service account or expired key
4. ❌ **API not enabled:** Forgetting to enable Google Play Android Developer API

---

## 📞 Need Help?

- **RevenueCat Support:** https://www.revenuecat.com/support
- **Google Cloud Docs:** https://cloud.google.com/iam/docs/service-accounts
- **Play Console API:** https://developers.google.com/android-publisher

---

**After filling the form, click "Save changes" and you're done!** 🎉

