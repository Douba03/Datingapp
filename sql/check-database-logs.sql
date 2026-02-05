-- =====================================================
-- CHECK DATABASE LOGS AND TRIGGER ERRORS
-- =====================================================
-- This helps diagnose why the signup trigger is failing
-- =====================================================

-- Check 1: Verify users table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check 2: Check if users table has any constraints that might fail
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass;

-- Check 3: Test if we can manually insert into users table
-- This will show if there's a constraint or column issue
DO $$
BEGIN
  -- Try to insert a test user
  INSERT INTO public.users (id, email, auth_provider, onboarding_completed, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'test_manual@example.com',
    'email',
    false,
    NOW(),
    NOW()
  );
  
  RAISE NOTICE '✅ Manual insert into users table SUCCESS';
  
  -- Clean up test data
  DELETE FROM public.users WHERE email = 'test_manual@example.com';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Manual insert FAILED: %', SQLERRM;
END $$;

-- Check 4: Verify trigger function exists and is correct
SELECT 
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
WHERE p.proname = 'handle_new_user';

-- Check 5: Check if there are any other triggers on auth.users that might conflict
SELECT 
  trigger_name,
  event_object_table,
  action_statement,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
ORDER BY trigger_name;
