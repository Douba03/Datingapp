# 🐛 Login Debugging Guide

## Debug Features Added

### 1. **Login Page Debug Panel**
- Shows real-time debug messages on the login screen
- Displays all steps of the authentication process
- Shows user metadata and admin check results

### 2. **Console Logging**
- All debug messages are logged to browser console
- Server-side logs appear in the terminal
- Detailed error messages with stack traces

### 3. **API Debug Info**
- `/api/auth/check-admin` returns debug information
- Shows user ID, timestamp, and error details

---

## How to Debug Login Issues

### Step 1: Open Browser Console
1. Go to http://localhost:3001
2. Press `F12` or `Ctrl + Shift + I` to open DevTools
3. Go to the **Console** tab

### Step 2: Try to Login
1. Enter your credentials
2. Click "Sign In"
3. Watch the debug panel on screen AND the console

### Step 3: Check Terminal
1. Look at your terminal where `npm run dev` is running
2. You'll see detailed server-side logs

---

## What to Look For

### ✅ Successful Login Flow:
```
[LOGIN DEBUG] Starting login for email: admin@test.com
[LOGIN DEBUG] ✅ Sign in successful!
[LOGIN DEBUG] User ID: abc-123-def
[LOGIN DEBUG] User email: admin@test.com
[LOGIN DEBUG] Session exists: true
[LOGIN DEBUG] Checking admin status...
[LOGIN DEBUG] Admin check response status: 200
[LOGIN DEBUG] Admin check result: {"isAdmin":true,...}
[LOGIN DEBUG] ✅ User is admin! Redirecting to dashboard...
```

### ❌ Failed Login - Wrong Password:
```
[LOGIN DEBUG] Starting login for email: admin@test.com
[LOGIN DEBUG] ❌ Sign in error: Invalid login credentials
[LOGIN DEBUG] Error code: 400
```

### ❌ Failed Login - Not Admin:
```
[LOGIN DEBUG] ✅ Sign in successful!
[LOGIN DEBUG] User ID: abc-123
[LOGIN DEBUG] ❌ User is not admin
[LOGIN DEBUG] User metadata: {"provider":"email","providers":["email"]}
```

---

## Common Issues and Solutions

### Issue 1: "Invalid login credentials"
**Cause:** Wrong email or password

**Solution:**
1. Check you're using the correct email
2. Reset password in Supabase:
```sql
UPDATE auth.users 
SET encrypted_password = crypt('NewPassword123', gen_salt('bf'))
WHERE email = 'admin@test.com';
```

### Issue 2: "You do not have admin access"
**Cause:** User doesn't have admin role

**Solution:**
Check the debug log for "User metadata". If it doesn't show `"roles": ["admin"]`, run:
```sql
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{roles}',
  '["admin"]'::jsonb
)
WHERE email = 'admin@test.com';
```

### Issue 3: "No session created"
**Cause:** Email not confirmed

**Solution:**
```sql
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email = 'admin@test.com';
```

---

## Server-Side Debug Logs

In your terminal, you'll see:

```
[check-admin] Request received
[check-admin] User ID: abc-123-def
[check-admin] Checking admin status...
[isAdmin] Checking admin status for user: abc-123-def
[isAdmin] User email: admin@test.com
[isAdmin] User app_metadata: {"provider":"email","providers":["email"],"roles":["admin"]}
[isAdmin] ADMIN_EMAILS env var: admin@test.com
[isAdmin] Parsed admin emails: ["admin@test.com"]
[isAdmin] ✅ User email matches ADMIN_EMAILS
[check-admin] Admin status result: true
```

---

## Quick Diagnostic Checklist

Run this SQL to check everything:

```sql
-- Check user exists and is confirmed
SELECT 
  email,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ NOT CONFIRMED'
    ELSE '✅ Confirmed'
  END as confirmation,
  raw_app_meta_data,
  created_at
FROM auth.users
WHERE email = 'admin@test.com';

-- Check .env.local has correct ADMIN_EMAILS
-- (Check in your file: admin/.env.local)

-- Verify user has admin role
SELECT 
  email,
  raw_app_meta_data -> 'roles' as roles,
  CASE 
    WHEN raw_app_meta_data -> 'roles' ? 'admin' THEN '✅ Has admin role'
    ELSE '❌ No admin role'
  END as status
FROM auth.users
WHERE email = 'admin@test.com';
```

---

## Next Steps

1. **Try logging in** with the debug features enabled
2. **Copy the debug output** from the screen and console
3. **Share the logs** if you need help troubleshooting
4. **Check the terminal** for server-side errors

The debug panel will show you exactly where the login process is failing!

