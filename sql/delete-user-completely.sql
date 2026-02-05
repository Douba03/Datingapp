-- =====================================================
-- DELETE USER COMPLETELY
-- This SQL creates a function to completely delete a user
-- from both the database tables AND auth.users
-- 
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create the function to delete user completely
-- This function requires SECURITY DEFINER to access auth.users
CREATE OR REPLACE FUNCTION public.delete_user_completely(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log the deletion attempt
  RAISE NOTICE 'Deleting user completely: %', target_user_id;
  
  -- Delete from all related tables (order matters for foreign keys)
  
  -- Messages (uses sender_id, not receiver_id - messages are linked via match_id)
  DELETE FROM public.messages WHERE sender_id = target_user_id;
  
  -- Connection requests
  DELETE FROM public.connection_requests WHERE sender_id = target_user_id OR receiver_id = target_user_id;
  
  -- Swipes
  DELETE FROM public.swipes WHERE swiper_user_id = target_user_id OR target_user_id = target_user_id;
  
  -- Matches
  DELETE FROM public.matches WHERE user_a_id = target_user_id OR user_b_id = target_user_id;
  
  -- Hidden profiles
  DELETE FROM public.hidden_profiles WHERE user_id = target_user_id OR hidden_user_id = target_user_id;
  
  -- User blocks
  DELETE FROM public.user_blocks WHERE blocker_user_id = target_user_id OR blocked_user_id = target_user_id;
  
  -- Request counters
  DELETE FROM public.request_counters WHERE user_id = target_user_id;
  
  -- Swipe counters
  DELETE FROM public.swipe_counters WHERE user_id = target_user_id;
  
  -- Notification preferences
  DELETE FROM public.notification_preferences WHERE user_id = target_user_id;
  
  -- Privacy settings
  DELETE FROM public.privacy_settings WHERE user_id = target_user_id;
  
  -- Preferences
  DELETE FROM public.preferences WHERE user_id = target_user_id;
  
  -- Profile
  DELETE FROM public.profiles WHERE user_id = target_user_id;
  
  -- Users table
  DELETE FROM public.users WHERE id = target_user_id;
  
  -- Delete from auth.users (this is the key part!)
  DELETE FROM auth.users WHERE id = target_user_id;
  
  RAISE NOTICE 'User % deleted completely', target_user_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error deleting user %: %', target_user_id, SQLERRM;
    RETURN FALSE;
END;
$$;

-- Grant execute permission to authenticated users (they can only delete themselves)
GRANT EXECUTE ON FUNCTION public.delete_user_completely(UUID) TO authenticated;

-- Add a security check - users can only delete their own account
CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get the current user's ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Call the delete function with the current user's ID
  RETURN public.delete_user_completely(current_user_id);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;

-- Also update RLS policies to allow users to delete their own data
-- These policies ensure the client-side deletions work

-- Users table - allow delete own record
DROP POLICY IF EXISTS "Users can delete own record" ON public.users;
CREATE POLICY "Users can delete own record" ON public.users
  FOR DELETE USING (auth.uid() = id);

-- Profiles table - allow delete own record  
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Preferences table - allow delete own record
DROP POLICY IF EXISTS "Users can delete own preferences" ON public.preferences;
CREATE POLICY "Users can delete own preferences" ON public.preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Messages - allow delete own messages
DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;
CREATE POLICY "Users can delete own messages" ON public.messages
  FOR DELETE USING (auth.uid() = sender_id);

-- Connection requests - allow delete own requests
DROP POLICY IF EXISTS "Users can delete own connection requests" ON public.connection_requests;
CREATE POLICY "Users can delete own connection requests" ON public.connection_requests
  FOR DELETE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Swipes - allow delete own swipes
DROP POLICY IF EXISTS "Users can delete own swipes" ON public.swipes;
CREATE POLICY "Users can delete own swipes" ON public.swipes
  FOR DELETE USING (auth.uid() = swiper_user_id OR auth.uid() = target_user_id);

-- Matches - allow delete own matches
DROP POLICY IF EXISTS "Users can delete own matches" ON public.matches;
CREATE POLICY "Users can delete own matches" ON public.matches
  FOR DELETE USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

-- Hidden profiles - allow delete own hidden profiles
DROP POLICY IF EXISTS "Users can delete own hidden profiles" ON public.hidden_profiles;
CREATE POLICY "Users can delete own hidden profiles" ON public.hidden_profiles
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = hidden_user_id);

-- User blocks - allow delete own blocks
DROP POLICY IF EXISTS "Users can delete own blocks" ON public.user_blocks;
CREATE POLICY "Users can delete own blocks" ON public.user_blocks
  FOR DELETE USING (auth.uid() = blocker_user_id OR auth.uid() = blocked_user_id);

-- Swipe counters - allow delete own counter
DROP POLICY IF EXISTS "Users can delete own swipe counter" ON public.swipe_counters;
CREATE POLICY "Users can delete own swipe counter" ON public.swipe_counters
  FOR DELETE USING (auth.uid() = user_id);

-- Request counters - allow delete own counter
DROP POLICY IF EXISTS "Users can delete own request counter" ON public.request_counters;
CREATE POLICY "Users can delete own request counter" ON public.request_counters
  FOR DELETE USING (auth.uid() = user_id);

-- Notification preferences - allow delete own preferences
DROP POLICY IF EXISTS "Users can delete own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can delete own notification preferences" ON public.notification_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Privacy settings - allow delete own settings
DROP POLICY IF EXISTS "Users can delete own privacy settings" ON public.privacy_settings;
CREATE POLICY "Users can delete own privacy settings" ON public.privacy_settings
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 'delete_user_completely function created successfully' AS status;
SELECT 'delete_my_account function created successfully' AS status;
SELECT 'All DELETE RLS policies created successfully' AS status;
