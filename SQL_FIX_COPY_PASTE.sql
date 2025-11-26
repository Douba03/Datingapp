-- COMPLETE FIX: Remove ALL triggers and recreate them properly
-- This will fix the signup issue

-- Step 1: Drop ALL existing triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trigger_create_match ON swipes;
DROP TRIGGER IF EXISTS trigger_update_swipe_counter ON swipes;

-- Step 2: Drop and recreate the handle_new_user function properly
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $func$
DECLARE
  default_first_name TEXT;
BEGIN
  -- Auto-confirm email for new users
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = NEW.id AND email_confirmed_at IS NULL;
  
  -- Extract first name from email
  default_first_name := COALESCE(
    (NEW.raw_user_meta_data->>'first_name')::TEXT, 
    split_part(NEW.email, '@', 1)
  );
  
  -- Create profile
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
$func$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Recreate the trigger with correct syntax
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role, authenticated, anon;

-- Step 5: Show success message
SELECT 'Triggers fixed! Signup should work now.' as status;

