-- =====================================================
-- FIX SIGNUP TRIGGER - Database error saving new user
-- =====================================================
-- This fixes the trigger that auto-creates users table entry
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Step 2: Create the function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into users table
  INSERT INTO public.users (id, email, auth_provider, onboarding_completed, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;

-- Verify trigger exists
SELECT 
  trigger_name,
  event_object_table,
  action_statement,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
