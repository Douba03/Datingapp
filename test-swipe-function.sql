-- Test if the record_swipe function works
-- Run this in Supabase SQL Editor

-- 1. Check if function exists
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'record_swipe';

-- 2. Test the function with dummy data
SELECT record_swipe(
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  'like'
);

-- 3. Check if triggers exist
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND trigger_name = 'trigger_create_match';

-- 4. Check current swipes
SELECT 
  s.swiper_user_id,
  s.target_user_id,
  s.action,
  s.created_at,
  p1.first_name as swiper_name,
  p2.first_name as target_name
FROM swipes s
LEFT JOIN profiles p1 ON s.swiper_user_id = p1.user_id
LEFT JOIN profiles p2 ON s.target_user_id = p2.user_id
ORDER BY s.created_at DESC
LIMIT 5;
