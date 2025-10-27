-- Run this in Supabase SQL Editor to disable email confirmation
-- This allows users to sign up without needing to confirm their email
-- (Good for testing/development)

-- This is a configuration setting, not a SQL command
-- You need to do this in the Supabase Dashboard:

-- 1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/auth/settings
-- 2. Scroll to "Email Auth"
-- 3. UNCHECK "Enable email confirmations"
-- 4. Click "Save"

-- OR you can use the Supabase API:
-- But it's easier to just use the dashboard

-- After disabling, users can sign up and log in immediately without email confirmation!

-- NOTE: For production, you should re-enable this for security
-- But for development/testing, it's fine to disable it
