-- Simple test to check if real-time is working
-- Run this in Supabase SQL Editor

-- 1. Check if real-time is enabled
SELECT 
  'Real-time status check' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'broadcast_changes'
    ) THEN '✅ Real-time functions available'
    ELSE '❌ Real-time functions not available'
  END as status;

-- 2. Check if messages table exists and has proper structure
SELECT 
  'Messages table check' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'messages' AND table_schema = 'public'
    ) THEN '✅ Messages table exists'
    ELSE '❌ Messages table does not exist'
  END as status;

-- 3. Check if matches table exists
SELECT 
  'Matches table check' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'matches' AND table_schema = 'public'
    ) THEN '✅ Matches table exists'
    ELSE '❌ Matches table does not exist'
  END as status;

-- 4. Check RLS policies on messages table
SELECT 
  'RLS policies check' as check_type,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'messages' AND schemaname = 'public';

-- 5. Test inserting a message (replace with actual match_id and user_id)
-- Uncomment and replace placeholders to test:
-- INSERT INTO public.messages (match_id, sender_id, body, message_type)
-- VALUES ('your-match-id', 'your-user-id', 'Test message', 'text')
-- RETURNING *;
