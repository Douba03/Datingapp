# 🚀 Setup Blocked Users - Quick Guide

## ❌ **Problem:**
The `user_blocks` table doesn't exist in your database yet, so blocked users can't be saved or displayed.

---

## ✅ **Solution: Run SQL Migration (2 minutes)**

### **Step 1: Open Supabase Dashboard**
1. Go to: https://supabase.com/dashboard
2. Select your project: **partner-productivity-app**

### **Step 2: Open SQL Editor**
1. Click **"SQL Editor"** in the left sidebar
2. Click **"New Query"** button (top right)

### **Step 3: Copy & Paste SQL**
1. Open the file: `sql/create-user-blocks.sql`
2. **Copy ALL the SQL** (45 lines)
3. **Paste** it into the SQL Editor

### **Step 4: Run the SQL**
1. Click **"Run"** button (or press `Ctrl + Enter`)
2. Wait for it to complete (should take 1-2 seconds)
3. You should see: ✅ **"user_blocks table created successfully!"**

---

## 🧪 **Step 5: Verify It Worked**

Run this command in your terminal:
```bash
node test-blocked-users.js
```

You should see:
```
✅ user_blocks table exists!
✅ Found 0 blocked user(s)
🎉 Blocked Users setup is complete!
```

---

## 📱 **Step 6: Test in the App**

1. **Block a user** from chat:
   - Open any chat
   - Tap the **ban icon** (top right)
   - Select a reason and confirm

2. **View blocked users**:
   - Go to **Settings** tab
   - Scroll to **Privacy** section
   - Tap **Blocked Users**
   - You should see the user you just blocked! ✅

3. **Unblock a user**:
   - Tap the green **Unblock** button
   - Confirm
   - User is removed from the list ✅

---

## 📋 **What the SQL Does:**

- ✅ Creates `user_blocks` table
- ✅ Sets up indexes for performance
- ✅ Enables Row Level Security (RLS)
- ✅ Creates RLS policies (users can only see their own blocks)
- ✅ Grants permissions

---

## 🎯 **After Setup:**

- ✅ Blocked users will be saved to the database
- ✅ Blocked users list will show in Settings → Blocked Users
- ✅ You can unblock users
- ✅ Blocked users won't be able to see your profile or match with you

---

**Go to Supabase Dashboard now and run the SQL!** 🚀

**File to copy:** `sql/create-user-blocks.sql`

