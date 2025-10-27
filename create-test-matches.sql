-- Create test matches for testing the chat functionality
-- Run this in Supabase SQL Editor

-- First, let's see what profiles we have
SELECT 
  user_id,
  first_name,
  gender
FROM profiles 
ORDER BY first_name;

-- Create a match between abdi and bby (if they exist)
-- Note: Replace these user_ids with actual ones from your profiles table
INSERT INTO matches (user_a_id, user_b_id, created_at, status)
SELECT 
  p1.user_id as user_a_id,
  p2.user_id as user_b_id,
  NOW() as created_at,
  'active' as status
FROM profiles p1, profiles p2
WHERE p1.first_name = 'abdi' 
  AND p2.first_name = 'bby'
  AND p1.user_id < p2.user_id  -- Ensure user_a_id < user_b_id
ON CONFLICT (user_a_id, user_b_id) DO NOTHING;

-- Create a match between qqwqwq and sarah (if they exist)
INSERT INTO matches (user_a_id, user_b_id, created_at, status)
SELECT 
  p1.user_id as user_a_id,
  p2.user_id as user_b_id,
  NOW() as created_at,
  'active' as status
FROM profiles p1, profiles p2
WHERE p1.first_name = 'qqwqwq' 
  AND p2.first_name = 'sarah'
  AND p1.user_id < p2.user_id  -- Ensure user_a_id < user_b_id
ON CONFLICT (user_a_id, user_b_id) DO NOTHING;

-- Verify matches were created
SELECT 
  m.id,
  m.created_at,
  p1.first_name as user_a_name,
  p2.first_name as user_b_name,
  m.status
FROM matches m
JOIN profiles p1 ON m.user_a_id = p1.user_id
JOIN profiles p2 ON m.user_b_id = p2.user_id
ORDER BY m.created_at DESC;

-- Add some test messages to the matches
INSERT INTO messages (match_id, sender_id, body, message_type, created_at)
SELECT 
  m.id as match_id,
  m.user_a_id as sender_id,
  'Hey! How are you doing?' as body,
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
  'Hi! I''m doing great, thanks for asking! 😊' as body,
  'text' as message_type,
  NOW() + INTERVAL '1 minute' as created_at
FROM matches m
JOIN profiles p1 ON m.user_a_id = p1.user_id
JOIN profiles p2 ON m.user_b_id = p2.user_id
WHERE p1.first_name = 'abdi' AND p2.first_name = 'bby'
LIMIT 1;

-- Verify messages were created
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

SELECT 'Test matches and messages created successfully!' as message;
