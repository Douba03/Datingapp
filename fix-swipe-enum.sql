-- Fix the swipe action enum type issue
-- Run this in Supabase SQL Editor

-- 1. First, check what enum values exist
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (
  SELECT oid 
  FROM pg_type 
  WHERE typname = 'swipe_action'
);

-- 2. Update the record_swipe function to cast text to enum
CREATE OR REPLACE FUNCTION record_swipe(
  swiper_uuid UUID,
  target_uuid UUID,
  swipe_action TEXT
)
RETURNS JSON AS $$
DECLARE
  remaining_count INTEGER;
  is_match BOOLEAN := FALSE;
  swipe_action_enum swipe_action;
BEGIN
  -- Cast text to enum type
  swipe_action_enum := swipe_action::swipe_action;
  
  -- Insert the swipe with enum type
  INSERT INTO swipes (swiper_user_id, target_user_id, action)
  VALUES (swiper_uuid, target_uuid, swipe_action_enum)
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
  ) AND swipe_action_enum IN ('like', 'superlike') THEN
    is_match := TRUE;
  END IF;
  
  RETURN json_build_object(
    'remaining', remaining_count,
    'is_match', is_match
  );
END;
$$ LANGUAGE plpgsql;

-- 3. Also update the trigger function
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

-- 4. Test the function
SELECT record_swipe(
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  'like'
);

SELECT 'Swipe function fixed for enum type!' as message;
