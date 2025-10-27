-- Simple fix - recreate the function without the calculated_age bug
-- Run this in Supabase SQL Editor

-- Drop the existing function
DROP FUNCTION IF EXISTS create_complete_profile;

-- Create a simpler version that works
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
  user_id UUID;
  profile_data JSON;
  preferences_data JSON;
  result JSON;
BEGIN
  -- Get the current user ID
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not authenticated'
    );
  END IF;

  -- Start transaction
  BEGIN
    -- Insert or update profile (let database calculate age)
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
      user_id,
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
      EXTRACT(YEAR FROM AGE(p_date_of_birth))
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
      age = EXTRACT(YEAR FROM AGE(EXCLUDED.date_of_birth)),
      updated_at = NOW()
    RETURNING to_json(profiles.*) INTO profile_data;

    -- Insert or update preferences
    INSERT INTO preferences (
      user_id,
      seeking_genders,
      age_min,
      age_max,
      max_distance_km,
      relationship_intent
    ) VALUES (
      user_id,
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
    RETURNING to_json(preferences.*) INTO preferences_data;

    -- Return success with both profile and preferences data
    result := json_build_object(
      'success', true,
      'profile', profile_data,
      'preferences', preferences_data,
      'message', 'Complete profile created successfully'
    );

    RETURN result;

  EXCEPTION WHEN OTHERS THEN
    -- Return error details
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
  END;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_complete_profile TO authenticated;

SELECT '✅ Simple function created!' as message;
SELECT 'Age calculation fixed - using EXTRACT directly!' as status;

