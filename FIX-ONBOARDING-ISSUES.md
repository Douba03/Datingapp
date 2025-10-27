# 🔧 Fix Onboarding Issues - Complete Guide

## 🎯 Problems Identified

Based on your report:
1. ❌ Can't complete registration (button keeps loading)
2. ❌ After multiple refreshes, gets through but loses info
3. ❌ Pictures not visible
4. ❌ Name shows as "30" instead of actual name

---

## 🔍 Root Causes

### **Issue 1: Onboarding Not Completing**
**Cause:** The "Let's Go" button gets stuck in loading state

**What's Happening:**
- You click "Let's Go"
- Button shows "Setting up your profile..."
- It never completes
- You have to refresh multiple times

**Why:** There's an error during profile creation that's not being shown

---

### **Issue 2: Data Lost After Refresh**
**Cause:** Onboarding data stored in memory, not database

**What's Happening:**
- You fill in name, bio, interests
- Click "Let's Go"
- It gets stuck
- You refresh
- All your data is gone

**Why:** The onboarding context (temporary storage) is cleared on refresh

---

### **Issue 3: Pictures Not Visible**
**Cause:** Photos stored as local URIs, not uploaded to cloud storage

**What's Happening:**
- You select photos during onboarding
- Photos show in preview
- After refresh, photos disappear

**Why:** Photos are stored as `file://` or `blob:` URLs which don't persist

---

### **Issue 4: Name Shows as "30"**
**Cause:** Wrong field being displayed or data mapping error

**What's Happening:**
- You enter your name
- Profile shows "30" instead
- "30" is actually your age

**Why:** Bug in how onboarding data is mapped to profile

---

## ✅ Complete Solution

### **Step 1: Check Browser Console**

**MOST IMPORTANT!** Open browser console to see the actual error:

1. Press **F12**
2. Click **Console** tab
3. Try completing onboarding
4. Look for **red error messages**

Common errors you might see:

#### A) **RLS Policy Error**
```
new row violates row-level security policy
```

**Fix:** Run this SQL in Supabase:
```sql
-- Allow users to create their own profile
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own profile  
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to insert their own preferences
CREATE POLICY "Users can insert own preferences"
ON preferences FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own preferences
CREATE POLICY "Users can update own preferences"
ON preferences FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

#### B) **Email Confirmation Required**
```
Email not confirmed
```

**Fix:** 
1. Go to Supabase Dashboard → Authentication → Settings
2. Disable "Enable email confirmations"
3. Or check your email for confirmation link

#### C) **Network Error**
```
Failed to fetch
Network request failed
```

**Fix:**
- Check internet connection
- Check if Supabase is accessible
- Try again

---

### **Step 2: Fix Storage for Photos**

Photos need to be uploaded to Supabase Storage, not stored locally.

#### **A) Create Storage Bucket**

1. Go to Supabase Dashboard → **Storage**
2. Click **New bucket**
3. Name: `profile-pictures`
4. Public: **Yes** ✅
5. Click **Create**

#### **B) Apply RLS Policies**

Run this SQL:
```sql
-- Allow authenticated users to upload their own photos
CREATE POLICY "Users can upload own photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow everyone to view photos (public)
CREATE POLICY "Photos are publicly viewable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');

-- Allow users to update their own photos
CREATE POLICY "Users can update own photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own photos
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

---

### **Step 3: Start Fresh**

Since your current account has issues, let's start over:

#### **Option A: Delete and Recreate (Recommended)**

1. **Delete kille@test.com account:**
   - Go to Supabase Dashboard → Authentication → Users
   - Find `kille@test.com`
   - Click **⋮** → **Delete user**

2. **Create new account:**
   - Use: `kille2@test.com` or any other email
   - Password: `test123456`

3. **Complete onboarding carefully:**
   - Fill in ALL fields
   - Don't skip any steps
   - Watch browser console for errors

#### **Option B: Fix Existing Account**

If you want to keep `kille@test.com`:

1. **Login** to the app
2. **Go to Profile** → **Edit**
3. **Update:**
   - Name (fix the "30" issue)
   - Bio
   - Interests
   - Photos (re-upload)
4. **Save**

---

### **Step 4: Complete Onboarding Properly**

Follow these steps **exactly**:

#### **Before Starting:**
- ✅ Open browser console (F12)
- ✅ Clear console (click 🚫)
- ✅ Make sure storage bucket exists

#### **During Onboarding:**

1. **Name & Basic Info**
   - Enter your **actual name** (not age!)
   - Select date of birth
   - Select gender
   - Click **Next**

2. **Bio**
   - Write at least 50 characters
   - Be specific
   - Click **Next**

3. **Interests**
   - Select at least 3-5 interests
   - Click **Next**

4. **Photos** (Optional but recommended)
   - Skip for now if storage bucket not set up
   - Or upload 1-2 photos if bucket exists
   - Click **Next**

5. **Preferences**
   - Select seeking genders
   - Set age range (e.g., 18-35)
   - Set max distance (e.g., 50 km)
   - Click **Next**

6. **Complete**
   - Click **"Let's Go"**
   - **Watch console** for errors
   - Wait for navigation (should take 2-5 seconds)

#### **If It Gets Stuck:**
- Check console for errors
- Copy the error message
- Don't refresh yet!
- Tell me the error

---

## 🧪 Test Script

I'll create a script to test if everything is set up correctly:

```bash
node test-onboarding-completion.js
```

This will:
- Create a test account
- Complete onboarding programmatically
- Show if there are any database errors
- Verify everything works

---

## 📋 Checklist

Before trying again, make sure:

- [ ] Browser console is open (F12)
- [ ] Storage bucket `profile-pictures` exists
- [ ] RLS policies applied (run the SQL above)
- [ ] Email confirmation disabled (or confirmed)
- [ ] Using a fresh email (not kille@test.com)
- [ ] Internet connection is stable
- [ ] Supabase dashboard accessible

---

## 🎯 Step-by-Step Fix Plan

### **Right Now:**

1. **Run these SQL commands** in Supabase SQL Editor:
   ```sql
   -- Fix RLS policies
   CREATE POLICY IF NOT EXISTS "Users can insert own profile"
   ON profiles FOR INSERT TO authenticated
   WITH CHECK (auth.uid() = user_id);

   CREATE POLICY IF NOT EXISTS "Users can update own profile"
   ON profiles FOR UPDATE TO authenticated
   USING (auth.uid() = user_id);

   CREATE POLICY IF NOT EXISTS "Users can insert own preferences"
   ON preferences FOR INSERT TO authenticated
   WITH CHECK (auth.uid() = user_id);
   ```

2. **Create storage bucket** (if not exists):
   - Dashboard → Storage → New bucket
   - Name: `profile-pictures`
   - Public: Yes

3. **Apply storage policies** (run SQL above)

### **Then:**

4. **Create new account**:
   - Email: `kille2@test.com` (or any fresh email)
   - Password: `test123456`

5. **Complete onboarding** with console open

6. **Report back** with:
   - Did it work? ✅ or ❌
   - Any errors in console?
   - What step did it fail on?

---

## 💡 Pro Tips

1. **Always keep console open** during onboarding
2. **Don't refresh** if it gets stuck - check console first
3. **Fill ALL fields** - don't leave anything empty
4. **Use simple data** for testing (short name, simple bio)
5. **Skip photos** initially if having issues

---

## 🆘 If Still Not Working

Tell me:
1. **Exact error message** from console
2. **Which step** it fails on
3. **Screenshot** of console (if possible)
4. **Did you run** the SQL commands above?
5. **Does storage bucket** exist?

I'll help you fix it! 🚀


