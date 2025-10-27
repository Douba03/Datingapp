-- Fix ALL RLS policies for onboarding to work
-- Run this in Supabase SQL Editor

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view other profiles" ON profiles;

-- Create new policies
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view other profiles"
ON profiles FOR SELECT
TO authenticated
USING (true); -- Allow viewing all profiles for discovery

-- ============================================================================
-- PREFERENCES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert own preferences" ON preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON preferences;
DROP POLICY IF EXISTS "Users can read own preferences" ON preferences;

CREATE POLICY "Users can insert own preferences"
ON preferences FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
ON preferences FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own preferences"
ON preferences FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================================
-- SWIPES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert own swipes" ON swipes;
DROP POLICY IF EXISTS "Users can read own swipes" ON swipes;

CREATE POLICY "Users can insert own swipes"
ON swipes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = swiper_user_id);

CREATE POLICY "Users can read own swipes"
ON swipes FOR SELECT
TO authenticated
USING (auth.uid() = swiper_user_id OR auth.uid() = target_user_id);

-- ============================================================================
-- SWIPE_COUNTERS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can read own swipe counter" ON swipe_counters;
DROP POLICY IF EXISTS "Users can update own swipe counter" ON swipe_counters;
DROP POLICY IF EXISTS "Users can insert own swipe counter" ON swipe_counters;

CREATE POLICY "Users can insert own swipe counter"
ON swipe_counters FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own swipe counter"
ON swipe_counters FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own swipe counter"
ON swipe_counters FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- MATCHES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can read own matches" ON matches;

CREATE POLICY "Users can read own matches"
ON matches FOR SELECT
TO authenticated
USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

-- ============================================================================
-- MESSAGES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert messages in own matches" ON messages;
DROP POLICY IF EXISTS "Users can read messages in own matches" ON messages;

CREATE POLICY "Users can insert messages in own matches"
ON messages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = messages.match_id
    AND (matches.user_a_id = auth.uid() OR matches.user_b_id = auth.uid())
  )
);

CREATE POLICY "Users can read messages in own matches"
ON messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = messages.match_id
    AND (matches.user_a_id = auth.uid() OR matches.user_b_id = auth.uid())
  )
);

-- ============================================================================
-- STORAGE POLICIES (if bucket exists)
-- ============================================================================

-- Drop existing storage policies
DROP POLICY IF EXISTS "Users can upload own photos" ON storage.objects;
DROP POLICY IF EXISTS "Photos are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;

-- Create storage policies
CREATE POLICY "Users can upload own photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Photos are publicly viewable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');

CREATE POLICY "Users can update own photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check that all policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

SELECT '✅ All RLS policies have been fixed!' as message;
SELECT 'Now try creating an account and completing onboarding.' as next_step;


