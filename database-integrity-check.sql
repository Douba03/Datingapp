-- DATABASE INTEGRITY CHECK
-- Run this in Supabase SQL Editor to verify everything is working correctly

-- 1. Check table structure
SELECT 
  'TABLE_STRUCTURE' as check_type,
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
ORDER BY table_name, ordinal_position;

-- 2. Check indexes
SELECT 
  'INDEXES' as check_type,
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

-- 3. Check foreign key constraints
SELECT 
  'FOREIGN_KEYS' as check_type,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 4. Check functions and triggers
SELECT 
  'FUNCTIONS' as check_type,
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- 5. Check triggers
SELECT 
  'TRIGGERS' as check_type,
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 6. Check RLS policies
SELECT 
  'RLS_POLICIES' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 7. Check for orphaned records (data integrity)
SELECT 
  'ORPHANED_CHECK' as check_type,
  'profiles without users' as issue,
  COUNT(*) as count
FROM profiles p
LEFT JOIN users u ON p.user_id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 
  'ORPHANED_CHECK',
  'preferences without users',
  COUNT(*)
FROM preferences p
LEFT JOIN users u ON p.user_id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 
  'ORPHANED_CHECK',
  'swipes without swiper',
  COUNT(*)
FROM swipes s
LEFT JOIN users u ON s.swiper_user_id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 
  'ORPHANED_CHECK',
  'swipes without target',
  COUNT(*)
FROM swipes s
LEFT JOIN users u ON s.target_user_id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 
  'ORPHANED_CHECK',
  'matches without user_a',
  COUNT(*)
FROM matches m
LEFT JOIN users u ON m.user_a_id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 
  'ORPHANED_CHECK',
  'matches without user_b',
  COUNT(*)
FROM matches m
LEFT JOIN users u ON m.user_b_id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 
  'ORPHANED_CHECK',
  'messages without sender',
  COUNT(*)
FROM messages m
LEFT JOIN users u ON m.sender_id = u.id
WHERE u.id IS NULL;

-- 8. Performance test - Check query execution plans
EXPLAIN (ANALYZE, BUFFERS) 
SELECT p.*, pr.seeking_genders, pr.age_min, pr.age_max
FROM profiles p
LEFT JOIN preferences pr ON p.user_id = pr.user_id
WHERE p.gender = 'woman' 
  AND p.age BETWEEN 25 AND 35
  AND p.city = 'New York'
LIMIT 10;

-- 9. Check swipe counter functionality
SELECT 
  'SWIPE_COUNTERS' as check_type,
  COUNT(*) as total_counters,
  AVG(remaining) as avg_remaining,
  MIN(remaining) as min_remaining,
  MAX(remaining) as max_remaining
FROM swipe_counters;

SELECT 'Database integrity check completed!' as message;
