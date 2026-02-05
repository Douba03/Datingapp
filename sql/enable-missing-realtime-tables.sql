-- =====================================================
-- ENABLE REAL-TIME FOR MISSING TABLES ONLY
-- =====================================================
-- This SQL only adds tables that are NOT already in real-time
-- Run this in Supabase SQL Editor
-- =====================================================

-- Try to add connection_requests (ignore if already exists)
DO $$ 
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE connection_requests;
  RAISE NOTICE '✅ Added connection_requests to real-time';
EXCEPTION 
  WHEN duplicate_object THEN
    RAISE NOTICE '⚠️ connection_requests already has real-time';
END $$;

-- Try to add user_blocks (ignore if already exists)
DO $$ 
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE user_blocks;
  RAISE NOTICE '✅ Added user_blocks to real-time';
EXCEPTION 
  WHEN duplicate_object THEN
    RAISE NOTICE '⚠️ user_blocks already has real-time';
END $$;

-- Verify final status - show ALL tables with real-time
SELECT 
  tablename,
  '✅ Real-time ENABLED' as status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('profiles', 'connection_requests', 'hidden_profiles', 'messages', 'user_blocks')
ORDER BY tablename;
