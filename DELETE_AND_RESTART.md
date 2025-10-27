# 🗑️ Delete Test Accounts & Start Fresh

## 🎯 Quick 3-Step Process

### **Step 1: Delete Old Accounts (2 minutes)**

1. **Go to Supabase Users page:**
   ```
   https://supabase.com/dashboard/project/zfnwtnqwokwvuxxwxgsr/auth/users
   ```

2. **You'll see a list of users**

3. **For EACH test account you created:**
   - Find the user (sarah.test@gmail.com, mike.test@gmail.com, etc.)
   - Click the **⋮** (three dots) on the right
   - Click **"Delete User"**
   - Click **"Confirm"**

4. **Repeat for all test accounts**

---

### **Step 2: Verify Email Confirmation is OFF (1 minute)**

1. **Go to Supabase Auth Settings:**
   ```
   https://supabase.com/dashboard/project/zfnwtnqwokwvuxxwxgsr/auth/settings
   ```

2. **Scroll to "Email Auth" section**

3. **Make SURE this is UNCHECKED:**
   ```
   ☐ Enable email confirmations  ← MUST BE UNCHECKED! ❌
   ```

4. **If it's checked, UNCHECK it and click "Save"**

---

### **Step 3: Create Fresh Accounts (5 minutes)**

Now create new accounts - these will work!

#### **Account #1 - Sarah:**

**In your normal browser:**
```
1. Go to: http://localhost:8082
2. Click "Sign Up"
3. Email: sarah.new@gmail.com
4. Password: test123456
5. Complete onboarding:
   - Name: Sarah
   - DOB: March 15, 1995 (or any date)
   - Gender: Woman
   - Upload 2+ photos
   - Bio: "Coffee lover and entrepreneur"
   - Interests: Select 3+ (Coffee, Entrepreneurship, Travel)
   - Preferences: 
     * Looking for: Men ← Important!
     * Age: 25-35
     * Distance: 50 km
6. Complete onboarding
7. Should STAY logged in! ✅
```

#### **Account #2 - Mike:**

**Open NEW incognito window** (`Ctrl + Shift + N`):
```
1. Go to: http://localhost:8082  
2. Click "Sign Up"
3. Email: mike.new@gmail.com
4. Password: test123456
5. Complete onboarding:
   - Name: Mike
   - DOB: July 22, 1992 (or any date)
   - Gender: Man
   - Upload 2+ photos
   - Bio: "Software engineer"
   - Interests: Select 3+ (Tech, Coffee, Fitness)
   - Preferences:
     * Looking for: Women ← Important!
     * Age: 23-35
     * Distance: 50 km
6. Complete onboarding
7. Should STAY logged in! ✅
```

---

## 🎮 **Step 4: Test Matching!**

**Now you have both accounts open in different windows!**

### **In Sarah's window (normal browser):**
```
1. Go to "Discover" tab
2. You should see Mike's profile!
3. Swipe RIGHT ❤️ (or click heart button)
```

### **In Mike's window (incognito):**
```
1. Go to "Discover" tab
2. You should see Sarah's profile!
3. Swipe RIGHT ❤️
```

### **🎉 MATCH!**

Both windows:
```
1. Go to "Matches" tab
2. You should see each other!
3. Click on the match
4. Try sending messages!
```

---

## ✅ **Success Checklist**

```
[ ] Deleted all old test accounts from Supabase
[ ] Verified email confirmation is OFF
[ ] Created Sarah's account (stays logged in!)
[ ] Created Mike's account in incognito (stays logged in!)
[ ] Both accounts in main app (not signed out)
[ ] Sarah can see Mike in Discover
[ ] Mike can see Sarah in Discover
[ ] Can swipe on each other
[ ] Match appears in Matches tab
[ ] Can open chat
[ ] Can send messages
```

---

## 🚨 **Common Issues & Solutions**

### Issue: Still getting signed out
**Solution:** 
- Make SURE email confirmation is disabled
- Clear browser cache (Ctrl+Shift+Delete)
- Try in fresh incognito window

### Issue: Can't see other profiles
**Solution:**
- Both accounts must have MATCHING preferences
- Sarah looking for "Men" → Mike is a "Man" ✅
- Mike looking for "Women" → Sarah is a "Woman" ✅
- Age ranges must overlap
- Use same or nearby city

### Issue: Can't delete users
**Solution:**
- Make sure you're in the right Supabase project
- You must be the owner/admin
- Try refreshing the page

---

## 📋 **Quick Reference**

### **Direct Links:**

**Delete Users:**
```
https://supabase.com/dashboard/project/zfnwtnqwokwvuxxwxgsr/auth/users
```

**Check Settings:**
```
https://supabase.com/dashboard/project/zfnwtnqwokwvuxxwxgsr/auth/settings
```

**Your App:**
```
http://localhost:8082
```

### **Test Accounts to Create:**

| Name | Email | Password | Gender | Looking For |
|------|-------|----------|--------|-------------|
| Sarah | sarah.new@gmail.com | test123456 | Woman | Men |
| Mike | mike.new@gmail.com | test123456 | Man | Women |

---

## 🎯 **After This Works:**

Once matching works, you can test:
- ✅ Swipe counter (should decrease)
- ✅ Different swipe actions (like/pass/superlike)
- ✅ Multiple matches
- ✅ Chat functionality
- ✅ Real-time message updates

---

**Start with Step 1: Delete old accounts in Supabase dashboard!**

The link: https://supabase.com/dashboard/project/zfnwtnqwokwvuxxwxgsr/auth/users

Then create fresh accounts and they WILL work! 🚀
