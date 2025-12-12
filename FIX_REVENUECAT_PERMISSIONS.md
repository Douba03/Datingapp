# Fix RevenueCat API Permissions ⚠️

## 🚨 Problem

You're seeing these warnings:
- ✅ **Subscriptions API** - Working!
- ❓ **In-app products API** - Missing permissions
- ❓ **Monetization API** - Missing permissions

---

## ✅ Solution: Grant Permissions in Google Play Console

### Step 1: Go to Google Play Console

1. **Open:** https://play.google.com/console
2. **Select your app:** "Mali Match"
3. **Go to:** **Setup** → **API access**

---

### Step 2: Find Your Service Account

1. **Look for:** Your service account email (from the JSON file you uploaded)
   - Format: `revenuecat-service-account@your-project.iam.gserviceaccount.com`
2. **Click:** The service account name or "Grant access"

---

### Step 3: Grant Required Permissions

**Click "Grant access"** and enable these permissions:

#### ✅ Required Permissions:

1. **✅ View app information and download bulk reports**
   - Needed for: Basic app data

2. **✅ View financial data, orders, and cancellation survey responses**
   - Needed for: Monetization API ✅

3. **✅ Manage orders and subscriptions**
   - Needed for: Subscriptions API ✅

4. **✅ Manage in-app products**
   - Needed for: In-app products API ✅

5. **✅ View app information and download bulk reports**
   - Already enabled ✅

---

### Step 4: Save and Wait

1. **Click:** "Send invitation" or "Update permissions"
2. **Wait:** 5-10 minutes for permissions to sync
3. **Refresh:** RevenueCat page to see if warnings disappear

---

## 🔍 Alternative: Check Current Permissions

If you're not sure what's enabled:

1. **In Google Play Console:**
   - Go to **Setup** → **API access**
   - Find your service account
   - Click on it
   - See what permissions are currently granted

2. **If permissions are missing:**
   - Click **"Grant access"** or **"Edit permissions"**
   - Enable all permissions listed above
   - Save

---

## 📋 Quick Checklist

- [ ] Opened Google Play Console
- [ ] Went to Setup → API access
- [ ] Found service account (from JSON file)
- [ ] Clicked "Grant access" or "Edit permissions"
- [ ] Enabled: **View financial data** ✅
- [ ] Enabled: **Manage in-app products** ✅
- [ ] Enabled: **Manage orders and subscriptions** ✅
- [ ] Saved permissions
- [ ] Waited 5-10 minutes
- [ ] Refreshed RevenueCat page
- [ ] All warnings should be gone! ✅

---

## 🚨 Common Issues

### Issue 1: "Service account not found"
**Solution:** Make sure you:
1. Created the service account in Google Cloud Console
2. Linked it in Google Play Console (Setup → API access → Link service account)
3. Used the correct email from your JSON file

### Issue 2: "Permissions not updating"
**Solution:**
- Wait 10-15 minutes (Google sync can be slow)
- Refresh the RevenueCat page
- Try disconnecting and reconnecting Google Play in RevenueCat

### Issue 3: "Can't find API access page"
**Solution:**
- Make sure you're the **owner** or have **admin** access to the Play Console
- The app must be published or in a draft state
- Try: **Settings** → **API access** (alternative path)

---

## 🎯 What Each Permission Does

| Permission | What It's For |
|------------|---------------|
| **View financial data** | RevenueCat needs this to track revenue, subscriptions, and payments |
| **Manage in-app products** | RevenueCat needs this to sync your in-app products (one-time purchases) |
| **Manage orders** | RevenueCat needs this to handle subscription renewals and cancellations |

---

## ✅ After Fixing

Once all permissions are granted:

1. **Refresh RevenueCat page**
2. **All checkmarks should be green** ✅
3. **You can now:**
   - Create products in RevenueCat
   - Link them to Google Play
   - Test purchases
   - Track revenue

---

## 📞 Still Having Issues?

1. **Check service account email:**
   - Open your JSON file
   - Find `"client_email"` field
   - Make sure this exact email is linked in Play Console

2. **Verify API is enabled:**
   - Go to Google Cloud Console
   - APIs & Services → Enabled APIs
   - Make sure "Google Play Android Developer API" is enabled

3. **Try re-linking:**
   - In RevenueCat, disconnect Google Play
   - Re-upload the JSON file
   - Re-link in Play Console

---

**After granting permissions, wait 5-10 minutes and refresh RevenueCat!** ⏰

