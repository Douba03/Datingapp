-- SIMPLE SOLUTION: Disable ALL triggers and let the app handle everything

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS trigger_create_default_notification_preferences ON auth.users CASCADE;
DROP TRIGGER IF EXISTS trigger_create_default_privacy_settings ON auth.users CASCADE;

-- Drop the functions too to avoid any confusion
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_default_notification_preferences() CASCADE;
DROP FUNCTION IF EXISTS public.create_default_privacy_settings() CASCADE;

-- Show success
SELECT 'All triggers disabled! App will handle signup now.' as status;

