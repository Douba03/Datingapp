-- =====================================================
-- CHECK REAL-TIME STATUS FOR TABLES
-- =====================================================
-- This SQL checks which tables have real-time replication enabled
-- Run this in Supabase SQL Editor
-- =====================================================

-- Check if tables exist and their real-time status
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN tablename IN (
      SELECT tablename 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime'
    ) THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END as realtime_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'connection_requests', 'hidden_profiles', 'messages', 'user_blocks')
ORDER BY tablename;

-- Show detailed publication info
SELECT 
  pubname as publication_name,
  tablename,
  schemaname
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('profiles', 'connection_requests', 'hidden_profiles', 'messages', 'user_blocks')
ORDER BY tablename;
