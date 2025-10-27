-- Test profile update functionality
-- Run this in Supabase SQL Editor

-- 1. Check current profile data
SELECT 
  'CURRENT_PROFILE' as info,
  user_id,
  first_name,
  bio,
  interests,
  array_length(photos, 1) as photo_count,
  updated_at
FROM profiles
ORDER BY updated_at DESC
LIMIT 1;

-- 2. Test update a profile (replace with actual user_id)
UPDATE profiles 
SET 
  bio = 'This is a test bio update',
  interests = ARRAY['Fitness', 'Travel', 'Music'],
  updated_at = NOW()
WHERE user_id = (
  SELECT user_id FROM profiles ORDER BY updated_at DESC LIMIT 1
)
RETURNING user_id, bio, interests, updated_at;

-- 3. Verify the update
SELECT 
  'UPDATED_PROFILE' as info,
  user_id,
  first_name,
  bio,
  interests,
  updated_at
FROM profiles
WHERE bio = 'This is a test bio update'
LIMIT 1;

SELECT 'Profile update test completed!' as message;
