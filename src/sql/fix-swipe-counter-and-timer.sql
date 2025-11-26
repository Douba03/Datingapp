-- FIX SWIPE COUNTER AND 12-HOUR REFILL TIMER
-- This script fixes the swipe counter to only decrement by 1 and sets up 12-hour refills
-- Run this in Supabase SQL Editor

-- First, remove the duplicate trigger that's causing double decrement
DROP TRIGGER IF EXISTS trigger_update_swipe_counter ON swipes;

-- Create new update_swipe_counter function that won't be called by trigger
-- This is kept for reference but won't be used
CREATE OR REPLACE FUNCTION update_swipe_counter()
RETURNS TRIGGER AS $$
BEGIN
  -- This function is intentionally empty now
  -- We handle swipe counter updates directly in record_swipe function
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Completely rewrite the record_swipe function to handle all logic properly
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
  result JSON;
  is_new_swipe BOOLEAN := FALSE;
BEGIN
  -- Check if swiper is trying to swipe on themselves
  IF swiper_uuid = target_uuid THEN
    RAISE EXCEPTION 'Cannot swipe on yourself';
  END IF;

  -- Get or create swipe counter
  INSERT INTO swipe_counters (user_id, remaining)
  VALUES (swiper_uuid, 10)
  ON CONFLICT (user_id) DO NOTHING;

  -- Get remaining swipes
  SELECT remaining INTO remaining_swipes
  FROM swipe_counters
  WHERE user_id = swiper_uuid;

  -- Check if swipe already exists
  SELECT * INTO existing_swipe
  FROM swipes
  WHERE swiper_user_id = swiper_uuid AND target_user_id = target_uuid;

  IF existing_swipe IS NOT NULL THEN
    -- Swipe already exists, just update it
    UPDATE swipes
    SET action = swipe_action::swipe_action,
        created_at = NOW()
    WHERE swiper_user_id = swiper_uuid AND target_user_id = target_uuid;
    
    -- Don't decrement counter for re-swipes
    result := json_build_object(
      'success', true,
      'is_match', false,
      'remaining', remaining_swipes,
      'message', 'Swipe updated'
    );
    RETURN result;
  ELSE
    -- This is a new swipe - decrement counter
    is_new_swipe := TRUE;
    
    -- Check if user has swipes remaining BEFORE inserting
    IF remaining_swipes <= 0 THEN
      result := json_build_object(
        'success', false,
        'error', 'No swipes remaining',
        'remaining', 0
      );
      RETURN result;
    END IF;
    
    -- Insert new swipe
    INSERT INTO swipes (swiper_user_id, target_user_id, action)
    VALUES (swiper_uuid, target_uuid, swipe_action::swipe_action);
    
    -- Decrement swipe counter for new swipe only
    UPDATE swipe_counters
    SET remaining = remaining - 1
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

-- Create a function to check and refill swipes based on 12-hour timer
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

-- Create a scheduled job or cron to run check_and_refill_swipes every hour
-- Note: This might need to be set up in Supabase Dashboard > Database > Cron Jobs
-- For now, the app can call this function periodically

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION record_swipe(UUID, UUID, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION check_and_refill_swipes() TO authenticated;

-- Test message
SELECT 'Swipe counter fixes applied successfully! Swipes now decrement by 1 and refill every 12 hours.' as message;
