# 🔧 Fix "User Already Exists" Error

## 🎯 Problem Identified

You're trying to sign up with an email that's already registered:
```
Email: test@test.com
Error: User already registered
```

---

## ✅ Solutions

### **Option 1: Login Instead of Sign Up (Recommended)**

If you already have an account, just **login**:

1. Go to the **Login** screen
2. Enter:
   ```
   Email: test@test.com
   Password: your_password
   ```
3. Click **Login**
4. You'll be taken to the app

---

### **Option 2: Use a Different Email**

Create a new account with a different email:

```
Email: yourname@example.com
Email: test1@test.com
Email: test2@test.com
Email: myemail@gmail.com
```

**Any email works** - it doesn't need to be real for testing!

---

### **Option 3: Delete the Existing Account**

If you want to use `test@test.com`, delete the old account first:

#### **Step 1: Delete from Supabase Dashboard**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **Authentication** → **Users**
3. Find `test@test.com` in the list
4. Click **⋮** (three dots) → **Delete user**
5. Confirm deletion

#### **Step 2: Delete the Profile Data**

Run this SQL in **SQL Editor**:

```sql
-- Find the user ID for test@test.com
SELECT user_id FROM profiles WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'test@test.com'
);

-- Delete all data for this user (replace USER_ID with the actual ID)
DELETE FROM messages WHERE sender_id = 'USER_ID';
DELETE FROM matches WHERE user_a_id = 'USER_ID' OR user_b_id = 'USER_ID';
DELETE FROM swipes WHERE swiper_user_id = 'USER_ID' OR target_user_id = 'USER_ID';
DELETE FROM swipe_counters WHERE user_id = 'USER_ID';
DELETE FROM preferences WHERE user_id = 'USER_ID';
DELETE FROM profiles WHERE user_id = 'USER_ID';
```

#### **Step 3: Sign Up Again**

Now you can sign up with `test@test.com` again!

---

### **Option 4: Reset Password (If You Forgot)**

If you forgot your password:

1. Click **Forgot Password** on login screen
2. Enter `test@test.com`
3. Check your email for reset link
4. Set new password
5. Login with new password

---

## 🎯 Recommended Approach

### **For Testing:**

Use **unique emails** for each test account:

```
test1@test.com
test2@test.com
alice@example.com
bob@example.com
user-2024-10-13@test.com
```

This way you can create multiple accounts without conflicts!

---

## 🔧 Quick Fix Script

I'll create a script to delete a specific user for you:

```sql
-- Delete test@test.com account
-- Run this in Supabase SQL Editor

-- First, find the user
SELECT 
  id as user_id,
  email,
  created_at
FROM auth.users 
WHERE email = 'test@test.com';

-- Copy the user_id from above, then run these (replace USER_ID):

-- Delete all related data
DELETE FROM messages WHERE sender_id = 'USER_ID';
DELETE FROM matches WHERE user_a_id = 'USER_ID' OR user_b_id = 'USER_ID';
DELETE FROM swipes WHERE swiper_user_id = 'USER_ID' OR target_user_id = 'USER_ID';
DELETE FROM swipe_counters WHERE user_id = 'USER_ID';
DELETE FROM preferences WHERE user_id = 'USER_ID';
DELETE FROM profiles WHERE user_id = 'USER_ID';

-- Then delete from Authentication tab in Supabase Dashboard
```

---

## 📝 What to Do Now

**Choose one:**

1. ✅ **Login with test@test.com** (if you know the password)
2. ✅ **Sign up with a different email** (easiest!)
3. ✅ **Delete the old account** (if you want to reuse test@test.com)
4. ✅ **Reset password** (if you forgot it)

---

## 🆕 Create Fresh Account

Just use a new email:

```
Email: myname@example.com
Password: YourPassword123!
```

Then complete onboarding and you're good to go! 🎉

---

## ⚠️ Important Note

The error message **"User already registered"** means:
- ✅ Your app is working correctly
- ✅ Supabase authentication is working
- ❌ You just need to use a different email or login

**This is NOT a bug - it's working as intended!** 🎯


