-- Delete all test users and their data
-- Run this in Supabase SQL Editor
-- WARNING: This will permanently delete ALL users and their data!

-- Show what will be deleted
SELECT 'Users to be deleted:' as info;
SELECT 
  p.first_name,
  p.age,
  p.gender,
  p.user_id
FROM profiles p
ORDER BY p.created_at;

-- Count records before deletion
SELECT 'Current record counts:' as info;
SELECT 
  (SELECT COUNT(*) FROM profiles) as profiles,
  (SELECT COUNT(*) FROM preferences) as preferences,
  (SELECT COUNT(*) FROM swipes) as swipes,
  (SELECT COUNT(*) FROM matches) as matches,
  (SELECT COUNT(*) FROM messages) as messages,
  (SELECT COUNT(*) FROM swipe_counters) as swipe_counters;

-- Delete all data (in correct order due to foreign key constraints)
-- Messages first (references matches)
DELETE FROM messages;

-- Matches (references profiles/users)
DELETE FROM matches;

-- Swipes (references profiles/users)
DELETE FROM swipes;

-- Swipe counters (references users)
DELETE FROM swipe_counters;

-- Preferences (references users)
DELETE FROM preferences;

-- Profiles (references users)
DELETE FROM profiles;

-- Note: We cannot delete from auth.users table directly
-- You need to delete users from Supabase Dashboard > Authentication > Users
-- Or use the Supabase Management API

-- Verify deletion
SELECT 'After deletion:' as info;
SELECT 
  (SELECT COUNT(*) FROM profiles) as profiles,
  (SELECT COUNT(*) FROM preferences) as preferences,
  (SELECT COUNT(*) FROM swipes) as swipes,
  (SELECT COUNT(*) FROM matches) as matches,
  (SELECT COUNT(*) FROM messages) as messages,
  (SELECT COUNT(*) FROM swipe_counters) as swipe_counters;

SELECT '✅ All user data deleted! Now delete users from Authentication tab in Supabase Dashboard.' as message;

