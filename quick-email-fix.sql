-- QUICK FIX: Confirm existing user and disable email confirmation
-- Run this in Supabase SQL Editor

-- Step 1: Manually confirm the existing user
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  confirmed_at = NOW()
WHERE email = 'Qusay.do@hotmail.com';

-- Step 2: Create a function to auto-confirm future users
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-confirm the user immediately after creation
  NEW.email_confirmed_at = NOW();
  NEW.confirmed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create trigger to auto-confirm new users
DROP TRIGGER IF EXISTS auto_confirm_user_trigger ON auth.users;
CREATE TRIGGER auto_confirm_user_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_user();

-- Step 4: Verify the fix
SELECT 
  email, 
  email_confirmed_at, 
  confirmed_at 
FROM auth.users 
WHERE email = 'Qusay.do@hotmail.com';

SELECT 'Email confirmation disabled! Try logging in now.' as message;
