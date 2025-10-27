# 🗑️ Delete All Test Users Guide

## ⚠️ WARNING
This will **permanently delete ALL users** and their data. This cannot be undone!

---

## 📋 Step-by-Step Instructions

### **Step 1: Delete User Data (SQL)**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New query**
5. Copy and paste this SQL:

```sql
-- Delete all user data
DELETE FROM messages;
DELETE FROM matches;
DELETE FROM swipes;
DELETE FROM swipe_counters;
DELETE FROM preferences;
DELETE FROM profiles;

SELECT '✅ All user data deleted!' as message;
```

6. Click **Run** (or press Ctrl+Enter)
7. You should see: `✅ All user data deleted!`

---

### **Step 2: Delete Auth Users (Dashboard)**

Now delete the actual user accounts:

1. In Supabase Dashboard, click **Authentication** in the left sidebar
2. Click **Users** tab
3. You'll see a list of all users with their emails
4. For each user:
   - Click the **⋮** (three dots) on the right
   - Click **Delete user**
   - Confirm deletion

**OR** use the bulk delete option:
- Select all users (checkbox at top)
- Click **Delete selected users**
- Confirm deletion

---

### **Step 3: Verify Deletion**

Run this SQL to verify everything is deleted:

```sql
SELECT 
  (SELECT COUNT(*) FROM profiles) as profiles,
  (SELECT COUNT(*) FROM preferences) as preferences,
  (SELECT COUNT(*) FROM swipes) as swipes,
  (SELECT COUNT(*) FROM matches) as matches,
  (SELECT COUNT(*) FROM messages) as messages,
  (SELECT COUNT(*) FROM swipe_counters) as swipe_counters;
```

All counts should be **0**.

---

## 🆕 Create Your Own Accounts

After deletion, you can create new accounts:

### **Option 1: Through the App (Recommended)**

1. Open your app
2. Click **Sign Up**
3. Enter your email and password
4. Complete the onboarding process:
   - Enter your name, date of birth, gender
   - Write your bio
   - Add interests
   - Upload photos (after you create the storage bucket)
   - Set your preferences
5. Start using the app!

### **Option 2: Through Supabase Dashboard**

1. Go to **Authentication** → **Users**
2. Click **Add user**
3. Enter email and password
4. Click **Create user**
5. Then complete the profile in the app

---

## 📝 Tips for Creating Accounts

### **For Testing Matching:**

Create at least 2 accounts with different genders:

**Account 1 (Woman):**
```
Email: yourname1@example.com
Password: YourPassword123!
Gender: woman
Seeking: man
```

**Account 2 (Man):**
```
Email: yourname2@example.com
Password: YourPassword123!
Gender: man
Seeking: woman
```

Then you can:
1. Login as Account 1, swipe right on Account 2
2. Login as Account 2, swipe right on Account 1
3. You'll get a match! 🎉

---

## 🔧 Quick Delete Script

I've created `delete-all-test-users.sql` with the complete SQL. Just:

1. Open Supabase SQL Editor
2. Copy the contents of `delete-all-test-users.sql`
3. Run it
4. Then delete users from Authentication tab

---

## ✅ What Gets Deleted

- ✅ All profiles
- ✅ All preferences
- ✅ All swipes
- ✅ All matches
- ✅ All messages
- ✅ All swipe counters
- ✅ All user accounts (after Step 2)

---

## 🛡️ What Stays

- ✅ Database schema (tables, functions, triggers)
- ✅ Storage bucket (if created)
- ✅ RLS policies
- ✅ Your app code

---

## 🚀 After Deletion

Your app will be **completely clean** and ready for you to:
- Create your own accounts
- Test with real data
- Invite real users
- Go live!

---

## ⚠️ Important Notes

1. **Cannot undo** - Once deleted, data is gone forever
2. **Delete auth users** - Must delete from Authentication tab separately
3. **Storage files** - If you uploaded photos, delete them from Storage tab
4. **Test first** - Make sure you want to delete everything

---

## 🆘 If Something Goes Wrong

If you accidentally delete too much or need to restore:

1. **Database schema** - Re-run `database-schema.sql`
2. **Functions** - Re-run `database-functions.sql`
3. **Test data** - Re-run `create-and-test-accounts.js`

---

## 📞 Ready to Delete?

1. ✅ Run the SQL from Step 1
2. ✅ Delete users from Authentication tab (Step 2)
3. ✅ Verify deletion (Step 3)
4. ✅ Create your own accounts!

**Your app will be fresh and clean!** 🎉

