-- TEMPORARY FIX: Disable RLS for testing
-- Run this in Supabase SQL Editor to temporarily allow profile updates

-- This is a temporary fix to test if the issue is RLS or something else
-- We'll re-enable proper RLS policies after testing

-- Disable RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE preferences DISABLE ROW LEVEL SECURITY;

-- Grant full access to anon role for testing
GRANT ALL ON profiles TO anon;
GRANT ALL ON preferences TO anon;

SELECT 'RLS temporarily disabled for testing' as message;
SELECT 'Now test profile updates in your app' as next_step;
SELECT 'REMEMBER: Re-enable RLS after testing!' as warning;
