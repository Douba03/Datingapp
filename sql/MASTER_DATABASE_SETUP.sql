-- =====================================================
-- MASTER DATABASE SETUP FOR CALAFDOON
-- =====================================================
-- This is the SINGLE SOURCE OF TRUTH for database setup
-- Run this file ONCE in Supabase SQL Editor
-- DO NOT run other SQL files that create the same tables
-- =====================================================

-- =====================================================
-- STEP 1: CREATE ENUMS
-- =====================================================

-- Request status enum
DO $$ BEGIN
  CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'declined');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Decline reason enum
DO $$ BEGIN
  CREATE TYPE decline_reason AS ENUM (
    'not_interested',
    'different_values', 
    'location_too_far',
    'age_preference',
    'already_talking',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- STEP 2: CREATE USERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  auth_provider TEXT DEFAULT 'email',
  status TEXT DEFAULT 'active',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,
  premium_until TIMESTAMPTZ,
  grace_period_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;

-- Create RLS policies
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- STEP 3: CREATE REQUEST_COUNTERS TABLE
-- =====================================================
-- IMPORTANT: Using user_id as PRIMARY KEY (no separate id column)
-- This matches the migration file schema

CREATE TABLE IF NOT EXISTS request_counters (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  remaining INTEGER NOT NULL DEFAULT 10,
  last_exhausted_at TIMESTAMPTZ,
  next_refill_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE request_counters ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own counter" ON request_counters;
DROP POLICY IF EXISTS "Users can update their own counter" ON request_counters;
DROP POLICY IF EXISTS "Users can insert their own counter" ON request_counters;

-- Create RLS policies
CREATE POLICY "Users can view their own counter" ON request_counters
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own counter" ON request_counters
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own counter" ON request_counters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- STEP 4: CREATE CONNECTION_REQUESTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS connection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status request_status NOT NULL DEFAULT 'pending',
  message TEXT,
  decline_reason decline_reason,
  decline_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE(sender_id, receiver_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_connection_requests_sender ON connection_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_receiver ON connection_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_status ON connection_requests(status);
CREATE INDEX IF NOT EXISTS idx_connection_requests_created ON connection_requests(created_at DESC);

-- Enable RLS
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own requests" ON connection_requests;
DROP POLICY IF EXISTS "Users can send requests" ON connection_requests;
DROP POLICY IF EXISTS "Users can respond to received requests" ON connection_requests;

-- Create RLS policies
CREATE POLICY "Users can view their own requests" ON connection_requests
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send requests" ON connection_requests
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can respond to received requests" ON connection_requests
  FOR UPDATE USING (auth.uid() = receiver_id) WITH CHECK (auth.uid() = receiver_id);

-- =====================================================
-- STEP 5: CREATE HIDDEN_PROFILES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS hidden_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hidden_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL DEFAULT 'not_looking_for',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, hidden_user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hidden_profiles_user_id ON hidden_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_hidden_profiles_hidden_user_id ON hidden_profiles(hidden_user_id);
CREATE INDEX IF NOT EXISTS idx_hidden_profiles_created_at ON hidden_profiles(created_at DESC);

-- Enable RLS
ALTER TABLE hidden_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own hidden profiles" ON hidden_profiles;
DROP POLICY IF EXISTS "Users can hide profiles" ON hidden_profiles;
DROP POLICY IF EXISTS "Users can unhide profiles" ON hidden_profiles;

-- Create RLS policies
CREATE POLICY "Users can view their own hidden profiles" ON hidden_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can hide profiles" ON hidden_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unhide profiles" ON hidden_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- STEP 6: CREATE USER_BLOCKS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(blocker_user_id, blocked_user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON user_blocks(blocker_user_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks(blocked_user_id);

-- Enable RLS
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own blocks" ON user_blocks;
DROP POLICY IF EXISTS "Users can block other users" ON user_blocks;
DROP POLICY IF EXISTS "Users can unblock users" ON user_blocks;

-- Create RLS policies
CREATE POLICY "Users can view their own blocks" ON user_blocks
  FOR SELECT USING (auth.uid() = blocker_user_id);

CREATE POLICY "Users can block other users" ON user_blocks
  FOR INSERT WITH CHECK (auth.uid() = blocker_user_id);

CREATE POLICY "Users can unblock users" ON user_blocks
  FOR DELETE USING (auth.uid() = blocker_user_id);

-- =====================================================
-- STEP 7: CREATE FUNCTIONS
-- =====================================================

-- Function: Auto-create request counter for new users
CREATE OR REPLACE FUNCTION create_request_counter_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO request_counters (user_id, remaining)
  VALUES (NEW.id, 10)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Handle accepted requests (create match)
CREATE OR REPLACE FUNCTION handle_request_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO matches (user_a_id, user_b_id, status, created_at)
    VALUES (
      LEAST(NEW.sender_id, NEW.receiver_id),
      GREATEST(NEW.sender_id, NEW.receiver_id),
      'active',
      NOW()
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check and refill requests
CREATE OR REPLACE FUNCTION check_and_refill_requests()
RETURNS void AS $$
BEGIN
  UPDATE request_counters
  SET 
    remaining = 10,
    last_exhausted_at = NULL,
    next_refill_at = NULL,
    updated_at = NOW()
  WHERE 
    next_refill_at IS NOT NULL 
    AND next_refill_at <= NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Hide profile (RPC)
CREATE OR REPLACE FUNCTION hide_profile(target_user_id UUID, reason TEXT DEFAULT 'not_looking_for')
RETURNS void AS $$
BEGIN
  INSERT INTO hidden_profiles (user_id, hidden_user_id, reason)
  VALUES (auth.uid(), target_user_id, reason)
  ON CONFLICT (user_id, hidden_user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Unhide profile (RPC)
CREATE OR REPLACE FUNCTION unhide_profile(target_user_id UUID)
RETURNS void AS $$
BEGIN
  DELETE FROM hidden_profiles
  WHERE user_id = auth.uid() AND hidden_user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 8: CREATE TRIGGERS
-- =====================================================

-- Drop existing triggers
DROP TRIGGER IF EXISTS on_auth_user_created_request_counter ON auth.users;
DROP TRIGGER IF EXISTS on_request_accepted ON connection_requests;

-- Trigger: Auto-create request counter for new users
CREATE TRIGGER on_auth_user_created_request_counter
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_request_counter_for_new_user();

-- Trigger: Handle accepted requests
CREATE TRIGGER on_request_accepted
  AFTER UPDATE ON connection_requests
  FOR EACH ROW
  WHEN (NEW.status = 'accepted' AND OLD.status = 'pending')
  EXECUTE FUNCTION handle_request_accepted();

-- =====================================================
-- STEP 9: CREATE REQUEST COUNTERS FOR EXISTING USERS
-- =====================================================

INSERT INTO request_counters (user_id, remaining)
SELECT id, 10
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM request_counters)
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- STEP 10: GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION create_request_counter_for_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_request_accepted() TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_refill_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION hide_profile(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION unhide_profile(UUID) TO authenticated;

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT 
  'Setup complete!' as status,
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM request_counters) as users_with_counters,
  (SELECT COUNT(*) FROM connection_requests) as total_requests,
  (SELECT COUNT(*) FROM hidden_profiles) as total_hidden,
  (SELECT COUNT(*) FROM user_blocks) as total_blocks;
