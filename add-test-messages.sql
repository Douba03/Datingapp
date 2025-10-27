-- Add test messages to existing matches for real-time chat testing
-- Run this in Supabase SQL Editor

-- 1. Check existing matches
SELECT 
  m.id,
  m.created_at,
  p1.first_name as user_a_name,
  p2.first_name as user_b_name
FROM matches m
JOIN profiles p1 ON m.user_a_id = p1.user_id
JOIN profiles p2 ON m.user_b_id = p2.user_id
ORDER BY m.created_at DESC;

-- 2. Add test messages to the first match
INSERT INTO messages (match_id, sender_id, body, message_type, created_at)
SELECT 
  m.id as match_id,
  m.user_a_id as sender_id,
  'Hey! How are you doing today? 😊' as body,
  'text' as message_type,
  NOW() as created_at
FROM matches m
JOIN profiles p1 ON m.user_a_id = p1.user_id
JOIN profiles p2 ON m.user_b_id = p2.user_id
WHERE p1.first_name = 'abdi' AND p2.first_name = 'bby'
LIMIT 1;

INSERT INTO messages (match_id, sender_id, body, message_type, created_at)
SELECT 
  m.id as match_id,
  m.user_b_id as sender_id,
  'Hi! I''m doing great, thanks for asking! How about you?' as body,
  'text' as message_type,
  NOW() + INTERVAL '1 minute' as created_at
FROM matches m
JOIN profiles p1 ON m.user_a_id = p1.user_id
JOIN profiles p2 ON m.user_b_id = p2.user_id
WHERE p1.first_name = 'abdi' AND p2.first_name = 'bby'
LIMIT 1;

INSERT INTO messages (match_id, sender_id, body, message_type, created_at)
SELECT 
  m.id as match_id,
  m.user_a_id as sender_id,
  'Pretty good! Just working on some projects. What are you up to?' as body,
  'text' as message_type,
  NOW() + INTERVAL '2 minutes' as created_at
FROM matches m
JOIN profiles p1 ON m.user_a_id = p1.user_id
JOIN profiles p2 ON m.user_b_id = p2.user_id
WHERE p1.first_name = 'abdi' AND p2.first_name = 'bby'
LIMIT 1;

-- 3. Verify messages were created
SELECT 
  msg.id,
  msg.body,
  msg.created_at,
  p.first_name as sender_name,
  p1.first_name as user_a_name,
  p2.first_name as user_b_name
FROM messages msg
JOIN matches m ON msg.match_id = m.id
JOIN profiles p ON msg.sender_id = p.user_id
JOIN profiles p1 ON m.user_a_id = p1.user_id
JOIN profiles p2 ON m.user_b_id = p2.user_id
ORDER BY msg.created_at DESC;

SELECT 'Test messages created successfully!' as message;
