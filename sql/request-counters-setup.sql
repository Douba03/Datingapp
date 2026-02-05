-- =====================================================
-- REQUEST COUNTERS SETUP FOR CALAFDOON
-- =====================================================
-- This SQL sets up automatic request counter creation
-- for new users with 10 requests, 8-hour refill timer,
-- and unlimited requests for premium users.
-- =====================================================

-- 1. Create the request_counters table if it doesn't exist
CREATE TABLE IF NOT EXISTS request_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  remaining INTEGER NOT NULL DEFAULT 10,
  last_exhausted_at TIMESTAMPTZ,
  next_refill_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. Enable RLS on request_counters
ALTER TABLE request_counters ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own request counter" ON request_counters;
DROP POLICY IF EXISTS "Users can update own request counter" ON request_counters;
DROP POLICY IF EXISTS "Users can insert own request counter" ON request_counters;

-- 4. Create RLS policies
CREATE POLICY "Users can view own request counter" ON request_counters
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own request counter" ON request_counters
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own request counter" ON request_counters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Create function to automatically create request counter for new users
CREATE OR REPLACE FUNCTION create_request_counter_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO request_counters (user_id, remaining)
  VALUES (NEW.id, 10)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_request_counter ON auth.users;

-- 7. Create trigger to auto-create request counter when user signs up
CREATE TRIGGER on_auth_user_created_request_counter
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_request_counter_for_new_user();

-- 8. Create function to check and refill requests (called by app)
CREATE OR REPLACE FUNCTION check_and_refill_requests(p_user_id UUID)
RETURNS TABLE (
  remaining INTEGER,
  next_refill_at TIMESTAMPTZ,
  is_premium BOOLEAN
) AS $$
DECLARE
  v_is_premium BOOLEAN;
  v_remaining INTEGER;
  v_next_refill TIMESTAMPTZ;
BEGIN
  -- Check if user is premium
  SELECT u.is_premium INTO v_is_premium
  FROM users u
  WHERE u.id = p_user_id;

  -- Premium users always have unlimited
  IF v_is_premium = TRUE THEN
    RETURN QUERY SELECT 999999, NULL::TIMESTAMPTZ, TRUE;
    RETURN;
  END IF;

  -- Get current counter
  SELECT rc.remaining, rc.next_refill_at 
  INTO v_remaining, v_next_refill
  FROM request_counters rc
  WHERE rc.user_id = p_user_id;

  -- If no counter exists, create one
  IF NOT FOUND THEN
    INSERT INTO request_counters (user_id, remaining)
    VALUES (p_user_id, 10)
    RETURNING request_counters.remaining, request_counters.next_refill_at
    INTO v_remaining, v_next_refill;
  END IF;

  -- Check if refill time has passed
  IF v_next_refill IS NOT NULL AND NOW() >= v_next_refill THEN
    UPDATE request_counters
    SET remaining = 10,
        next_refill_at = NULL,
        last_exhausted_at = NULL,
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING request_counters.remaining, request_counters.next_refill_at
    INTO v_remaining, v_next_refill;
  END IF;

  RETURN QUERY SELECT v_remaining, v_next_refill, FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create function to decrement request counter
CREATE OR REPLACE FUNCTION use_request(p_user_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  remaining INTEGER,
  next_refill_at TIMESTAMPTZ
) AS $$
DECLARE
  v_is_premium BOOLEAN;
  v_remaining INTEGER;
  v_next_refill TIMESTAMPTZ;
BEGIN
  -- Check if user is premium
  SELECT u.is_premium INTO v_is_premium
  FROM users u
  WHERE u.id = p_user_id;

  -- Premium users don't use credits
  IF v_is_premium = TRUE THEN
    RETURN QUERY SELECT TRUE, 999999, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  -- Get current remaining
  SELECT rc.remaining INTO v_remaining
  FROM request_counters rc
  WHERE rc.user_id = p_user_id;

  -- Check if user has requests left
  IF v_remaining IS NULL OR v_remaining <= 0 THEN
    SELECT rc.remaining, rc.next_refill_at 
    INTO v_remaining, v_next_refill
    FROM request_counters rc
    WHERE rc.user_id = p_user_id;
    
    RETURN QUERY SELECT FALSE, COALESCE(v_remaining, 0), v_next_refill;
    RETURN;
  END IF;

  -- Decrement counter
  UPDATE request_counters
  SET remaining = remaining - 1,
      next_refill_at = CASE 
        WHEN remaining - 1 <= 0 THEN NOW() + INTERVAL '8 hours'
        ELSE next_refill_at
      END,
      last_exhausted_at = CASE 
        WHEN remaining - 1 <= 0 THEN NOW()
        ELSE last_exhausted_at
      END,
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING request_counters.remaining, request_counters.next_refill_at
  INTO v_remaining, v_next_refill;

  RETURN QUERY SELECT TRUE, v_remaining, v_next_refill;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Reset all existing users' request counters to 10
UPDATE request_counters
SET remaining = 10,
    next_refill_at = NULL,
    last_exhausted_at = NULL,
    updated_at = NOW();

-- 11. Create request counters for any existing users who don't have one
INSERT INTO request_counters (user_id, remaining)
SELECT id, 10
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM request_counters)
ON CONFLICT (user_id) DO NOTHING;

-- 12. Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION check_and_refill_requests(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION use_request(UUID) TO authenticated;

-- =====================================================
-- SUMMARY:
-- - New users automatically get 10 requests
-- - When requests run out, 8-hour timer starts
-- - Premium users (is_premium = true) have unlimited
-- - Run this SQL in Supabase SQL Editor
-- =====================================================
