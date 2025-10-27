-- Add Test Profiles to Your Existing Database
-- Run this in Supabase SQL Editor

-- First, let's get the user IDs of your existing accounts
-- Run this first to see your users:
SELECT id, email FROM auth.users ORDER BY created_at DESC;

-- After you get the IDs, you can manually add profiles for them
-- OR we can create completely new test profiles with fake user IDs

-- For now, let's create test profiles that will show up for your existing users

-- Create a test WOMAN profile (so your MEN can discover her)
-- Note: This creates a profile WITHOUT an auth user (for testing only!)

INSERT INTO profiles (
  user_id,
  first_name,
  date_of_birth,
  gender,
  bio,
  photos,
  city,
  country,
  is_verified,
  primary_photo_idx
) VALUES (
  '00000000-0000-0000-0000-000000000001', -- Fake UUID for testing
  'Emma',
  '1996-05-15',
  'woman',
  'Designer & yoga enthusiast 🧘‍♀️ Love art and good conversations!',
  ARRAY[
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400'
  ],
  'Unknown',
  'Unknown',
  true,
  0
);

-- Create preferences for Emma
INSERT INTO preferences (
  user_id,
  seeking_genders,
  age_min,
  age_max,
  max_distance_km,
  relationship_intent,
  interests
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  ARRAY['man']::text[],
  20,
  35,
  100,
  'open_to_long_term',
  ARRAY['Design', 'Yoga', 'Art', 'Coffee']::text[]
);

-- Create another WOMAN profile
INSERT INTO profiles (
  user_id,
  first_name,
  date_of_birth,
  gender,
  bio,
  photos,
  city,
  country,
  is_verified,
  primary_photo_idx
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Jessica',
  '1994-08-20',
  'woman',
  'Marketing pro & dog mom 🐕 Wine lover and adventure seeker!',
  ARRAY[
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400'
  ],
  'Unknown',
  'Unknown',
  true,
  0
);

-- Create preferences for Jessica
INSERT INTO preferences (
  user_id,
  seeking_genders,
  age_min,
  age_max,
  max_distance_km,
  relationship_intent,
  interests
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  ARRAY['man']::text[],
  22,
  40,
  100,
  'serious_relationship',
  ARRAY['Marketing', 'Pets', 'Wine', 'Travel']::text[]
);

-- Verify profiles were created
SELECT 
  first_name,
  gender,
  age,
  city,
  array_length(photos, 1) as photo_count
FROM profiles
ORDER BY created_at DESC;

-- Verify preferences
SELECT 
  p.first_name,
  pr.seeking_genders,
  pr.age_min,
  pr.age_max
FROM profiles p
JOIN preferences pr ON p.user_id = pr.user_id
ORDER BY p.first_name;



