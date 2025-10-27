-- Check real-time setup and permissions for messages table

-- 1. Check if messages table exists and has proper structure
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE tablename = 'messages';

-- 2. Check messages table columns
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;

-- 3. Check RLS policies for messages table
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'messages';

-- 4. Check if real-time is enabled for the project
SELECT
    'Real-time status check' as check_type,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM pg_proc
            WHERE proname = 'broadcast'
        ) THEN '✅ Real-time functions available'
        ELSE '❌ Real-time functions not available'
    END as status;

-- 5. Check current user permissions
SELECT
    'Current user check' as check_type,
    current_user as current_user,
    session_user as session_user;

-- 6. Test if we can insert a test message (if you have a match)
-- Replace with actual match_id and user_id
-- INSERT INTO messages (match_id, sender_id, body, message_type)
-- VALUES ('your-match-id', 'your-user-id', 'Test message', 'text')
-- RETURNING *;
