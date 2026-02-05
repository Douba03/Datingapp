-- =====================================================
-- VERIFY PROFILE MATCHING SETUP
-- =====================================================
-- Run this in Supabase SQL Editor to verify that:
-- 1. Profiles table has gender column
-- 2. Preferences table has seeking_genders column
-- 3. RLS policies allow profiles to be visible
-- 4. Sample data shows correct matching
-- =====================================================

-- 1. Check profiles table structure
SELECT 
  'Profiles Table Columns' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name IN ('user_id', 'gender', 'first_name', 'age', 'photos', 'bio')
ORDER BY column_name;

-- 2. Check preferences table structure
SELECT 
  'Preferences Table Columns' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'preferences'
  AND column_name IN ('user_id', 'seeking_genders', 'age_min', 'age_max')
ORDER BY column_name;

-- 3. Check RLS policies on profiles
SELECT 
  'Profiles RLS Policies' as check_type,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'profiles';

-- 4. Check RLS policies on preferences
SELECT 
  'Preferences RLS Policies' as check_type,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'preferences';

-- 5. Sample profiles data (check if gender is saved)
SELECT 
  'Sample Profiles' as check_type,
  user_id,
  first_name,
  gender,
  age,
  CASE WHEN photos IS NOT NULL AND array_length(photos, 1) > 0 THEN 'Has photos' ELSE 'No photos' END as photo_status,
  CASE WHEN bio IS NOT NULL AND bio != '' THEN 'Has bio' ELSE 'No bio' END as bio_status,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 5;

-- 6. Sample preferences data (check if seeking_genders is saved)
SELECT 
  'Sample Preferences' as check_type,
  p.user_id,
  prof.first_name,
  prof.gender as user_gender,
  p.seeking_genders,
  p.age_min,
  p.age_max,
  p.max_distance_km
FROM preferences p
LEFT JOIN profiles prof ON p.user_id = prof.user_id
ORDER BY p.created_at DESC
LIMIT 5;

-- 7. Matching test: Show who should see whom
WITH user_sample AS (
  SELECT 
    p.user_id,
    p.first_name,
    p.gender,
    pr.seeking_genders,
    p.age
  FROM profiles p
  LEFT JOIN preferences pr ON p.user_id = pr.user_id
  LIMIT 3
)
SELECT 
  'Matching Test' as check_type,
  u1.first_name as user_name,
  u1.gender as user_gender,
  u1.seeking_genders as user_seeking,
  u2.first_name as potential_match_name,
  u2.gender as potential_match_gender,
  CASE 
    WHEN u1.seeking_genders IS NULL THEN 'No preferences set'
    WHEN u2.gender = ANY(u1.seeking_genders) THEN '✅ MATCH - Should be visible'
    ELSE '❌ NO MATCH - Should NOT be visible'
  END as match_status
FROM user_sample u1
CROSS JOIN user_sample u2
WHERE u1.user_id != u2.user_id
ORDER BY u1.first_name, u2.first_name;

-- 8. Check for profiles missing critical data
SELECT 
  'Profiles Missing Data' as check_type,
  user_id,
  first_name,
  CASE WHEN gender IS NULL THEN '❌ Missing gender' ELSE '✅ Has gender' END as gender_status,
  CASE WHEN age IS NULL THEN '❌ Missing age' ELSE '✅ Has age' END as age_status,
  CASE WHEN photos IS NULL OR array_length(photos, 1) = 0 THEN '❌ Missing photos' ELSE '✅ Has photos' END as photos_status,
  CASE WHEN bio IS NULL OR bio = '' THEN '⚠️ Missing bio' ELSE '✅ Has bio' END as bio_status
FROM profiles
WHERE gender IS NULL 
   OR age IS NULL 
   OR photos IS NULL 
   OR array_length(photos, 1) = 0;

-- 9. Check for preferences missing seeking_genders
SELECT 
  'Preferences Missing Data' as check_type,
  p.user_id,
  prof.first_name,
  CASE 
    WHEN p.seeking_genders IS NULL THEN '❌ seeking_genders is NULL'
    WHEN array_length(p.seeking_genders, 1) = 0 THEN '❌ seeking_genders is empty'
    ELSE '✅ Has seeking_genders: ' || array_to_string(p.seeking_genders, ', ')
  END as seeking_status
FROM preferences p
LEFT JOIN profiles prof ON p.user_id = prof.user_id
WHERE p.seeking_genders IS NULL 
   OR array_length(p.seeking_genders, 1) = 0;

-- 10. Summary statistics
SELECT 
  'Summary Statistics' as check_type,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  (SELECT COUNT(*) FROM profiles WHERE gender IS NOT NULL) as profiles_with_gender,
  (SELECT COUNT(*) FROM preferences) as total_preferences,
  (SELECT COUNT(*) FROM preferences WHERE seeking_genders IS NOT NULL AND array_length(seeking_genders, 1) > 0) as preferences_with_seeking,
  (SELECT COUNT(DISTINCT gender) FROM profiles WHERE gender IS NOT NULL) as unique_genders;
