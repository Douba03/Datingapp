-- =====================================================
-- ENABLE REAL-TIME FOR REQUIRED TABLES
-- =====================================================
-- This SQL enables real-time replication for all required tables
-- Run this in Supabase SQL Editor AFTER checking status
-- =====================================================

-- Enable real-time for profiles table
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- Enable real-time for connection_requests table
ALTER PUBLICATION supabase_realtime ADD TABLE connection_requests;

-- Enable real-time for hidden_profiles table
ALTER PUBLICATION supabase_realtime ADD TABLE hidden_profiles;

-- Enable real-time for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Enable real-time for user_blocks table (optional but recommended)
ALTER PUBLICATION supabase_realtime ADD TABLE user_blocks;

-- Verify that all tables are now enabled
SELECT 
  tablename,
  '✅ Real-time ENABLED' as status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('profiles', 'connection_requests', 'hidden_profiles', 'messages', 'user_blocks')
ORDER BY tablename;
