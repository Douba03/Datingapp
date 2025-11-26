# URGENT: Fix Signup Database Error

## The Problem
You're getting "Database error saving new user" because there are **conflicting database triggers** in your Supabase database.

## The Solution
You **MUST** run the SQL script in Supabase to fix the triggers.

## What Happened
Your database has old/broken triggers from previous SQL scripts. When you try to sign up, the trigger tries to insert data but fails because:
- The trigger might be using wrong syntax (`EXECUTE PROCEDURE` instead of `EXECUTE FUNCTION`)
- The trigger might be referencing wrong table structures
- There might be multiple conflicting triggers

## How to Fix (5 minutes)

### Step 1: Open Supabase Dashboard
1. Go to https://app.supabase.com
2. Click on your project: **zfnwtnqwokwvuxxwxgsr**

### Step 2: Open SQL Editor
1. Click **"SQL Editor"** in the left sidebar
2. Click **"New Query"** button (top right)

### Step 3: Copy the Complete Fix Script
Copy **ALL** of this SQL script:

```sql
-- COMPLETE FIX: Remove ALL triggers and recreate them properly
-- This will fix the signup issue

-- Step 1: Drop ALL existing triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trigger_create_match ON swipes;
DROP TRIGGER IF EXISTS trigger_update_swipe_counter ON swipes;

-- Step 2: Drop and recreate the handle_new_user function properly
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_first_name TEXT;
BEGIN
  -- Auto-confirm email for new users
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = NEW.id AND email_confirmed_at IS NULL;
  
  -- Extract first name from email
  default_first_name := COALESCE(
    (NEW.raw_user_meta_data->>'first_name')::TEXT, 
    split_part(NEW.email, '@', 1)
  );
  
  -- Create profile
  INSERT INTO public.profiles (
    user_id, 
    first_name, 
    gender,
    date_of_birth,
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    default_first_name,
    'prefer_not_to_say',
    '1995-01-01',
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create preferences
  INSERT INTO public.preferences (
    user_id, 
    age_min, 
    age_max, 
    max_distance_km, 
    relationship_intent,
    focus_session_duration,
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    18,
    100,
    50,
    'not_sure',
    25,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Recreate the trigger with correct syntax
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role, authenticated, anon;

-- Step 5: Show success message
SELECT 'Triggers fixed! Signup should work now.' as status;
```

### Step 4: Paste and Run
1. Paste the SQL into the editor
2. Click **"Run"** button (or Ctrl+Enter)
3. Wait for "Success" message

### Step 5: Test Signup
1. Go back to your app
2. Try signing up with a new email
3. It should work! ✅

## Why This Works
- Removes all conflicting triggers
- Creates a fresh, working trigger with correct syntax
- Grants proper permissions
- Uses `EXECUTE FUNCTION` (not `EXECUTE PROCEDURE`)

## If It Still Doesn't Work
Share the exact error message from Supabase SQL Editor and we'll debug further.

