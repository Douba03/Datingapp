-- COMPLETE AUTHENTICATION SETUP
-- This script sets up authentication, disables email confirmation, and creates necessary tables/functions
-- Run this in the Supabase SQL Editor

-- PART 1: DISABLE EMAIL CONFIRMATION FOR EXISTING USERS
-- Only update email_confirmed_at as confirmed_at is a generated column
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- PART 2: ENSURE PROFILES TABLE EXISTS WITH PROPER STRUCTURE
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('man', 'woman', 'non_binary', 'prefer_not_to_say', 'custom')),
  custom_gender TEXT,
  sexual_orientation TEXT[] DEFAULT '{}',
  bio TEXT,
  photos TEXT[] DEFAULT '{}',
  primary_photo_idx INTEGER DEFAULT 0,
  location JSONB,
  city TEXT,
  country TEXT,
  interests TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_verified BOOLEAN DEFAULT FALSE,
  verification_photo TEXT,
  age INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM AGE(date_of_birth))) STORED
);

-- PART 3: ENSURE PREFERENCES TABLE EXISTS WITH PROPER STRUCTURE
CREATE TABLE IF NOT EXISTS public.preferences (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  seeking_genders TEXT[] DEFAULT '{}',
  age_min INTEGER DEFAULT 18,
  age_max INTEGER DEFAULT 100,
  max_distance_km INTEGER DEFAULT 50,
  relationship_intent TEXT DEFAULT 'not_sure' CHECK (relationship_intent IN ('serious_relationship', 'open_to_long_term', 'not_sure', 'casual')),
  lifestyle JSONB DEFAULT '{}',
  values TEXT[] DEFAULT '{}',
  deal_breakers TEXT[] DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  focus_session_duration INTEGER DEFAULT 25,
  daily_goal TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PART 4: CREATE FUNCTION TO MANUALLY CONFIRM USERS
CREATE OR REPLACE FUNCTION public.confirm_user_email(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE auth.users 
  SET email_confirmed_at = NOW()
  WHERE email = user_email;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PART 5: CREATE OR REPLACE THE USER CREATION HANDLER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_first_name TEXT;
BEGIN
  -- Auto-confirm email for new users
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = NEW.id AND email_confirmed_at IS NULL;
  
  -- Extract first name from email or metadata
  default_first_name := COALESCE(
    (NEW.raw_user_meta_data->>'first_name')::TEXT, 
    split_part(NEW.email, '@', 1)
  );
  
  -- Create a profile entry if it doesn't exist
  INSERT INTO public.profiles (
    user_id, 
    first_name, 
    gender,
    date_of_birth,
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    default_first_name,
    'prefer_not_to_say',
    '1995-01-01',
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create preferences entry if it doesn't exist
  INSERT INTO public.preferences (
    user_id, 
    age_min, 
    age_max, 
    max_distance_km, 
    relationship_intent,
    focus_session_duration,
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    18,
    100,
    50,
    'not_sure',
    25,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PART 6: SET UP THE TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PART 7: SET UP ROW LEVEL SECURITY (RLS)
-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Enable RLS on preferences
ALTER TABLE public.preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for preferences
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.preferences;
CREATE POLICY "Users can view their own preferences"
  ON public.preferences FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own preferences" ON public.preferences;
CREATE POLICY "Users can update their own preferences"
  ON public.preferences FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.preferences;
CREATE POLICY "Users can insert their own preferences"
  ON public.preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- PART 8: GRANT NECESSARY PERMISSIONS
-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant access to profiles
GRANT SELECT, INSERT, UPDATE ON public.profiles TO anon, authenticated;

-- Grant access to preferences
GRANT SELECT, INSERT, UPDATE ON public.preferences TO anon, authenticated;

-- Grant access to the confirm_user_email function
GRANT EXECUTE ON FUNCTION public.confirm_user_email(TEXT) TO service_role;

-- PART 9: CONFIRM SPECIFIC USER (REPLACE WITH YOUR EMAIL)
SELECT confirm_user_email('qossai.doubaa@gmail.com') as user_confirmed;

-- PART 10: SHOW CONFIRMATION
SELECT 'Authentication setup complete!' as status;
