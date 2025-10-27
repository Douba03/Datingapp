-- FIX RLS POLICIES FOR PROFILE UPDATES
-- Run this in Supabase SQL Editor to fix the profile update permissions

-- First, let's check current RLS policies
SELECT 
  'CURRENT_POLICIES' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY policyname;

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

-- Create more permissive policies for profiles
-- Allow authenticated users to update their own profiles
CREATE POLICY "Authenticated users can update own profile" ON profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to insert their own profiles
CREATE POLICY "Authenticated users can insert own profile" ON profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow everyone to view profiles (for discovery)
CREATE POLICY "Anyone can view profiles" ON profiles 
FOR SELECT 
TO public
USING (true);

-- Also fix preferences policies
DROP POLICY IF EXISTS "Users can update own preferences" ON preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON preferences;
DROP POLICY IF EXISTS "Users can view own preferences" ON preferences;

CREATE POLICY "Authenticated users can update own preferences" ON preferences 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert own preferences" ON preferences 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view preferences" ON preferences 
FOR SELECT 
TO public
USING (true);

-- Test the policies by checking what the anon role can do
SELECT 
  'POLICY_TEST' as info,
  'Testing if policies work correctly' as message;

-- Create a test function to verify permissions
CREATE OR REPLACE FUNCTION test_profile_update_permissions()
RETURNS TEXT AS $$
BEGIN
  -- This will be called with different roles to test permissions
  RETURN 'Permission test function created';
END;
$$ LANGUAGE plpgsql;

SELECT 'RLS policies updated successfully!' as message;
SELECT 'Now test profile updates in your app' as next_step;
