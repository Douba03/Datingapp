-- =====================================================
-- STEP 2: CREATE TRIGGERS AND FUNCTIONS
-- =====================================================
-- Run this AFTER step 1 (creating the table)
-- =====================================================

-- 1. Create function to automatically create request counter for new users
CREATE OR REPLACE FUNCTION create_request_counter_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO request_counters (user_id, remaining)
  VALUES (NEW.id, 10)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_request_counter ON auth.users;

-- 3. Create trigger to auto-create request counter when user signs up
CREATE TRIGGER on_auth_user_created_request_counter
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_request_counter_for_new_user();

-- 4. Create function to check and refill requests (8 hour timer)
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

  -- Check if 8 hour refill time has passed
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

-- 5. Grant execute permissions
GRANT EXECUTE ON FUNCTION check_and_refill_requests(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_request_counter_for_new_user() TO authenticated;
