-- =====================================================
-- CHECK USERS TABLE STRUCTURE
-- =====================================================
-- This checks if users table exists and has correct columns
-- =====================================================

-- Check if users table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'users'
) as users_table_exists;

-- Check users table columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Check if there's a trigger to auto-create users
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
   OR trigger_name LIKE '%user%';

-- Check existing users
SELECT 
  id,
  email,
  auth_provider,
  onboarding_completed,
  created_at
FROM users
ORDER BY created_at DESC
LIMIT 5;
