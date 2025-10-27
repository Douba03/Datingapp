-- Add messages table to real-time publication
-- This enables real-time updates for the messages table

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Verify it was added successfully
SELECT 
    'Real-time status' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND tablename = 'messages'
        ) THEN '✅ Messages table now in real-time publication!'
        ELSE '❌ Failed to add messages to real-time publication'
    END as status;

