-- DISABLE EMAIL CONFIRMATION
-- Run this in Supabase SQL Editor to disable email confirmation

-- Step 1: Update existing users to mark them as confirmed
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    confirmed_at = COALESCE(confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- Step 2: Create a function to manually confirm users
CREATE OR REPLACE FUNCTION public.confirm_user_email(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE auth.users 
  SET email_confirmed_at = NOW(),
      confirmed_at = NOW()
  WHERE email = user_email;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create or replace the handle_new_user function to auto-confirm emails
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-confirm email for new users
  UPDATE auth.users
  SET email_confirmed_at = NOW(),
      confirmed_at = NOW()
  WHERE id = NEW.id AND email_confirmed_at IS NULL;
  
  -- Create a profile entry
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
    COALESCE(
      (NEW.raw_user_meta_data->>'first_name')::text, 
      split_part(NEW.email, '@', 1)
    ),
    'prefer_not_to_say',
    '1995-01-01',
    NOW(),
    NOW()
  );
  
  -- Create preferences entry
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
    40,
    50,
    'dating',
    25,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Make sure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Step 5: Confirm a specific user (replace with your email)
SELECT confirm_user_email('qossai.doubaa@gmail.com') as user_confirmed;

-- Step 6: Show confirmation
SELECT 'Email confirmation disabled and users confirmed!' as status;