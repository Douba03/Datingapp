-- Create a completely new working function
-- Run this in Supabase SQL Editor

-- First, let's check what functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%profile%';

-- Drop ALL existing profile functions
DROP FUNCTION IF EXISTS create_complete_profile(TEXT, DATE, TEXT, TEXT, TEXT, TEXT[], INTEGER, JSONB, TEXT, TEXT, TEXT[], TEXT[], INTEGER, INTEGER, INTEGER, TEXT);
DROP FUNCTION IF EXISTS create_complete_profile;

-- Create a brand new, simple function
CREATE OR REPLACE FUNCTION create_complete_profile(
  p_first_name TEXT,
  p_date_of_birth DATE,
  p_gender TEXT,
  p_custom_gender TEXT DEFAULT NULL,
  p_bio TEXT DEFAULT '',
  p_photos TEXT[] DEFAULT '{}',
  p_primary_photo_idx INTEGER DEFAULT 0,
  p_location JSONB DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL,
  p_interests TEXT[] DEFAULT '{}',
  p_seeking_genders TEXT[] DEFAULT '{}',
  p_age_min INTEGER DEFAULT 18,
  p_age_max INTEGER DEFAULT 100,
  p_max_distance_km INTEGER DEFAULT 50,
  p_relationship_intent TEXT DEFAULT 'casual'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  new_profile_id UUID;
  new_preferences_id UUID;
  profile_result JSON;
  preferences_result JSON;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Calculate age directly
  DECLARE
    user_age INTEGER;
  BEGIN
    user_age := EXTRACT(YEAR FROM AGE(p_date_of_birth));
    
    -- Create/Update profile
    INSERT INTO profiles (
      user_id,
      first_name,
      date_of_birth,
      gender,
      custom_gender,
      bio,
      photos,
      primary_photo_idx,
      location,
      city,
      country,
      interests,
      age
    ) VALUES (
      current_user_id,
      p_first_name,
      p_date_of_birth,
      p_gender::gender_type,
      p_custom_gender,
      p_bio,
      p_photos,
      p_primary_photo_idx,
      p_location,
      p_city,
      p_country,
      p_interests,
      user_age
    )
    ON CONFLICT (user_id) DO UPDATE SET
      first_name = EXCLUDED.first_name,
      date_of_birth = EXCLUDED.date_of_birth,
      gender = EXCLUDED.gender,
      custom_gender = EXCLUDED.custom_gender,
      bio = EXCLUDED.bio,
      photos = EXCLUDED.photos,
      primary_photo_idx = EXCLUDED.primary_photo_idx,
      location = EXCLUDED.location,
      city = EXCLUDED.city,
      country = EXCLUDED.country,
      interests = EXCLUDED.interests,
      age = user_age,
      updated_at = NOW()
    RETURNING to_json(profiles.*) INTO profile_result;

    -- Create/Update preferences
    INSERT INTO preferences (
      user_id,
      seeking_genders,
      age_min,
      age_max,
      max_distance_km,
      relationship_intent
    ) VALUES (
      current_user_id,
      p_seeking_genders,
      p_age_min,
      p_age_max,
      p_max_distance_km,
      p_relationship_intent::relationship_intent
    )
    ON CONFLICT (user_id) DO UPDATE SET
      seeking_genders = EXCLUDED.seeking_genders,
      age_min = EXCLUDED.age_min,
      age_max = EXCLUDED.age_max,
      max_distance_km = EXCLUDED.max_distance_km,
      relationship_intent = EXCLUDED.relationship_intent,
      updated_at = NOW()
    RETURNING to_json(preferences.*) INTO preferences_result;

    -- Return success
    RETURN json_build_object(
      'success', true,
      'profile', profile_result,
      'preferences', preferences_result,
      'message', 'Profile created successfully'
    );
  END;
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'error_code', SQLSTATE
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_complete_profile TO authenticated;

-- Test the function exists
SELECT '✅ New function created successfully!' as status;
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'create_complete_profile';

