-- Verify Real-time Setup for Messages Table
-- Run this in Supabase SQL Editor

-- 1. Check if messages table exists
SELECT 
    'messages table exists' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'messages' 
            AND table_schema = 'public'
        ) THEN '✅ Yes'
        ELSE '❌ No - Table missing'
    END as status;

-- 2. Check if messages is in real-time publication
SELECT 
    'Real-time publication' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND tablename = 'messages'
        ) THEN '✅ Yes - Real-time enabled'
        ELSE '❌ No - Not in real-time publication'
    END as status;

-- 3. Check if RLS is enabled on messages
SELECT 
    'RLS enabled' as check_type,
    relname as table_name,
    CASE 
        WHEN relrowsecurity THEN '✅ Yes - RLS enabled'
        ELSE '❌ No - RLS not enabled'
    END as status
FROM pg_class 
WHERE relname = 'messages' 
AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 4. List all RLS policies on messages table
SELECT 
    'RLS policies' as check_type,
    policyname,
    cmd as command,
    CASE 
        WHEN cmd = 'SELECT' THEN 'Read'
        WHEN cmd = 'INSERT' THEN 'Write'
        WHEN cmd = 'UPDATE' THEN 'Update'
        WHEN cmd = 'DELETE' THEN 'Delete'
        ELSE cmd::text
    END as permission_type
FROM pg_policies 
WHERE tablename = 'messages' 
AND schemaname = 'public';

-- 5. Check if broadcast_changes trigger function exists
SELECT 
    'broadcast_changes function' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = 'broadcast_changes'
        ) THEN '✅ Yes - Function exists'
        ELSE '❌ No - Function missing'
    END as status;

-- 6. Check for trigger on messages table
SELECT 
    'Trigger on messages' as check_type,
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'messages'
AND trigger_schema = 'public';

-- 7. SUMMARY: Get overall status
SELECT 
    '=== SUMMARY ===' as info,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'messages' AND table_schema = 'public') as table_exists,
    (SELECT COUNT(*) FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'messages') as in_realtime_pub,
    (SELECT COUNT(*) FROM pg_class WHERE relname = 'messages' AND relrowsecurity) as rls_enabled;

