-- SWIPE SYSTEM SETUP: 10 SWIPES WITH 12-HOUR REFILL
-- Run this in Supabase SQL Editor to set up the swipe system
-- Each user gets 10 swipes, which refill after 12 hours once exhausted

-- Drop existing triggers that might cause double decrement
DROP TRIGGER IF EXISTS trigger_update_swipe_counter ON swipes;

-- Create or update the swipe_counters table
CREATE TABLE IF NOT EXISTS swipe_counters (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  remaining INTEGER NOT NULL DEFAULT 10,
  last_exhausted_at TIMESTAMPTZ,
  next_refill_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on swipe_counters
ALTER TABLE swipe_counters ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and recreate
DROP POLICY IF EXISTS "Users can view own swipe counter" ON swipe_counters;
DROP POLICY IF EXISTS "Users can update own swipe counter" ON swipe_counters;
DROP POLICY IF EXISTS "Users can insert own swipe counter" ON swipe_counters;

CREATE POLICY "Users can view own swipe counter"
  ON swipe_counters FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own swipe counter"
  ON swipe_counters FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own swipe counter"
  ON swipe_counters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Main record_swipe function - handles 10 swipes with 12-hour refill
CREATE OR REPLACE FUNCTION record_swipe(
  swiper_uuid UUID,
  target_uuid UUID,
  swipe_action TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_swipe RECORD;
  reverse_swipe RECORD;
  new_match_id UUID;
  remaining_swipes INTEGER;
  is_premium BOOLEAN;
  result JSON;
BEGIN
  -- Check if swiper is trying to swipe on themselves
  IF swiper_uuid = target_uuid THEN
    RAISE EXCEPTION 'Cannot swipe on yourself';
  END IF;

  -- Check if user is premium (unlimited swipes)
  SELECT u.is_premium INTO is_premium
  FROM users u
  WHERE u.id = swiper_uuid;
  
  is_premium := COALESCE(is_premium, FALSE);

  -- Get or create swipe counter (start with 10 swipes)
  INSERT INTO swipe_counters (user_id, remaining)
  VALUES (swiper_uuid, 10)
  ON CONFLICT (user_id) DO NOTHING;

  -- Check and apply refill if timer has passed
  UPDATE swipe_counters
  SET remaining = 10,
      last_exhausted_at = NULL,
      next_refill_at = NULL,
      updated_at = NOW()
  WHERE user_id = swiper_uuid
    AND next_refill_at IS NOT NULL
    AND next_refill_at <= NOW()
    AND remaining <= 0;

  -- Get remaining swipes
  SELECT remaining INTO remaining_swipes
  FROM swipe_counters
  WHERE user_id = swiper_uuid;

  -- Check if swipe already exists (updating existing swipe doesn't count)
  SELECT * INTO existing_swipe
  FROM swipes
  WHERE swiper_user_id = swiper_uuid AND target_user_id = target_uuid;

  IF existing_swipe IS NOT NULL THEN
    -- Swipe already exists, just update it (no counter decrement)
    UPDATE swipes
    SET action = swipe_action::swipe_action,
        created_at = NOW()
    WHERE swiper_user_id = swiper_uuid AND target_user_id = target_uuid;
    
    result := json_build_object(
      'success', true,
      'is_match', false,
      'remaining', remaining_swipes,
      'message', 'Swipe updated'
    );
    RETURN result;
  END IF;

  -- This is a new swipe
  -- Premium users have unlimited swipes
  IF NOT is_premium THEN
    -- Check if user has swipes remaining
    IF remaining_swipes <= 0 THEN
      result := json_build_object(
        'success', false,
        'error', 'No swipes remaining',
        'remaining', 0,
        'next_refill_at', (SELECT next_refill_at FROM swipe_counters WHERE user_id = swiper_uuid)
      );
      RETURN result;
    END IF;
  END IF;
  
  -- Insert new swipe
  INSERT INTO swipes (swiper_user_id, target_user_id, action)
  VALUES (swiper_uuid, target_uuid, swipe_action::swipe_action);
  
  -- Decrement swipe counter for new swipe (only for non-premium users)
  IF NOT is_premium THEN
    UPDATE swipe_counters
    SET remaining = remaining - 1,
        updated_at = NOW()
    WHERE user_id = swiper_uuid;
    
    -- Update remaining count
    remaining_swipes := remaining_swipes - 1;
    
    -- If swipes exhausted, set refill time to 12 hours from now
    IF remaining_swipes <= 0 THEN
      UPDATE swipe_counters
      SET last_exhausted_at = NOW(),
          next_refill_at = NOW() + INTERVAL '12 hours'
      WHERE user_id = swiper_uuid;
    END IF;
  END IF;

  -- Check for mutual like (match)
  IF swipe_action IN ('like', 'superlike') THEN
    SELECT * INTO reverse_swipe
    FROM swipes
    WHERE swiper_user_id = target_uuid 
      AND target_user_id = swiper_uuid 
      AND action IN ('like', 'superlike');

    IF reverse_swipe IS NOT NULL THEN
      -- Create match
      INSERT INTO matches (user_a_id, user_b_id, status)
      VALUES (
        LEAST(swiper_uuid, target_uuid),
        GREATEST(swiper_uuid, target_uuid),
        'active'
      )
      ON CONFLICT (user_a_id, user_b_id) DO NOTHING
      RETURNING id INTO new_match_id;

      result := json_build_object(
        'success', true,
        'is_match', true,
        'match_id', new_match_id,
        'remaining', remaining_swipes
      );
      RETURN result;
    END IF;
  END IF;

  -- No match
  result := json_build_object(
    'success', true,
    'is_match', false,
    'remaining', remaining_swipes
  );
  RETURN result;
END;
$$;

-- Function to check and refill expired swipes
CREATE OR REPLACE FUNCTION check_and_refill_swipes()
RETURNS void AS $$
BEGIN
  UPDATE swipe_counters 
  SET remaining = 10,
      last_exhausted_at = NULL,
      next_refill_at = NULL,
      updated_at = NOW()
  WHERE next_refill_at IS NOT NULL
    AND next_refill_at <= NOW()
    AND remaining <= 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION record_swipe(UUID, UUID, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION check_and_refill_swipes() TO authenticated;

-- Reset all existing users to 10 swipes (fresh start)
-- Uncomment the line below if you want to reset everyone's swipes
-- UPDATE swipe_counters SET remaining = 10, last_exhausted_at = NULL, next_refill_at = NULL, updated_at = NOW();

-- Success message
SELECT 'Swipe system configured: 10 swipes per user, 12-hour refill after exhaustion!' as message;

