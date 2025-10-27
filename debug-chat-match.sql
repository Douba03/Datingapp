-- Debug chat match and messages
-- Run this in Supabase SQL Editor

-- 1. Get the match ID and details
SELECT 
  'MATCH_DETAILS' as info,
  m.id as match_id,
  m.user_a_id,
  m.user_b_id,
  m.created_at,
  p1.first_name as user_a_name,
  p2.first_name as user_b_name
FROM matches m
JOIN profiles p1 ON m.user_a_id = p1.user_id
JOIN profiles p2 ON m.user_b_id = p2.user_id
ORDER BY m.created_at DESC
LIMIT 1;

-- 2. Get messages for the first match
SELECT 
  'MESSAGES_FOR_MATCH' as info,
  msg.id as message_id,
  msg.match_id,
  msg.body,
  msg.sender_id,
  msg.created_at,
  p.first_name as sender_name
FROM messages msg
JOIN matches m ON msg.match_id = m.id
LEFT JOIN profiles p ON msg.sender_id = p.user_id
ORDER BY msg.created_at DESC
LIMIT 5;

-- 3. Test query that the app should use
SELECT 
  'APP_QUERY_TEST' as info,
  msg.*,
  p.first_name as sender_name
FROM messages msg
LEFT JOIN profiles p ON msg.sender_id = p.user_id
WHERE msg.match_id = (
  SELECT id FROM matches ORDER BY created_at DESC LIMIT 1
)
ORDER BY msg.created_at ASC;

SELECT 'Debug complete - check the match_id above and use it in the app!' as message;
