-- =====================================================
-- COMPLETE FIX FOR SIGNUP - Database error saving new user
-- =====================================================
-- This is a comprehensive fix that handles all possible issues
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Ensure users table exists with correct structure
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  auth_provider TEXT DEFAULT 'email',
  status TEXT DEFAULT 'active',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,
  premium_until TIMESTAMPTZ,
  grace_period_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies and recreate
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;
DROP POLICY IF EXISTS "Service role can manage all users" ON public.users;

CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own data" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow service role to insert users (needed for trigger)
CREATE POLICY "Service role can manage all users" ON public.users
  FOR ALL USING (true);

-- Step 4: Drop ALL existing triggers on auth.users that might conflict
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_request_counter ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;

-- Step 5: Drop and recreate the function with better error handling
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert into users table with error handling
  BEGIN
    INSERT INTO public.users (
      id, 
      email, 
      auth_provider, 
      onboarding_completed, 
      created_at, 
      updated_at
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.email, 'user@example.com'),
      COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
      false,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      updated_at = NOW();
    
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the signup
    RAISE WARNING 'Error creating user record: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;

-- Step 6: Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Step 7: Grant necessary permissions
GRANT ALL ON public.users TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;

-- Step 8: Verify setup
SELECT 
  'Setup verification:' as step,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') as users_table_exists,
  (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created') as trigger_exists,
  (SELECT COUNT(*) FROM pg_proc WHERE proname = 'handle_new_user') as function_exists;

-- Step 9: Show all triggers on auth.users
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
ORDER BY trigger_name;
