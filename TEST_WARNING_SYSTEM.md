# 🧪 Testing Guide: End-to-End Warning System

## 🚀 Both Apps Are Now Running!

- **Admin Dashboard**: http://localhost:3001
- **Mobile App**: http://localhost:8082

---

## 📋 Test Scenario: Complete Flow

### Step 1: Admin Sends Warning

1. **Open Admin Dashboard**
   - Go to: http://localhost:3001
   - Login with: `admin@test.com` + password

2. **Navigate to Users**
   - Click "Users" in sidebar
   - You'll see all registered users

3. **Find Test User**
   - Search for: `kvinna@test.com` (or any user)
   - Click the **"Warn"** button (⚠️)

4. **Send Warning**
   - Reason: Select "HARAM" (or any reason)
   - Message: "Testing warning system"
   - Click **"Send Warning"**
   - ✅ Success message appears

---

### Step 2: User Receives Warning

1. **Open Mobile App**
   - Go to: http://localhost:8082
   - Scan QR code or press 'w' for web

2. **Log In as Test User**
   - Email: `kvinna@test.com`
   - Password: (the test user password)

3. **Watch Console Logs**
   ```
   [SimpleWarningAlert] User logged in, waiting 2 seconds...
   [Wait 2 seconds...]
   [SimpleWarningAlert] Starting check for user: xxx
   [SimpleWarningAlert] ✅ Query successful, found 1 warnings
   ```

4. **Alert Popup Appears!**
   - After 2 seconds
   - Shows warning message
   - Shows reason and admin message
   - Has "OK" button

5. **Acknowledge Warning**
   - Click "OK" button
   - Alert closes
   - ✅ Warning acknowledged in database

---

## 🎯 What to Test

### Test 1: Basic Warning Flow ✅

**Steps:**
1. Admin warns user from dashboard
2. User logs in to mobile app
3. Wait 2 seconds
4. Alert popup appears
5. User clicks "OK"

**Expected:**
- ✅ Alert appears after 2 seconds
- ✅ Correct message and reason shown
- ✅ Alert closes on "OK"
- ✅ Console logs are clean

---

### Test 2: Multiple Warnings ✅

**Steps:**
1. Admin sends **2 warnings** to same user
2. User logs in
3. First alert appears
4. User clicks "OK"
5. Second alert appears (if not acknowledged)

**Expected:**
- ✅ First warning shows
- ✅ After acknowledging, second warning shows
- ✅ Both can be acknowledged

---

### Test 3: Real-Time Warning ✅

**Steps:**
1. User is **already logged in**
2. Admin sends warning
3. Alert appears **immediately** (no 2-second delay)

**Expected:**
- ✅ No delay for real-time warnings
- ✅ Alert appears instantly
- ✅ Real-time subscription works

---

### Test 4: No Warnings ✅

**Steps:**
1. User with **no warnings** logs in
2. Wait 2 seconds
3. No alert appears

**Expected:**
- ✅ App works normally
- ✅ No errors in console
- ✅ User can use app

---

## 🔍 What to Look For

### ✅ Success Indicators:

1. **Admin Dashboard:**
   - ✅ Can send warnings
   - ✅ Success message appears
   - ✅ User table updates

2. **Mobile App:**
   - ✅ Alert appears after login (2 seconds)
   - ✅ Alert shows correct message
   - ✅ "OK" button works
   - ✅ Alert closes properly

3. **Console Logs:**
   - ✅ No errors
   - ✅ Clear flow of events
   - ✅ Success messages

### ❌ Red Flags:

- ❌ White screen
- ❌ App crashes
- ❌ Alert doesn't appear
- ❌ Errors in console
- ❌ Can't acknowledge warning

---

## 📱 Console Commands (While Testing)

### View Admin Dashboard Logs:
```bash
# The admin dashboard terminal will show:
[warn-user] Admin: admin@test.com warning user: xxx
[warn-user] Success: { warning_id: xxx, total_warnings: 1 }
```

### View Mobile App Logs:
```bash
# The mobile app terminal and browser console will show:
[SimpleWarningAlert] User logged in, waiting 2 seconds...
[SimpleWarningAlert] Starting check for user: xxx
[SimpleWarningAlert] ✅ Query successful, found 1 warnings
```

---

## 🎨 User Flow Diagram

```
┌─────────────────────────────────────────┐
│         ADMIN DASHBOARD                 │
│  http://localhost:3001/dashboard/users  │
└─────────────┬───────────────────────────┘
              │
              │ 1. Admin clicks "Warn"
              │ 2. Selects reason: HARAM
              │ 3. Types message
              │ 4. Clicks "Send Warning"
              │
              ▼
┌─────────────────────────────────────────┐
│         SUPABASE DATABASE               │
│     Table: user_warnings                │
└─────────────┬───────────────────────────┘
              │
              │ Real-time subscription
              │
              ▼
┌─────────────────────────────────────────┐
│         MOBILE APP                      │
│  http://localhost:8082                  │
│                                         │
│  1. User logs in                        │
│  2. [Wait 2 seconds]                    │
│  3. Check for warnings                  │
│  4. Alert popup appears                 │
│  5. User clicks "OK"                    │
│  6. Warning acknowledged                │
└─────────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### Problem: Alert doesn't appear

**Check:**
1. User has warnings in database
2. User is logged in
3. Wait full 2 seconds
4. Check console for errors

**Fix:**
```bash
# Check warnings in database
# Go to Supabase Dashboard → Table Editor → user_warnings
```

---

### Problem: App crashes (white screen)

**Check:**
1. Console for errors
2. `user_warnings` table exists in Supabase

**Fix:**
```bash
# Run the SQL script
# sql/create-user-warnings.sql
```

---

### Problem: Admin can't send warning

**Check:**
1. Admin dashboard is running
2. Admin is logged in
3. User exists in database

**Fix:**
```bash
# Restart admin dashboard
cd admin
npm run dev
```

---

## ✅ Success Criteria

Your warning system is working if:

1. ✅ Admin can send warnings from dashboard
2. ✅ User sees alert 2 seconds after login
3. ✅ Alert shows correct message and reason
4. ✅ User can acknowledge warning
5. ✅ Alert closes properly
6. ✅ Real-time warnings work instantly
7. ✅ No errors in console
8. ✅ Mobile app doesn't crash

---

## 🎉 Test Checklist

- [ ] Admin dashboard loads
- [ ] Can login as admin
- [ ] Can navigate to Users page
- [ ] Can find test user
- [ ] Can click "Warn" button
- [ ] Can select reason
- [ ] Can type message
- [ ] Can send warning
- [ ] Success message appears
- [ ] Mobile app loads
- [ ] Can login as test user
- [ ] Wait 2 seconds
- [ ] Alert popup appears
- [ ] Alert shows correct info
- [ ] Can click "OK"
- [ ] Alert closes
- [ ] No errors in console
- [ ] App continues to work

---

## 🚀 Ready to Test!

**Admin Dashboard**: http://localhost:3001
**Mobile App**: http://localhost:8082

**Test User**: `kvinna@test.com`
**Admin**: `admin@test.com`

**Start with Test 1 above and work your way through!** 🎯

