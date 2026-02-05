-- =====================================================
-- CHECK IF HIDDEN_PROFILES TABLE EXISTS
-- =====================================================
-- Run this first to see if the table exists
-- =====================================================

-- Check if hidden_profiles table exists
SELECT 
  'Table Exists Check' as check_type,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name = 'hidden_profiles';

-- If table exists, check its structure
SELECT 
  'Hidden Profiles Columns' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'hidden_profiles'
ORDER BY ordinal_position;

-- Check if hide_profile function exists
SELECT 
  'Functions Check' as check_type,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name IN ('hide_profile', 'unhide_profile', 'is_profile_hidden');

-- Check RLS policies on hidden_profiles
SELECT 
  'Hidden Profiles RLS Policies' as check_type,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'hidden_profiles';

-- If table exists, show sample data
SELECT 
  'Sample Hidden Profiles' as check_type,
  h.id,
  h.user_id,
  h.hidden_user_id,
  h.reason,
  h.created_at,
  u1.first_name as user_name,
  u2.first_name as hidden_profile_name
FROM hidden_profiles h
LEFT JOIN profiles u1 ON h.user_id = u1.user_id
LEFT JOIN profiles u2 ON h.hidden_user_id = u2.user_id
ORDER BY h.created_at DESC
LIMIT 5;
