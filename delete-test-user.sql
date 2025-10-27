-- Delete test@test.com user and all their data
-- Run this in Supabase SQL Editor

-- Step 1: Find the user ID
SELECT 
  'User to delete:' as info,
  id as user_id,
  email,
  created_at
FROM auth.users 
WHERE email = 'test@test.com';

-- Step 2: Get the user_id from above and use it below
-- Replace 'USER_ID_HERE' with the actual UUID from Step 1

-- Example: If user_id is 'abc123-def456-...'
-- Then replace 'USER_ID_HERE' with that value

DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get the user ID
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'test@test.com';

  IF target_user_id IS NULL THEN
    RAISE NOTICE 'User test@test.com not found';
    RETURN;
  END IF;

  RAISE NOTICE 'Deleting data for user: %', target_user_id;

  -- Delete all related data
  DELETE FROM messages WHERE sender_id = target_user_id;
  DELETE FROM matches WHERE user_a_id = target_user_id OR user_b_id = target_user_id;
  DELETE FROM swipes WHERE swiper_user_id = target_user_id OR target_user_id = target_user_id;
  DELETE FROM swipe_counters WHERE user_id = target_user_id;
  DELETE FROM preferences WHERE user_id = target_user_id;
  DELETE FROM profiles WHERE user_id = target_user_id;

  RAISE NOTICE 'All data deleted for user: %', target_user_id;
  RAISE NOTICE 'Now go to Authentication > Users and delete the user from there';
END $$;

-- Step 3: After running this, go to:
-- Supabase Dashboard > Authentication > Users
-- Find test@test.com and click Delete

SELECT '✅ User data deleted! Now delete from Authentication tab.' as message;


