# 🧪 Test Warning System NOW - Step by Step

## ✅ Both Apps Restarted with Fixed Imports!

**Admin Dashboard**: http://localhost:3001
**Mobile App**: http://localhost:8082

---

## 🎯 Test Flow for 123@test.com

### Step 1: Verify User Exists in Admin Dashboard

1. **Open admin dashboard**: http://localhost:3001
2. **Login**: `admin@test.com` + password
3. **Go to Users page**
4. **Look for**: `123@test.com`
   - ✅ If you see it: Good! User is registered
   - ❌ If you don't: The signup didn't complete properly

---

### Step 2: Send Warning from Admin

1. **Find** `123@test.com` in the users list
2. **Click "Warn"** button
3. **Fill form**:
   - Reason: Select any (e.g., "INAPPROPRIATE_CONTENT")
   - Message: "Test warning - please acknowledge"
4. **Click "Send Warning"**
5. **Watch for success message**

**Check admin terminal** for:
```
[warn-user] Admin: admin@test.com warning user: [user-id]
[warn-user] Success: { warning_id: xxx, total_warnings: 1 }
```

---

### Step 3: Login to Mobile App & Watch Console

1. **Open mobile app**: http://localhost:8082
2. **Press 'w' for web** or scan QR code
3. **Open browser console** (F12 → Console tab)
4. **Login as**: `123@test.com` + password

**Watch console logs for:**
```
[SimpleWarningAlert] User logged in, waiting 2 seconds before checking warnings...
[Wait 2 seconds...]
[SimpleWarningAlert] Starting check for user: xxx
[SimpleWarningAlert] ✅ Query successful, found X warnings
```

5. **After 2 seconds**: Alert popup should appear! ✅

---

## 🔍 Debugging Steps

### If No Alert Appears:

#### Check 1: Console Logs
Open browser console (F12) and look for:

**✅ Good signs:**
```
[SimpleWarningAlert] User logged in, waiting 2 seconds...
[SimpleWarningAlert] Starting check for user: xxx
[SimpleWarningAlert] ✅ Query successful, found 1 warnings
```

**❌ Bad signs:**
```
[SimpleWarningAlert] No user, skipping
[SimpleWarningAlert] ❌ Error: ...
[SimpleWarningAlert] Component error: ...
```

#### Check 2: User is Logged In
```
// In browser console, run:
JSON.parse(localStorage.getItem('sb-zfnwtnqwokwvuxxwxgsr-auth-token'))?.user?.email
// Should return: "123@test.com"
```

#### Check 3: Warning Exists in Database
Create this script `check-user-warning.js`:
```javascript
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function checkWarning() {
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', '123@test.com')
    .single();

  console.log('User ID:', user?.id);

  const { data: warnings } = await supabase
    .from('user_warnings')
    .select('*')
    .eq('user_id', user?.id);

  console.log('Warnings:', warnings);
}

checkWarning();
```

Run: `node check-user-warning.js`

---

## 📊 Expected Full Flow

```
1. Admin Dashboard
   ↓
   Opens Users page
   ↓
   Finds 123@test.com
   ↓
   Clicks "Warn"
   ↓
   Sends warning
   ↓
   ✅ Success message

2. Database
   ↓
   Warning stored in user_warnings table
   ↓
   Real-time notification sent

3. Mobile App
   ↓
   User logs in as 123@test.com
   ↓
   SimpleWarningAlert component activates
   ↓
   Waits 2 seconds
   ↓
   Queries user_warnings table
   ↓
   Finds warning
   ↓
   ✅ Shows alert popup
```

---

## 🎨 What the Alert Should Look Like

```
┌─────────────────────────────────┐
│  ⚠️  Warning from Admin         │
├─────────────────────────────────┤
│                                 │
│  You have received a warning    │
│  from the moderation team.      │
│                                 │
│  Reason:                        │
│  INAPPROPRIATE_CONTENT          │
│                                 │
│  Message:                       │
│  Test warning - please          │
│  acknowledge                    │
│                                 │
│           [ OK ]                │
└─────────────────────────────────┘
```

---

## 🚨 Common Issues & Fixes

### Issue 1: "No user, skipping"
**Cause**: Not logged in
**Fix**: Make sure you're logged in as 123@test.com

### Issue 2: White screen
**Cause**: Import error or component crash
**Fix**: Check browser console for errors

### Issue 3: "Query successful, found 0 warnings"
**Cause**: Warning not in database or wrong user ID
**Fix**: 
1. Check admin sent warning to correct user
2. Run database check script
3. Verify user IDs match

### Issue 4: No console logs at all
**Cause**: Component not mounted
**Fix**: 
1. Check `src/app/(tabs)/index.tsx` has `<SimpleWarningAlert />`
2. Restart app

---

## ✅ Success Checklist

- [ ] Admin dashboard shows 123@test.com in users list
- [ ] Can click "Warn" button
- [ ] Can send warning
- [ ] Success message appears in admin dashboard
- [ ] Admin terminal shows `[warn-user] Success`
- [ ] Mobile app loads (no white screen)
- [ ] Can login as 123@test.com
- [ ] Browser console shows waiting 2 seconds
- [ ] Browser console shows "Query successful"
- [ ] Alert popup appears after 2 seconds
- [ ] Alert shows correct message
- [ ] Can click "OK" button
- [ ] Alert closes

---

## 🎉 If Everything Works

You should see:
1. ✅ Admin sends warning
2. ✅ Mobile app shows alert after 2 seconds
3. ✅ User acknowledges warning
4. ✅ System works end-to-end!

---

## 📞 Next Steps

If it's still not working:
1. Share browser console logs
2. Share admin terminal output
3. Share mobile app terminal output
4. Check if 123@test.com exists in Supabase Dashboard → Authentication → Users

**Test now and let me know what you see!** 🚀

