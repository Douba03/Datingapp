-- =====================================================
-- COMPLETE FIX: SIGNUP + MATCHING ALGORITHM
-- =====================================================
-- This script fixes:
-- 1. Signup issues (users, profiles, preferences tables)
-- 2. Matching algorithm (show opposite gender, prioritize matching data)
-- 
-- Run this ONCE in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- PART 1: FIX USERS TABLE
-- =====================================================

-- Ensure users table exists
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  auth_provider TEXT DEFAULT 'email',
  status TEXT DEFAULT 'active',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,
  premium_until TIMESTAMPTZ,
  grace_period_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on users
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;
DROP POLICY IF EXISTS "Service role can manage all users" ON public.users;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Allow all for service role" ON public.users;

-- Create RLS policies for users
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own data" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- PART 2: FIX PROFILES TABLE
-- =====================================================

-- Ensure profiles table exists with all needed columns
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL DEFAULT '',
  date_of_birth DATE,
  age INTEGER,
  gender TEXT DEFAULT 'prefer_not_to_say',
  custom_gender TEXT,
  sexual_orientation TEXT[],
  bio TEXT DEFAULT '',
  photos TEXT[] DEFAULT '{}',
  primary_photo_idx INTEGER DEFAULT 0,
  location GEOGRAPHY(POINT, 4326),
  city TEXT,
  country TEXT,
  interests TEXT[] DEFAULT '{}',
  is_verified BOOLEAN DEFAULT FALSE,
  verification_photo TEXT,
  boost_expires_at TIMESTAMPTZ,
  religious_practice TEXT,
  prayer_frequency TEXT,
  hijab_preference TEXT,
  dietary_preference TEXT,
  family_involvement TEXT,
  marriage_timeline TEXT,
  education_level TEXT,
  occupation TEXT,
  living_situation TEXT,
  has_children BOOLEAN,
  wants_children BOOLEAN,
  ethnicity TEXT,
  languages TEXT[],
  tribe_clan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Allow all for service role" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;

-- Create RLS policies for profiles
-- IMPORTANT: All authenticated users can VIEW all profiles (for matching)
CREATE POLICY "Authenticated users can view profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

-- Users can only UPDATE their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can INSERT their own profile
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- PART 3: FIX PREFERENCES TABLE
-- =====================================================

-- Ensure preferences table exists
CREATE TABLE IF NOT EXISTS public.preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  seeking_genders TEXT[] DEFAULT '{}',
  age_min INTEGER DEFAULT 18,
  age_max INTEGER DEFAULT 100,
  max_distance_km INTEGER DEFAULT 50,
  relationship_intent TEXT DEFAULT 'not_sure',
  lifestyle JSONB DEFAULT '{}',
  values TEXT[] DEFAULT '{}',
  deal_breakers TEXT[] DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  focus_session_duration INTEGER DEFAULT 25,
  daily_goal TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.preferences ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on preferences
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.preferences;
DROP POLICY IF EXISTS "Authenticated users can view preferences" ON public.preferences;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.preferences;
DROP POLICY IF EXISTS "Allow all for service role" ON public.preferences;
DROP POLICY IF EXISTS "preferences_select_policy" ON public.preferences;
DROP POLICY IF EXISTS "preferences_insert_policy" ON public.preferences;
DROP POLICY IF EXISTS "preferences_update_policy" ON public.preferences;

-- Create RLS policies for preferences
-- All authenticated users can VIEW preferences (needed for matching algorithm)
CREATE POLICY "Authenticated users can view preferences" ON public.preferences
  FOR SELECT TO authenticated
  USING (true);

-- Users can only UPDATE their own preferences
CREATE POLICY "Users can update their own preferences" ON public.preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can INSERT their own preferences
CREATE POLICY "Users can insert their own preferences" ON public.preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- PART 4: FIX SIGNUP TRIGGER
-- =====================================================

-- Drop ALL existing triggers on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_user_record ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_request_counter ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;
DROP TRIGGER IF EXISTS create_user_on_signup ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;

-- Drop existing functions
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS create_user_record() CASCADE;
DROP FUNCTION IF EXISTS create_profile_for_new_user() CASCADE;

-- Create a robust function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert into users table
  BEGIN
    INSERT INTO public.users (
      id, 
      email, 
      auth_provider, 
      status,
      onboarding_completed,
      is_premium,
      created_at, 
      updated_at,
      last_seen_at
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.email, 'user@example.com'),
      COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
      'active',
      false,
      false,
      NOW(),
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      updated_at = NOW();
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error creating user record: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- PART 5: GRANT PERMISSIONS
-- =====================================================

-- Grant permissions on users table
GRANT ALL ON public.users TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;

-- Grant permissions on profiles table
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- Grant permissions on preferences table
GRANT ALL ON public.preferences TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.preferences TO authenticated;
GRANT SELECT ON public.preferences TO anon;

-- Grant execute on function
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;

-- =====================================================
-- PART 6: CREATE MATCHING FUNCTION (OPTIONAL)
-- =====================================================
-- This function can be used to get potential matches
-- It shows opposite gender profiles and prioritizes matching data

CREATE OR REPLACE FUNCTION get_potential_matches(
  current_user_id UUID,
  current_gender TEXT,
  seeking_genders TEXT[],
  age_min_pref INTEGER DEFAULT 18,
  age_max_pref INTEGER DEFAULT 100,
  max_distance INTEGER DEFAULT 500,
  limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
  user_id UUID,
  first_name TEXT,
  age INTEGER,
  gender TEXT,
  bio TEXT,
  photos TEXT[],
  city TEXT,
  country TEXT,
  compatibility_score INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH excluded_users AS (
    -- Get users we've already interacted with
    SELECT receiver_id AS excluded_id FROM connection_requests WHERE sender_id = current_user_id
    UNION
    SELECT sender_id AS excluded_id FROM connection_requests WHERE receiver_id = current_user_id
    UNION
    SELECT blocked_user_id AS excluded_id FROM user_blocks WHERE blocker_user_id = current_user_id
    UNION
    SELECT blocker_user_id AS excluded_id FROM user_blocks WHERE blocked_user_id = current_user_id
    UNION
    SELECT hidden_user_id AS excluded_id FROM hidden_profiles WHERE user_id = current_user_id
  ),
  scored_profiles AS (
    SELECT 
      p.user_id,
      p.first_name,
      p.age,
      p.gender,
      p.bio,
      p.photos,
      p.city,
      p.country,
      -- Calculate compatibility score (higher = better match)
      (
        -- Base score
        50
        -- Bonus if they're seeking our gender too (mutual interest)
        + CASE WHEN current_gender = ANY(COALESCE(pref.seeking_genders, ARRAY[]::TEXT[])) THEN 20 ELSE 0 END
        -- Bonus for matching religious practice
        + CASE WHEN p.religious_practice IS NOT NULL THEN 5 ELSE 0 END
        -- Bonus for matching marriage timeline
        + CASE WHEN p.marriage_timeline IS NOT NULL THEN 5 ELSE 0 END
        -- Bonus for having photos
        + CASE WHEN p.photos IS NOT NULL AND array_length(p.photos, 1) > 0 THEN 10 ELSE 0 END
        -- Bonus for having bio
        + CASE WHEN p.bio IS NOT NULL AND p.bio != '' THEN 5 ELSE 0 END
        -- Bonus for verified profiles
        + CASE WHEN p.is_verified THEN 10 ELSE 0 END
      ) AS compatibility_score
    FROM public.profiles p
    LEFT JOIN public.preferences pref ON p.user_id = pref.user_id
    WHERE 
      -- Not the current user
      p.user_id != current_user_id
      -- Not in excluded list
      AND p.user_id NOT IN (SELECT excluded_id FROM excluded_users)
      -- Gender filter: show profiles whose gender matches what we're seeking
      -- If seeking_genders is empty or null, show all genders
      AND (
        seeking_genders IS NULL 
        OR array_length(seeking_genders, 1) IS NULL 
        OR array_length(seeking_genders, 1) = 0
        OR p.gender = ANY(seeking_genders)
      )
      -- Age filter (be lenient if age is not set)
      AND (p.age IS NULL OR p.age = 0 OR (p.age >= age_min_pref AND p.age <= age_max_pref))
  )
  SELECT 
    sp.user_id,
    sp.first_name,
    sp.age,
    sp.gender,
    sp.bio,
    sp.photos,
    sp.city,
    sp.country,
    sp.compatibility_score
  FROM scored_profiles sp
  ORDER BY sp.compatibility_score DESC, RANDOM()
  LIMIT limit_count;
END;
$$;

-- Grant execute on matching function
GRANT EXECUTE ON FUNCTION get_potential_matches(UUID, TEXT, TEXT[], INTEGER, INTEGER, INTEGER, INTEGER) TO authenticated;

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT '=== VERIFICATION ===' as section;

-- Check tables exist
SELECT 
  'Tables exist: ' || 
  CASE WHEN (
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') AND
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') AND
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'preferences' AND table_schema = 'public')
  ) THEN '✅ YES' ELSE '❌ NO' END as status;

-- Check trigger exists
SELECT 
  'Signup trigger exists: ' || 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created'
  ) THEN '✅ YES' ELSE '❌ NO' END as status;

-- Check RLS policies
SELECT 
  'RLS Policies count:' as check_type,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'users') as users_policies,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles') as profiles_policies,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'preferences') as preferences_policies;

-- Show all policies
SELECT 
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'profiles', 'preferences')
ORDER BY tablename, policyname;

SELECT '=== FIX COMPLETE ===' as message;
SELECT 'Now test signup with a new email address!' as next_step;
