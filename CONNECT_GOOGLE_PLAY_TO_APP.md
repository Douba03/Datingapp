# Connect Google Play Subscription to Your App 🔗

## ✅ What You've Done
- ✅ Created subscription in Google Play Console
- ✅ Set up RevenueCat with Google Play

## 🎯 What You Need to Do Now

### Step 1: Note Your Google Play Product ID

**Important:** Your app code expects this product ID:
```
premium_monthly_199_android
```

**Check in Google Play Console:**
1. Go to: **Monetize** → **Products** → **Subscriptions**
2. Find your premium subscription
3. **Copy the Product ID** (it should be `premium_monthly_199_android`)
4. If it's different, you'll need to either:
   - Change it in Google Play Console to match `premium_monthly_199_android`
   - OR update your app code to use the new ID

---

### Step 2: Create Product in RevenueCat

1. **Go to RevenueCat Dashboard:**
   - https://app.revenuecat.com
   - Select your project: **Mali Match**

2. **Go to Products:**
   - Click **Products** in the left sidebar
   - Click **+ New** or **Create Product**

3. **Fill in Product Details:**
   - **Product ID:** `premium_monthly_199_android` ⚠️ **MUST MATCH Google Play!**
   - **Display Name:** `Premium Monthly`
   - **Description:** `Unlock all premium features`

4. **Click "Create"**

---

### Step 3: Link Product to Google Play Store

1. **In RevenueCat, go to your product:**
   - Click on the product you just created (`premium_monthly_199_android`)

2. **Add Store:**
   - Click **"+ Add Store"** or **"Link Store"**
   - Select **"Google Play Store"**

3. **Select Your Subscription:**
   - RevenueCat will show your Google Play subscriptions
   - **Select:** `premium_monthly_199_android` (or whatever you named it in Play Console)
   - Click **"Link"** or **"Save"**

4. **Verify:**
   - You should see "Google Play Store" listed under "Stores"
   - Status should be **"Active"** ✅

---

### Step 4: Create Entitlement

**Entitlements** are what unlock features in your app. Your app checks for the `premium` entitlement.

1. **Go to Entitlements:**
   - Click **Entitlements** in the left sidebar
   - Click **+ New** or **Create Entitlement**

2. **Create Entitlement:**
   - **Identifier:** `premium` ⚠️ **MUST BE EXACTLY "premium"** (your app code checks for this!)
   - **Display Name:** `Premium Access`
   - **Description:** `Unlock unlimited swipes, undo, and all premium features`

3. **Click "Create"**

---

### Step 5: Attach Product to Entitlement

1. **Go back to Products:**
   - Click **Products** → `premium_monthly_199_android`

2. **Add Entitlement:**
   - Scroll down to **"Entitlements"** section
   - Click **"+ Add Entitlement"**
   - Select: `premium`
   - Click **"Save"**

**OR** (Alternative method):

1. **Go to Entitlements:**
   - Click **Entitlements** → `premium`

2. **Add Product:**
   - Click **"+ Add Product"**
   - Select: `premium_monthly_199_android`
   - Click **"Save"**

---

### Step 6: Verify Everything is Connected

**Checklist:**

- [ ] ✅ Product created in RevenueCat: `premium_monthly_199_android`
- [ ] ✅ Product linked to Google Play Store
- [ ] ✅ Entitlement created: `premium`
- [ ] ✅ Product attached to entitlement
- [ ] ✅ Google Play subscription is **Active** (not Draft)

---

## 🔍 Verify Product IDs Match

### In Your App Code:
**File:** `src/services/iap/purchaseService.ts`
**Line 9:** `android: 'premium_monthly_199_android'`

### In Google Play Console:
**Product ID:** Should be `premium_monthly_199_android`

### In RevenueCat:
**Product ID:** Should be `premium_monthly_199_android`

**All three must match exactly!** ⚠️

---

## 🧪 Test the Connection

### Option 1: Test in RevenueCat Dashboard

1. **Go to:** RevenueCat → **Customers**
2. **Add Test User:**
   - Click **"+ Add Customer"**
   - Enter a test email or user ID
   - Click **"Create"**

3. **Grant Entitlement:**
   - Click on the test customer
   - Go to **"Entitlements"** tab
   - Click **"+ Grant Entitlement"**
   - Select: `premium`
   - Set expiry (or leave unlimited)
   - Click **"Grant"**

4. **Test in App:**
   - Log in with that test user
   - Premium features should be unlocked! ✅

### Option 2: Test Purchase (Requires Published App)

**Note:** Real purchases only work when:
- App is published to Google Play (at least in Internal Testing track)
- You're using a real Google account
- You're testing on a real device

1. **Build and install** your app on a test device
2. **Try to purchase** premium
3. **Check RevenueCat Dashboard:**
   - Go to **Customers**
   - Find your user
   - Check if `premium` entitlement is active

---

## 🚨 Common Issues

### Issue 1: "Product not found"
**Solution:**
- Make sure product ID matches exactly in all three places:
  - Google Play Console
  - RevenueCat
  - Your app code

### Issue 2: "Entitlement not active"
**Solution:**
- Make sure product is linked to entitlement
- Check that Google Play subscription is **Active** (not Draft)
- Wait 5-10 minutes for sync

### Issue 3: "Purchase succeeds but premium not unlocked"
**Solution:**
- Check RevenueCat → Customers → Your user
- Verify `premium` entitlement is active
- Check your app code is checking `customerInfo.entitlements.active['premium']`

### Issue 4: "Can't find product in RevenueCat"
**Solution:**
- Make sure you're in the correct RevenueCat project
- Make sure Google Play is connected
- Refresh the page
- Check product ID spelling (case-sensitive!)

---

## 📋 Quick Reference

| Location | What to Check |
|----------|---------------|
| **Google Play Console** | Product ID: `premium_monthly_199_android` |
| **RevenueCat Product** | Product ID: `premium_monthly_199_android` |
| **RevenueCat Entitlement** | Identifier: `premium` |
| **App Code** | `PRODUCT_IDS.PREMIUM_MONTHLY` = `premium_monthly_199_android` |

---

## ✅ Final Checklist

- [ ] Product created in RevenueCat: `premium_monthly_199_android`
- [ ] Product linked to Google Play Store
- [ ] Entitlement created: `premium`
- [ ] Product attached to entitlement
- [ ] Product IDs match in all three places
- [ ] Google Play subscription is Active
- [ ] Test user created and entitlement granted (for testing)

---

## 🎉 You're Done!

Once everything is connected:
1. **Users can purchase** premium in your app
2. **RevenueCat tracks** all purchases
3. **Your app checks** for `premium` entitlement
4. **Premium features unlock** automatically! ✅

---

## 📞 Need Help?

- **RevenueCat Docs:** https://docs.revenuecat.com/docs/entitlements
- **Google Play Integration:** https://docs.revenuecat.com/docs/google-play
- **Troubleshooting:** Check RevenueCat Dashboard → Customers → Your user → Entitlements

---

**After connecting everything, test a purchase to make sure it works!** 🚀

