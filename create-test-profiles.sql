-- Create Test Profiles for Partner Productivity App
-- Run this in Supabase SQL Editor if the Node script doesn't work

-- NOTE: You'll need to create auth users first through Supabase Dashboard
-- Then update the user_ids below with the actual IDs

-- Step 1: Create users in Supabase Dashboard → Authentication → Add User
-- Create these users:
-- sarah@test.com / test123456
-- mike@test.com / test123456
-- emma@test.com / test123456
-- alex@test.com / test123456
-- jessica@test.com / test123456

-- Step 2: Get their user IDs and replace in the INSERTs below

-- For now, let's create profiles with placeholder IDs
-- You'll need to update these after creating the auth users

-- Sarah's Profile
INSERT INTO profiles (user_id, first_name, date_of_birth, gender, bio, photos, city, country, is_verified, primary_photo_idx)
VALUES 
(
  'USER_ID_SARAH', -- Replace with actual user ID
  'Sarah',
  '1995-03-15',
  'woman',
  'Entrepreneur and coffee addict ☕ Love hiking and building cool stuff. Looking for someone to share adventures with!',
  ARRAY['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400'],
  'San Francisco',
  'USA',
  true,
  0
);

-- Mike's Profile  
INSERT INTO profiles (user_id, first_name, date_of_birth, gender, bio, photos, city, country, is_verified, primary_photo_idx)
VALUES 
(
  'USER_ID_MIKE', -- Replace with actual user ID
  'Mike',
  '1992-07-22',
  'man',
  'Software engineer by day, chef by night 👨‍💻🍳 Love trying new recipes and working on side projects.',
  ARRAY['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'],
  'San Francisco',
  'USA',
  true,
  0
);

-- Emma's Profile
INSERT INTO profiles (user_id, first_name, date_of_birth, gender, bio, photos, city, country, is_verified, primary_photo_idx)
VALUES 
(
  'USER_ID_EMMA', -- Replace with actual user ID
  'Emma',
  '1996-11-08',
  'woman',
  'Designer & yoga enthusiast 🧘‍♀️ Passionate about sustainable living and good conversations.',
  ARRAY['https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400'],
  'Los Angeles',
  'USA',
  false,
  0
);

-- Alex's Profile
INSERT INTO profiles (user_id, first_name, date_of_birth, gender, bio, photos, city, country, is_verified, primary_photo_idx)
VALUES 
(
  'USER_ID_ALEX', -- Replace with actual user ID
  'Alex',
  '1994-05-30',
  'man',
  'Product manager & fitness junkie 💪 Building products that matter. Let''s grab coffee and talk startups!',
  ARRAY['https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400'],
  'San Francisco',
  'USA',
  true,
  0
);

-- Jessica's Profile
INSERT INTO profiles (user_id, first_name, date_of_birth, gender, bio, photos, city, country, is_verified, primary_photo_idx)
VALUES 
(
  'USER_ID_JESSICA', -- Replace with actual user ID
  'Jessica',
  '1993-09-12',
  'woman',
  'Marketing pro & dog mom 🐕 Wine lover, beach enthusiast, and always up for spontaneous adventures!',
  ARRAY['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400'],
  'San Diego',
  'USA',
  true,
  0
);

-- Preferences for Sarah
INSERT INTO preferences (user_id, seeking_genders, age_min, age_max, max_distance_km, relationship_intent, interests)
VALUES 
(
  'USER_ID_SARAH',
  ARRAY['man'],
  25,
  35,
  50,
  'serious_relationship',
  ARRAY['Entrepreneurship', 'Hiking', 'Coffee', 'Travel', 'Fitness']
);

-- Preferences for Mike
INSERT INTO preferences (user_id, seeking_genders, age_min, age_max, max_distance_km, relationship_intent, interests)
VALUES 
(
  'USER_ID_MIKE',
  ARRAY['woman'],
  23,
  32,
  30,
  'open_to_long_term',
  ARRAY['Tech', 'Cooking', 'Reading', 'Gaming', 'Music']
);

-- Preferences for Emma
INSERT INTO preferences (user_id, seeking_genders, age_min, age_max, max_distance_km, relationship_intent, interests)
VALUES 
(
  'USER_ID_EMMA',
  ARRAY['man', 'woman'],
  24,
  35,
  40,
  'not_sure',
  ARRAY['Design', 'Yoga', 'Art', 'Environment', 'Fashion']
);

-- Preferences for Alex
INSERT INTO preferences (user_id, seeking_genders, age_min, age_max, max_distance_km, relationship_intent, interests)
VALUES 
(
  'USER_ID_ALEX',
  ARRAY['woman'],
  24,
  33,
  25,
  'serious_relationship',
  ARRAY['Startups', 'Fitness', 'Marketing', 'Travel', 'Coffee']
);

-- Preferences for Jessica
INSERT INTO preferences (user_id, seeking_genders, age_min, age_max, max_distance_km, relationship_intent, interests)
VALUES 
(
  'USER_ID_JESSICA',
  ARRAY['man'],
  26,
  36,
  60,
  'open_to_long_term',
  ARRAY['Marketing', 'Wine', 'Pets', 'Travel', 'Beach']
);

-- Swipe counters for all users
INSERT INTO swipe_counters (user_id, remaining) VALUES
('USER_ID_SARAH', 10),
('USER_ID_MIKE', 10),
('USER_ID_EMMA', 10),
('USER_ID_ALEX', 10),
('USER_ID_JESSICA', 10);

-- Verify profiles were created
SELECT 
  p.first_name,
  p.gender,
  p.city,
  pr.relationship_intent,
  array_length(pr.interests, 1) as interest_count
FROM profiles p
JOIN preferences pr ON p.user_id = pr.user_id
ORDER BY p.first_name;
