# 🚀 How to Run SQL Migration in Supabase

## ⚠️ You Need to Do This Once!

The notification settings won't work until you create the database table.

---

## 📋 **Step-by-Step Instructions:**

### **Step 1: Open Supabase Dashboard**
1. Go to: https://supabase.com/dashboard
2. Sign in to your account
3. Select your project: **zfnwtnqwokwvuxxwxgsr**

### **Step 2: Open SQL Editor**
1. Click **"SQL Editor"** in the left sidebar
2. Click **"New query"** button

### **Step 3: Copy the SQL**
1. Open the file: `RUN_THIS_SQL_IN_SUPABASE.sql`
2. Copy **ALL** the content (Ctrl+A, Ctrl+C)

### **Step 4: Paste and Run**
1. Paste the SQL into the Supabase SQL Editor
2. Click the **"Run"** button (or press Ctrl+Enter)

### **Step 5: Verify Success**
You should see:
```
Success. No rows returned
```

---

## ✅ **What This Does:**

1. ✅ Creates `notification_preferences` table
2. ✅ Sets up security policies (RLS)
3. ✅ Creates trigger for new users
4. ✅ Adds preferences for ALL existing users
5. ✅ Creates database indexes

---

## 🎯 **After Running:**

1. Go back to your app
2. Go to **Settings** tab
3. Try toggling the notification switches
4. Should work now! ✅

---

## 🐛 **If You Get an Error:**

### **"relation already exists"**
- Table already exists, that's fine!
- The migration handles this with `IF NOT EXISTS`

### **"permission denied"**
- Make sure you're logged in as the project owner
- Check you selected the correct project

### **Still not working?**
- Refresh your app (Ctrl+R or reload)
- Check the browser console for errors
- Make sure you're logged in to the app

---

## 📸 **Visual Guide:**

```
Supabase Dashboard
├── SQL Editor (click here)
│   └── New query (click here)
│       └── Paste SQL here
│       └── Click "Run" button
└── Success! ✅
```

---

## 🔍 **To Verify Table Was Created:**

1. In Supabase Dashboard
2. Click **"Table Editor"** in left sidebar
3. Look for **"notification_preferences"** table
4. You should see it with columns:
   - user_id
   - push_enabled
   - match_notifications
   - message_notifications
   - like_notifications
   - created_at
   - updated_at

---

**Run the SQL now and let me know if it works!** 🚀

