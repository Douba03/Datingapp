-- Database triggers to automatically send push notifications
-- This file contains triggers that will call our Edge Functions when events occur

-- 1. Trigger for new matches
CREATE OR REPLACE FUNCTION notify_new_match()
RETURNS TRIGGER AS $$
DECLARE
  user1_id UUID;
  user2_id UUID;
  match_id UUID;
BEGIN
  -- Get the user IDs from the match
  user1_id := NEW.user1_id;
  user2_id := NEW.user2_id;
  match_id := NEW.id;

  -- Send notification to user1 about user2
  PERFORM net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/send-match-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
    ),
    body := jsonb_build_object(
      'user_id', user1_id,
      'matched_user_id', user2_id,
      'match_id', match_id
    )
  );

  -- Send notification to user2 about user1
  PERFORM net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/send-match-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
    ),
    body := jsonb_build_object(
      'user_id', user2_id,
      'matched_user_id', user1_id,
      'match_id', match_id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new matches
DROP TRIGGER IF EXISTS trigger_notify_new_match ON public.matches;
CREATE TRIGGER trigger_notify_new_match
  AFTER INSERT ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_match();

-- 2. Trigger for new messages
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
  sender_id UUID;
  match_id UUID;
BEGIN
  -- Get message details
  recipient_id := NEW.recipient_id;
  sender_id := NEW.sender_id;
  match_id := NEW.match_id;

  -- Don't send notification if user is messaging themselves
  IF recipient_id = sender_id THEN
    RETURN NEW;
  END IF;

  -- Send notification
  PERFORM net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/send-message-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
    ),
    body := jsonb_build_object(
      'recipient_id', recipient_id,
      'sender_id', sender_id,
      'message_id', NEW.id,
      'match_id', match_id,
      'message_text', NEW.content
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new messages
DROP TRIGGER IF EXISTS trigger_notify_new_message ON public.messages;
CREATE TRIGGER trigger_notify_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- 3. Trigger for new likes (swipes)
CREATE OR REPLACE FUNCTION notify_new_like()
RETURNS TRIGGER AS $$
DECLARE
  liked_user_id UUID;
  liker_id UUID;
BEGIN
  -- Only send notification for "like" swipes (not passes)
  IF NEW.action != 'like' THEN
    RETURN NEW;
  END IF;

  -- Get swipe details
  liked_user_id := NEW.target_user_id;
  liker_id := NEW.user_id;

  -- Don't send notification if user is swiping on themselves
  IF liked_user_id = liker_id THEN
    RETURN NEW;
  END IF;

  -- Send notification
  PERFORM net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/send-like-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
    ),
    body := jsonb_build_object(
      'liked_user_id', liked_user_id,
      'liker_id', liker_id,
      'swipe_id', NEW.id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new likes
DROP TRIGGER IF EXISTS trigger_notify_new_like ON public.swipes;
CREATE TRIGGER trigger_notify_new_like
  AFTER INSERT ON public.swipes
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_like();

-- 4. Function to clean up old notification logs (run periodically)
CREATE OR REPLACE FUNCTION cleanup_notification_logs()
RETURNS void AS $$
BEGIN
  -- Delete logs older than 90 days
  DELETE FROM public.notification_logs 
  WHERE sent_at < NOW() - INTERVAL '90 days';
  
  -- Log cleanup activity
  INSERT INTO public.notification_logs (
    user_id,
    notification_type,
    title,
    body,
    sent_at,
    status
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::UUID, -- System user ID
    'system',
    'Cleanup',
    'Cleaned up old notification logs',
    NOW(),
    'sent'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION notify_new_match() TO service_role;
GRANT EXECUTE ON FUNCTION notify_new_message() TO service_role;
GRANT EXECUTE ON FUNCTION notify_new_like() TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_notification_logs() TO service_role;

-- Note: You'll need to set these configuration variables in your Supabase project:
-- app.supabase_url = 'https://your-project.supabase.co'
-- app.supabase_service_role_key = 'your-service-role-key'
