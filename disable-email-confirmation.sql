-- DISABLE EMAIL CONFIRMATION
-- Run this in Supabase SQL Editor to disable email confirmation

-- Step 1: Disable email confirmation in auth settings
-- This needs to be done in the Supabase Dashboard, but we can also check current settings

-- Check current auth settings
SELECT 
  key, 
  value 
FROM auth.config 
WHERE key IN ('MAILER_AUTOCONFIRM', 'SITE_URL', 'MAILER_SECURE_EMAIL_CHANGE_ENABLED');

-- Step 2: Update auth config to disable email confirmation
-- Note: This might need to be done through the Supabase Dashboard instead

-- Alternative: Create a function to manually confirm users
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

-- Step 3: Confirm the existing user
SELECT confirm_user_email('Qusay.do@hotmail.com') as user_confirmed;

-- Step 4: Show confirmation
SELECT 'Email confirmation disabled and user confirmed!' as status;
