# 🔧 Troubleshooting White Screen Issue

## 🎯 Most Likely Cause

**The `user_warnings` table doesn't exist in your database yet!**

The SimpleWarningAlert component tries to query the `user_warnings` table. If it doesn't exist, the query fails and causes the app to crash (white screen).

---

## ✅ Solution: Run the SQL Migration

### Step 1: Open Supabase Dashboard

1. Go to https://supabase.com
2. Select your project
3. Click **SQL Editor** in the left sidebar

### Step 2: Run the Migration

1. Click **New Query**
2. Open the file: `sql/create-user-warnings.sql`
3. **Copy ALL the contents** (all 119 lines)
4. **Paste into Supabase SQL Editor**
5. Click **Run** (or press Ctrl+Enter)

### Step 3: Verify Success

You should see:
```
✅ User warnings table and functions created successfully!
```

### Step 4: Restart the App

1. In your terminal, press `Ctrl+C` to stop the app
2. Run `npm start` again
3. The white screen should be gone!

---

## 🔍 How to Verify the Table Exists

### Option 1: Supabase Dashboard

1. Go to **Table Editor** in Supabase
2. Look for `user_warnings` table in the list
3. If you see it, the migration worked!

### Option 2: SQL Query

Run this in SQL Editor:
```sql
SELECT * FROM user_warnings LIMIT 1;
```

- **If it works**: Table exists ✅
- **If error "relation does not exist"**: Table missing ❌

---

## 🐛 Other Possible Causes

### 1. Import Path Error

**Check:** Is the import path correct?
```typescript
import { SimpleWarningAlert } from '../../components/warnings/SimpleWarningAlert';
```

**Fix:** Make sure the path matches your file structure.

### 2. Missing Dependencies

**Check:** Are all packages installed?
```bash
npm install
```

### 3. Cache Issues

**Fix:** Clear Metro bundler cache:
```bash
npm start -- --reset-cache
```

Or:
```bash
npx expo start -c
```

### 4. TypeScript Errors

**Check:** Look for TypeScript errors in terminal

**Fix:** The component should have proper error handling now.

---

## 📊 Debug Steps

### Step 1: Check Console Logs

Look in your terminal for:
```
[SimpleWarningAlert] user_warnings table not found - please run the SQL migration
```

If you see this, the table doesn't exist.

### Step 2: Test Without the Component

Temporarily comment out the component:
```typescript
// In src/app/(tabs)/index.tsx
return (
  <SafeAreaView style={styles.container}>
    {/* <SimpleWarningAlert /> */}  {/* Comment this out */}
    <View style={styles.header}>
```

If the app works without it, the issue is definitely the missing table.

### Step 3: Check Supabase Connection

Make sure your `.env.local` has correct values:
```
EXPO_PUBLIC_SUPABASE_URL=your-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## ✅ Updated Component Features

The component now has better error handling:

1. **Graceful Failure** ✅
   - If table doesn't exist, it logs a message
   - App continues to work normally
   - No white screen

2. **Table Check** ✅
   - Detects if table is missing
   - Skips real-time subscription if table not ready
   - Prevents crashes

3. **Error Logging** ✅
   - All errors logged to console
   - Helps with debugging
   - Shows exact error messages

---

## 🎯 Quick Fix Checklist

- [ ] Run SQL migration (`sql/create-user-warnings.sql`)
- [ ] Verify `user_warnings` table exists in Supabase
- [ ] Restart the mobile app
- [ ] Check terminal for error messages
- [ ] Clear cache if needed (`npm start -- --reset-cache`)
- [ ] Verify `.env.local` has correct Supabase credentials

---

## 📱 Expected Behavior After Fix

### Without Warnings:
- App loads normally
- No alerts appear
- Console shows: `[SimpleWarningAlert] user_warnings table not found` (if table missing)
- OR: No errors (if table exists but no warnings)

### With Warnings:
- App loads normally
- Alert popup appears
- Shows warning message
- User can acknowledge
- App continues normally

---

## 🆘 Still Having Issues?

### Check These:

1. **Terminal Output**
   - Look for red error messages
   - Check for "relation does not exist"
   - Check for import errors

2. **Supabase Dashboard**
   - Verify project is active
   - Check API keys are correct
   - Verify table exists

3. **Network**
   - Make sure you have internet
   - Supabase needs to be reachable

4. **Code Changes**
   - Make sure you saved all files
   - Restart the dev server
   - Try clearing cache

---

## 💡 Pro Tips

### Tip 1: Run Migration First
Always run the SQL migration BEFORE adding the component to your app.

### Tip 2: Test in Stages
1. Run migration
2. Verify table exists
3. Add component
4. Test

### Tip 3: Check Logs
The component logs helpful messages:
- `[SimpleWarningAlert] user_warnings table not found` = Run migration
- `[SimpleWarningAlert] Error:` = Check the error details
- `[SimpleWarningAlert] Warning acknowledged` = It's working!

### Tip 4: Use Console
Open browser console (if testing on web) or check terminal logs for detailed error messages.

---

## ✅ Summary

**Most Common Issue:** Missing `user_warnings` table

**Solution:** Run `sql/create-user-warnings.sql` in Supabase SQL Editor

**Verification:** Check if table exists in Table Editor

**Result:** App works, warnings appear when issued

The component now handles missing tables gracefully, so even if you forget to run the migration, the app won't crash - it will just log a message and continue working normally.

