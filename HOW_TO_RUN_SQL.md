# How to Run the SQL Fix

## Step 1: Open Supabase Dashboard
1. Go to https://app.supabase.com
2. Sign in to your account
3. Select your project: **zfnwtnqwokwvuxxwxgsr**

## Step 2: Open SQL Editor
1. In the left sidebar, click **"SQL Editor"**
2. Click **"New Query"** (top right)

## Step 3: Copy and Paste the SQL
1. Open the file `complete-auth-setup.sql` in this project
2. Copy **ALL** the contents (Ctrl+A, then Ctrl+C)
3. Paste into the Supabase SQL Editor (Ctrl+V)

## Step 4: Run the Script
1. Click **"Run"** button (or press Ctrl+Enter)
2. Wait for execution to complete (should take 1-2 seconds)
3. You should see: **"Success. No rows returned"**

## Step 5: Verify It Worked
Look for these messages in the results:
- ✅ `Authentication setup complete!`
- ✅ `user_confirmed: true`

## Step 6: Test in Your App
1. Go back to your app
2. Try to sign up with a new email
3. It should work now! 🎉

## What This Script Does
- ✅ Fixes database schema mismatches
- ✅ Creates trigger to auto-create profiles and preferences
- ✅ Sets up proper security policies
- ✅ Grants necessary permissions
- ✅ Auto-confirms your email

## Common Errors

### "relation already exists"
- This is OK! The script uses `CREATE TABLE IF NOT EXISTS`
- It won't break if tables already exist

### "trigger already exists"
- This is OK! The script uses `DROP TRIGGER IF EXISTS`
- It will replace the old trigger with the fixed one

### "policy already exists"
- This is OK! The script uses `DROP POLICY IF EXISTS`
- It will replace old policies with new ones

## Need Help?
If you still see "Database error saving new user" after running this:
1. Check the Supabase SQL Editor for any error messages
2. Share the error message with me
3. We'll fix it together!

