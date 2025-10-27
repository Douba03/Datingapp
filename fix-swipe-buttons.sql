-- Fix swipe buttons to handle duplicate swipes properly
-- Run this in Supabase SQL Editor

-- Drop and recreate the record_swipe function with proper duplicate handling
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
BEGIN
  -- Check if swiper is trying to swipe on themselves
  IF swiper_uuid = target_uuid THEN
    RAISE EXCEPTION 'Cannot swipe on yourself';
  END IF;

  -- Get or create swipe counter
  INSERT INTO swipe_counters (user_id, remaining)
  VALUES (swiper_uuid, 100)
  ON CONFLICT (user_id) DO NOTHING;

  -- Get remaining swipes
  SELECT remaining INTO remaining_swipes
  FROM swipe_counters
  WHERE user_id = swiper_uuid;

  -- Check if user has swipes remaining
  IF remaining_swipes <= 0 THEN
    result := json_build_object(
      'success', false,
      'error', 'No swipes remaining',
      'remaining', 0
    );
    RETURN result;
  END IF;

  -- Check if swipe already exists
  SELECT * INTO existing_swipe
  FROM swipes
  WHERE swiper_user_id = swiper_uuid AND target_user_id = target_uuid;

  IF existing_swipe IS NOT NULL THEN
    -- Update existing swipe with explicit cast
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
    -- Insert new swipe with explicit cast
    INSERT INTO swipes (swiper_user_id, target_user_id, action)
    VALUES (swiper_uuid, target_uuid, swipe_action::swipe_action);
    
    -- Decrement swipe counter only for new swipes
    UPDATE swipe_counters
    SET remaining = remaining - 1
    WHERE user_id = swiper_uuid;
    
    remaining_swipes := remaining_swipes - 1;
  END IF;

  -- Check for mutual like (match)
  IF swipe_action = 'like' OR swipe_action = 'superlike' THEN
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

-- Test the function
DO $$
DECLARE
  test_result JSON;
BEGIN
  -- This should work now even if the swipe already exists
  SELECT record_swipe(
    '430daeb0-c722-40de-976a-183036aade4a'::uuid,  -- Alice
    'ac4ccc9d-1611-443a-a4a5-6866663ea333'::uuid,  -- Bob
    'like'
  ) INTO test_result;
  
  RAISE NOTICE 'Test result: %', test_result;
END $$;

SELECT '✅ Swipe function fixed! Buttons should work now.' as message;

