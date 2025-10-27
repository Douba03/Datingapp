-- Check if matches were created from mutual swipes
-- Run this in Supabase SQL Editor

-- 1. Check all swipes
SELECT 
  'SWIPES' as type,
  s.swiper_user_id,
  s.target_user_id,
  s.action,
  s.created_at,
  p1.first_name as swiper_name,
  p2.first_name as target_name
FROM swipes s
LEFT JOIN profiles p1 ON s.swiper_user_id = p1.user_id
LEFT JOIN profiles p2 ON s.target_user_id = p2.user_id
ORDER BY s.created_at DESC;

-- 2. Check all matches
SELECT 
  'MATCHES' as type,
  m.id,
  m.user_a_id,
  m.user_b_id,
  m.status,
  m.created_at,
  p1.first_name as user_a_name,
  p2.first_name as user_b_name
FROM matches m
LEFT JOIN profiles p1 ON m.user_a_id = p1.user_id
LEFT JOIN profiles p2 ON m.user_b_id = p2.user_id
ORDER BY m.created_at DESC;

-- 3. Check for mutual likes (should have created matches)
WITH mutual_likes AS (
  SELECT 
    s1.swiper_user_id as user1,
    s1.target_user_id as user2,
    s1.action as action1,
    s2.action as action2,
    s1.created_at as swipe1_time,
    s2.created_at as swipe2_time
  FROM swipes s1
  JOIN swipes s2 ON s1.target_user_id = s2.swiper_user_id 
    AND s1.swiper_user_id = s2.target_user_id
  WHERE s1.action IN ('like', 'superlike')
    AND s2.action IN ('like', 'superlike')
    AND s1.swiper_user_id < s2.swiper_user_id -- Avoid duplicates
)
SELECT 
  'MUTUAL LIKES' as type,
  ml.user1,
  ml.user2,
  ml.action1,
  ml.action2,
  ml.swipe1_time,
  ml.swipe2_time,
  p1.first_name as user1_name,
  p2.first_name as user2_name
FROM mutual_likes ml
LEFT JOIN profiles p1 ON ml.user1 = p1.user_id
LEFT JOIN profiles p2 ON ml.user2 = p2.user_id;

-- 4. Check if the database functions exist
SELECT 
  'FUNCTIONS' as type,
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('record_swipe', 'create_match_on_mutual_like')
ORDER BY routine_name;

-- 5. Check if triggers exist
SELECT 
  'TRIGGERS' as type,
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND trigger_name IN ('trigger_create_match', 'trigger_update_swipe_counter')
ORDER BY trigger_name;
