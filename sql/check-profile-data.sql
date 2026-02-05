-- =====================================================
-- CHECK PROFILE DATA FOR DEBUGGING
-- =====================================================
-- Run this in Supabase SQL Editor to check if profile data exists
-- =====================================================

-- Check user by email
SELECT 
  u.id,
  u.email,
  u.onboarding_completed,
  u.is_premium,
  u.created_at as user_created
FROM auth.users au
JOIN public.users u ON u.id = au.id
WHERE au.email = 'test2@test.com';

-- Check profile data
SELECT 
  p.user_id,
  p.first_name,
  p.gender,
  p.bio,
  p.photos,
  p.city,
  p.country,
  p.interests,
  p.religious_practice,
  p.prayer_frequency,
  p.education_level,
  p.occupation,
  p.created_at,
  p.updated_at
FROM profiles p
JOIN auth.users au ON au.id = p.user_id
WHERE au.email = 'test2@test.com';

-- Check preferences data
SELECT 
  pr.user_id,
  pr.seeking_genders,
  pr.age_min,
  pr.age_max,
  pr.max_distance_km,
  pr.relationship_intent,
  pr.values,
  pr.created_at,
  pr.updated_at
FROM preferences pr
JOIN auth.users au ON au.id = pr.user_id
WHERE au.email = 'test2@test.com';

-- Check all profiles to see if any have data
SELECT 
  p.user_id,
  p.first_name,
  p.gender,
  LENGTH(p.bio) as bio_length,
  array_length(p.photos, 1) as photo_count,
  p.city,
  p.religious_practice,
  p.updated_at
FROM profiles p
ORDER BY p.updated_at DESC
LIMIT 10;
