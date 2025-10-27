-- Add test interests to existing profiles
-- Run this in Supabase SQL Editor

-- Add interests column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interests text[];

-- Update profiles with sample interests
UPDATE profiles 
SET interests = ARRAY['Fitness', 'Travel', 'Photography', 'Coffee', 'Music']
WHERE first_name = 'abdi';

UPDATE profiles 
SET interests = ARRAY['Gaming', 'Tech', 'Cooking', 'Movies', 'Fashion']
WHERE first_name = 'qqwqwq';

UPDATE profiles 
SET interests = ARRAY['Yoga', 'Art', 'Reading', 'Wine', 'Pets']
WHERE first_name = 'bby';

UPDATE profiles 
SET interests = ARRAY['Running', 'Food', 'Concerts', 'Fashion', 'Travel']
WHERE first_name = 'sarah';

-- Verify the updates
SELECT 
  first_name,
  interests,
  array_length(interests, 1) as interest_count
FROM profiles 
WHERE interests IS NOT NULL
ORDER BY first_name;

SELECT 'Test interests added successfully!' as message;
