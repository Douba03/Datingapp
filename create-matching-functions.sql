-- Create the missing database functions and triggers for matching
-- Run this in Supabase SQL Editor

-- 1. Create the record_swipe function
CREATE OR REPLACE FUNCTION record_swipe(
  swiper_uuid UUID,
  target_uuid UUID,
  swipe_action TEXT
)
RETURNS JSON AS $$
DECLARE
  remaining_count INTEGER;
  is_match BOOLEAN := FALSE;
BEGIN
  -- Insert the swipe
  INSERT INTO swipes (swiper_user_id, target_user_id, action)
  VALUES (swiper_uuid, target_uuid, swipe_action)
  ON CONFLICT (swiper_user_id, target_user_id) DO UPDATE SET
    action = EXCLUDED.action,
    created_at = NOW();
  
  -- Get remaining swipes
  SELECT remaining INTO remaining_count
  FROM swipe_counters
  WHERE user_id = swiper_uuid;
  
  -- Check if it's a match (both users liked each other)
  IF EXISTS (
    SELECT 1 FROM swipes 
    WHERE swiper_user_id = target_uuid 
    AND target_user_id = swiper_uuid 
    AND action IN ('like', 'superlike')
  ) AND swipe_action IN ('like', 'superlike') THEN
    is_match := TRUE;
  END IF;
  
  RETURN json_build_object(
    'remaining', remaining_count,
    'is_match', is_match
  );
END;
$$ LANGUAGE plpgsql;

-- 2. Create the function to create matches on mutual likes
CREATE OR REPLACE FUNCTION create_match_on_mutual_like()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the target user has also liked the swiper
  IF EXISTS (
    SELECT 1 FROM swipes 
    WHERE swiper_user_id = NEW.target_user_id 
    AND target_user_id = NEW.swiper_user_id 
    AND action IN ('like', 'superlike')
  ) AND NEW.action IN ('like', 'superlike') THEN
    -- Create a match
    INSERT INTO matches (user_a_id, user_b_id, created_at)
    VALUES (
      LEAST(NEW.swiper_user_id, NEW.target_user_id),
      GREATEST(NEW.swiper_user_id, NEW.target_user_id),
      NOW()
    )
    ON CONFLICT (user_a_id, user_b_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create the trigger to automatically create matches
DROP TRIGGER IF EXISTS trigger_create_match ON swipes;
CREATE TRIGGER trigger_create_match
  AFTER INSERT ON swipes
  FOR EACH ROW
  EXECUTE FUNCTION create_match_on_mutual_like();

-- 4. Create function to update swipe counters
CREATE OR REPLACE FUNCTION update_swipe_counter()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrease remaining swipes
  UPDATE swipe_counters 
  SET remaining = remaining - 1,
      updated_at = NOW()
  WHERE user_id = NEW.swiper_user_id;
  
  -- If no swipes left, set refill time
  UPDATE swipe_counters 
  SET last_exhausted_at = NOW(),
      next_refill_at = NOW() + INTERVAL '24 hours'
  WHERE user_id = NEW.swiper_user_id 
  AND remaining <= 0;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger to update swipe counters
DROP TRIGGER IF EXISTS trigger_update_swipe_counter ON swipes;
CREATE TRIGGER trigger_update_swipe_counter
  AFTER INSERT ON swipes
  FOR EACH ROW
  EXECUTE FUNCTION update_swipe_counter();

-- 6. Test the function
SELECT 'Database functions and triggers created successfully!' as message;

-- 7. Check if everything was created
SELECT 
  'Functions created:' as info,
  routine_name
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('record_swipe', 'create_match_on_mutual_like', 'update_swipe_counter');

SELECT 
  'Triggers created:' as info,
  trigger_name
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND trigger_name IN ('trigger_create_match', 'trigger_update_swipe_counter');
