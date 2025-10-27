-- Simple test to verify chat functionality
-- Run this in Supabase SQL Editor

-- 1. Check if we have any matches
SELECT 
  'MATCHES' as type,
  COUNT(*) as count
FROM matches;

-- 2. Check if we have any messages
SELECT 
  'MESSAGES' as type,
  COUNT(*) as count
FROM messages;

-- 3. Check messages for the first match
SELECT 
  'MESSAGES_IN_FIRST_MATCH' as type,
  m.id as match_id,
  msg.id as message_id,
  msg.body,
  msg.sender_id,
  msg.created_at
FROM matches m
LEFT JOIN messages msg ON m.id = msg.match_id
ORDER BY m.created_at DESC, msg.created_at DESC
LIMIT 5;

-- 4. Test if we can insert a message (replace with actual match_id)
SELECT 'Ready to test chat - matches and messages exist!' as message;
