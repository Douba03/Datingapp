-- SQL script to disable email confirmation in Supabase
-- Run this in the Supabase SQL editor to allow users to sign up without email verification

-- Update auth.users to mark all unconfirmed users as confirmed
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- Modify the trigger to automatically confirm new users' emails
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-confirm email for new users
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = NEW.id AND email_confirmed_at IS NULL;
  
  -- Create a profile entry
  INSERT INTO public.profiles (user_id, first_name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
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

-- Make sure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Set the auth.email_confirmations table to auto-confirm
CREATE OR REPLACE FUNCTION auth.auto_confirm_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = NEW.user_id AND email_confirmed_at IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to auto-confirm emails
DROP TRIGGER IF EXISTS auto_confirm_email ON auth.email_confirmations;
CREATE TRIGGER auto_confirm_email
  AFTER INSERT ON auth.email_confirmations
  FOR EACH ROW EXECUTE PROCEDURE auth.auto_confirm_email();

-- Update auth settings to not require email confirmation
-- Note: This requires admin access to update auth settings
-- You may need to do this through the Supabase dashboard
