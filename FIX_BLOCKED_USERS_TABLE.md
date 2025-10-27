# 🔧 Fix Blocked Users Table

## ❌ **Problem:**
The `user_blocks` table is partially created (policies exist but table doesn't). This is causing the "column user_blocks.id does not exist" error.

---

## ✅ **Solution: Run the Fix SQL (1 minute)**

### **Step 1: Open Supabase Dashboard**
1. Go to: https://supabase.com/dashboard
2. Select your project

### **Step 2: Open SQL Editor**
1. Click **"SQL Editor"** in the left sidebar
2. Click **"New Query"**

### **Step 3: Copy & Paste the Fix SQL**
1. Open the file: `sql/fix-user-blocks.sql`
2. **Copy ALL the SQL** (entire file)
3. **Paste** it into the SQL Editor

### **Step 4: Run the SQL**
1. Click **"Run"** button (or press `Ctrl + Enter`)
2. Wait for it to complete
3. You should see:
   ```
   ✅ "user_blocks table created successfully!"
   ✅ "Total columns: 4"
   ```

---

## 🧪 **Step 5: Verify It Worked**

Run this in your terminal:
```bash
node test-blocked-users.js
```

You should now see:
```
✅ user_blocks table exists!
✅ Found 0 blocked user(s)
🎉 Blocked Users setup is complete!
```

---

## 📱 **Step 6: Test in the App**

1. **Refresh your browser** (Ctrl + Shift + R)
2. **Block a user** from chat
3. Go to **Settings → Blocked Users**
4. You should see the blocked user! ✅

---

## 🎯 **What This SQL Does:**

1. ✅ Drops old policies (that were created without the table)
2. ✅ Drops old indexes (if any)
3. ✅ Drops old table (if it exists)
4. ✅ Creates fresh `user_blocks` table
5. ✅ Creates indexes for performance
6. ✅ Enables RLS
7. ✅ Creates RLS policies
8. ✅ Grants permissions
9. ✅ Verifies creation

---

**Run the SQL from `sql/fix-user-blocks.sql` in Supabase now!** 🚀

