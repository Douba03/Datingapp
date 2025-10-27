-- Enable Real-time for Messages Table
-- Run this in Supabase SQL Editor

-- Step 1: Add messages table to real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Step 2: Verify messages table exists
SELECT 
    'Table check' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'messages' AND table_schema = 'public'
        ) THEN '✅ Messages table exists'
        ELSE '❌ Messages table does not exist'
    END as status;

-- Step 3: Check RLS policies for messages
SELECT 
    'RLS policies' as check_type,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'messages' AND schemaname = 'public';

-- Step 4: Check if real-time is enabled
SELECT 
    'Real-time publication' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND tablename = 'messages'
        ) THEN '✅ Messages table in real-time publication'
        ELSE '❌ Messages table NOT in real-time publication'
    END as status;

