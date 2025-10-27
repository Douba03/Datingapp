-- Database Functions and Triggers for Partner Productivity App
-- Run these after the main schema

-- Function to create a match when both users like each other
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

-- Trigger to create matches automatically
CREATE TRIGGER trigger_create_match
  AFTER INSERT ON swipes
  FOR EACH ROW
  EXECUTE FUNCTION create_match_on_mutual_like();

-- Function to update last_message_at when a message is sent
CREATE OR REPLACE FUNCTION update_match_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE matches 
  SET last_message_at = NEW.created_at
  WHERE id = NEW.match_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update match last message time
CREATE TRIGGER trigger_update_match_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_match_last_message();

-- Function to handle swipe counter updates
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
      next_refill_at = NOW() + INTERVAL '12 hours'
  WHERE user_id = NEW.swiper_user_id 
  AND remaining <= 0;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update swipe counter
CREATE TRIGGER trigger_update_swipe_counter
  AFTER INSERT ON swipes
  FOR EACH ROW
  EXECUTE FUNCTION update_swipe_counter();

-- Function to refill swipes daily
CREATE OR REPLACE FUNCTION refill_daily_swipes()
RETURNS void AS $$
BEGIN
  UPDATE swipe_counters 
  SET remaining = 50,
      last_exhausted_at = NULL,
      next_refill_at = NULL,
      updated_at = NOW()
  WHERE next_refill_at <= NOW() 
  AND remaining <= 0;
END;
$$ LANGUAGE plpgsql;

-- Function to record a swipe (RPC function for the app)
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
  
  -- Check if it's a match
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

-- Function to generate AI icebreakers
CREATE OR REPLACE FUNCTION generate_ai_icebreakers(match_uuid UUID)
RETURNS TEXT[] AS $$
DECLARE
  icebreakers TEXT[] := ARRAY[
    'What''s the most interesting thing you''ve learned recently?',
    'If you could travel anywhere right now, where would you go?',
    'What''s your favorite way to spend a weekend?',
    'What''s something you''re really good at that most people don''t know?',
    'What''s the best book you''ve read this year?',
    'If you could have dinner with anyone, who would it be?',
    'What''s your go-to comfort food?',
    'What''s something you''re looking forward to?'
  ];
BEGIN
  -- Update the match with generated icebreakers
  UPDATE matches 
  SET ai_icebreakers = icebreakers,
      icebreakers_generated_at = NOW()
  WHERE id = match_uuid;
  
  RETURN icebreakers;
END;
$$ LANGUAGE plpgsql;
