-- =====================================================
-- VERIFY SIGNUP SETUP
-- =====================================================
-- Run this AFTER fix-signup-trigger.sql to verify everything works
-- =====================================================

-- Check 1: Verify users table exists
SELECT 
  'Users table exists: ' || 
  CASE WHEN EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'users'
  ) THEN '✅ YES' ELSE '❌ NO' END as status;

-- Check 2: Verify trigger exists
SELECT 
  'Signup trigger exists: ' || 
  CASE WHEN EXISTS (
    SELECT FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created'
  ) THEN '✅ YES' ELSE '❌ NO' END as status;

-- Check 3: Verify function exists
SELECT 
  'Handle new user function exists: ' || 
  CASE WHEN EXISTS (
    SELECT FROM pg_proc 
    WHERE proname = 'handle_new_user'
  ) THEN '✅ YES' ELSE '❌ NO' END as status;

-- Check 4: Show trigger details
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Check 5: Count existing users
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN onboarding_completed = true THEN 1 END) as completed_onboarding,
  COUNT(CASE WHEN onboarding_completed = false THEN 1 END) as pending_onboarding
FROM users;
