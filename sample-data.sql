-- Sample Data for Testing Partner Productivity App
-- Run this after setting up the schema and functions

-- Insert sample users (these will need to be created through Supabase Auth first)
-- You'll need to create these users through the Supabase Auth UI or your app's signup flow

-- Sample profiles (replace user IDs with actual auth user IDs)
INSERT INTO profiles (
  user_id,
  first_name,
  date_of_birth,
  gender,
  bio,
  photos,
  city,
  country
) VALUES 
(
  '00000000-0000-0000-0000-000000000001', -- Replace with actual user ID
  'Alex',
  '1998-05-15',
  'woman',
  'Love hiking and coffee ☕️ Looking for someone to explore the city with!',
  ARRAY[
    'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400'
  ],
  'New York',
  'USA'
),
(
  '00000000-0000-0000-0000-000000000002', -- Replace with actual user ID
  'Jordan',
  '1995-03-22',
  'man',
  'Photographer and travel enthusiast 📸 Always up for an adventure!',
  ARRAY[
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400'
  ],
  'San Francisco',
  'USA'
),
(
  '00000000-0000-0000-0000-000000000003', -- Replace with actual user ID
  'Sam',
  '1997-08-10',
  'non_binary',
  'Artist and yoga instructor 🧘‍♀️ Looking for meaningful connections',
  ARRAY[
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400'
  ],
  'Los Angeles',
  'USA'
),
(
  '00000000-0000-0000-0000-000000000004', -- Replace with actual user ID
  'Taylor',
  '1996-12-03',
  'woman',
  'Software engineer by day, chef by night 👩‍💻🍳 Love trying new restaurants!',
  ARRAY[
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'
  ],
  'Seattle',
  'USA'
),
(
  '00000000-0000-0000-0000-000000000005', -- Replace with actual user ID
  'Casey',
  '1994-07-18',
  'man',
  'Musician and dog lover 🎵🐕 Always down for a concert or dog park visit!',
  ARRAY[
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400'
  ],
  'Austin',
  'USA'
);

-- Insert sample preferences
INSERT INTO preferences (
  user_id,
  seeking_genders,
  age_min,
  age_max,
  max_distance_km,
  relationship_intent,
  interests
) VALUES 
(
  '00000000-0000-0000-0000-000000000001',
  ARRAY['man'],
  22,
  30,
  50,
  'serious_relationship',
  ARRAY['hiking', 'coffee', 'travel', 'photography']
),
(
  '00000000-0000-0000-0000-000000000002',
  ARRAY['woman'],
  24,
  32,
  30,
  'open_to_long_term',
  ARRAY['photography', 'travel', 'music', 'art']
),
(
  '00000000-0000-0000-0000-000000000003',
  ARRAY['man', 'woman'],
  23,
  35,
  40,
  'not_sure',
  ARRAY['yoga', 'art', 'meditation', 'nature']
),
(
  '00000000-0000-0000-0000-000000000004',
  ARRAY['man', 'woman'],
  25,
  35,
  25,
  'serious_relationship',
  ARRAY['cooking', 'technology', 'restaurants', 'books']
),
(
  '00000000-0000-0000-0000-000000000005',
  ARRAY['woman'],
  22,
  30,
  35,
  'casual',
  ARRAY['music', 'dogs', 'concerts', 'outdoor activities']
);

-- Insert sample swipe counters
INSERT INTO swipe_counters (user_id, remaining) VALUES 
('00000000-0000-0000-0000-000000000001', 50),
('00000000-0000-0000-0000-000000000002', 50),
('00000000-0000-0000-0000-000000000003', 50),
('00000000-0000-0000-0000-000000000004', 50),
('00000000-0000-0000-0000-000000000005', 50);

-- Create some sample swipes to test the matching system
INSERT INTO swipes (swiper_user_id, target_user_id, action) VALUES 
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'like'),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'like'), -- This should create a match
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'pass'),
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'like'),
('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005', 'superlike');

-- Insert sample messages for existing matches
INSERT INTO messages (match_id, sender_id, body) VALUES 
(
  (SELECT id FROM matches WHERE user_a_id = '00000000-0000-0000-0000-000000000001' AND user_b_id = '00000000-0000-0000-0000-000000000002'),
  '00000000-0000-0000-0000-000000000001',
  'Hey! I saw you love photography too. Want to check out the new art gallery this weekend?'
),
(
  (SELECT id FROM matches WHERE user_a_id = '00000000-0000-0000-0000-000000000001' AND user_b_id = '00000000-0000-0000-0000-000000000002'),
  '00000000-0000-0000-0000-000000000002',
  'That sounds amazing! I''d love to join you. What time works best?'
);
