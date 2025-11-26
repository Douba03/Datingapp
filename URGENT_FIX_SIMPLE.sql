-- URGENT: Simple fix for signup error
-- Copy this ENTIRE file and paste into Supabase SQL Editor

-- Step 1: Drop old trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Step 2: Create the function with correct syntax
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Auto-confirm email
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = NEW.id AND email_confirmed_at IS NULL;
  
  -- Get first name from email or metadata
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
    COALESCE((NEW.raw_user_meta_data->>'first_name')::TEXT, split_part(NEW.email, '@', 1)),
    'prefer_not_to_say',
    '1995-01-01',
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create preferences
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
$$;

-- Step 3: Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role, authenticated, anon;

-- Step 5: Show success
SELECT 'Signup fixed!' as status;

