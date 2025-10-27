# 🆕 Start Fresh - Delete All Test Users

## ⚡ Quick Steps

### **1. Delete User Data (2 minutes)**

Copy and paste this in **Supabase SQL Editor**:

```sql
DELETE FROM messages;
DELETE FROM matches;
DELETE FROM swipes;
DELETE FROM swipe_counters;
DELETE FROM preferences;
DELETE FROM profiles;

SELECT '✅ Done! Now go to Authentication tab to delete users.' as message;
```

### **2. Delete Auth Users (2 minutes)**

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Select all users (checkbox at top)
3. Click **Delete selected users**
4. Confirm

### **3. Done! ✅**

Your database is now clean. Create your own accounts through the app!

---

## 🎯 Create Your Own Accounts

### **Through the App:**

1. Open your app
2. Click **Sign Up**
3. Enter email and password
4. Complete onboarding:
   - Name, age, gender
   - Bio and interests
   - Photos (if storage bucket is set up)
   - Preferences
5. Start swiping!

### **Recommended Test Setup:**

Create 2+ accounts with different genders to test matching:

```
Account 1: woman seeking man
Account 2: man seeking woman
```

Then swipe right on each other to create a match!

---

## 📄 Files Created

- **`delete-all-test-users.sql`** - SQL to delete all data
- **`DELETE-ALL-USERS-GUIDE.md`** - Detailed guide
- **This file** - Quick reference

---

## ⚠️ Remember

- This deletes **ALL users** permanently
- Cannot be undone
- Your app code and database schema stay intact
- You can create new accounts immediately after

---

## 🚀 After Deletion

Your app is ready for:
- ✅ Your own accounts
- ✅ Real users
- ✅ Production use
- ✅ Testing with real data

**Good luck with your app!** 🎉

