-- Optimize database performance to prevent timeouts
-- Run this in Supabase SQL Editor

-- ============================================================================
-- 1. CHECK CURRENT STATE
-- ============================================================================

-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'preferences', 'swipes', 'matches', 'messages', 'swipe_counters')
ORDER BY tablename;

-- Check existing indexes on user_id columns
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
  AND (indexdef LIKE '%user_id%' OR indexdef LIKE '%swiper_user_id%' OR indexdef LIKE '%target_user_id%' OR indexdef LIKE '%sender_id%')
ORDER BY tablename, indexname;

-- Check existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- 2. CREATE MISSING INDEXES
-- ============================================================================

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON public.profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_age ON public.profiles(age);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

-- Preferences table indexes
CREATE INDEX IF NOT EXISTS idx_preferences_user_id ON public.preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_preferences_seeking_genders ON public.preferences USING GIN(seeking_genders);
CREATE INDEX IF NOT EXISTS idx_preferences_age_range ON public.preferences(age_min, age_max);

-- Swipes table indexes
CREATE INDEX IF NOT EXISTS idx_swipes_swiper_user_id ON public.swipes(swiper_user_id);
CREATE INDEX IF NOT EXISTS idx_swipes_target_user_id ON public.swipes(target_user_id);
CREATE INDEX IF NOT EXISTS idx_swipes_created_at ON public.swipes(created_at);
CREATE INDEX IF NOT EXISTS idx_swipes_action ON public.swipes(action);

-- Swipe counters table indexes
CREATE INDEX IF NOT EXISTS idx_swipe_counters_user_id ON public.swipe_counters(user_id);
CREATE INDEX IF NOT EXISTS idx_swipe_counters_next_refill ON public.swipe_counters(next_refill_at);

-- Matches table indexes
CREATE INDEX IF NOT EXISTS idx_matches_user_a_id ON public.matches(user_a_id);
CREATE INDEX IF NOT EXISTS idx_matches_user_b_id ON public.matches(user_b_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON public.matches(created_at);

-- Messages table indexes
CREATE INDEX IF NOT EXISTS idx_messages_match_id ON public.messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- ============================================================================
-- 3. OPTIMIZE POLICIES (if needed)
-- ============================================================================

-- Ensure policies are using the most efficient format
-- Drop and recreate with optimized queries

-- Profiles policies
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view other profiles" ON profiles;

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
USING (true);

-- Preferences policies
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
-- 4. CHECK FOR SLOW QUERIES OR BLOCKING
-- ============================================================================

-- Check for any currently running queries that might be slow
SELECT 
  pid,
  state,
  query_start,
  state_change,
  wait_event_type,
  wait_event,
  query
FROM pg_stat_activity 
WHERE state = 'active' 
  AND query NOT LIKE '%pg_stat_activity%'
  AND query NOT LIKE '%pg_stat_statements%'
ORDER BY query_start;

-- ============================================================================
-- 5. VERIFICATION
-- ============================================================================

-- Verify all indexes were created
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Verify policies are active
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

SELECT '✅ Database optimization complete!' as message;
SELECT 'All indexes created and policies optimized.' as status;
SELECT 'Try onboarding again - it should be much faster now.' as next_step;

