-- Create user_push_tokens table to store device push tokens
CREATE TABLE IF NOT EXISTS public.user_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL,
  device_id TEXT,
  device_type TEXT CHECK (device_type IN ('ios', 'android', 'web')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one active token per user per device
  UNIQUE(user_id, device_id),
  UNIQUE(expo_push_token)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_id ON public.user_push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_active ON public.user_push_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_token ON public.user_push_tokens(expo_push_token);

-- Create RLS policies
ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only see their own push tokens
CREATE POLICY "Users can view own push tokens" ON public.user_push_tokens
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own push tokens
CREATE POLICY "Users can insert own push tokens" ON public.user_push_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own push tokens
CREATE POLICY "Users can update own push tokens" ON public.user_push_tokens
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own push tokens
CREATE POLICY "Users can delete own push tokens" ON public.user_push_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_push_tokens_updated_at 
  BEFORE UPDATE ON public.user_push_tokens 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean up old/inactive tokens
CREATE OR REPLACE FUNCTION cleanup_old_push_tokens()
RETURNS void AS $$
BEGIN
  -- Deactivate tokens older than 30 days
  UPDATE public.user_push_tokens 
  SET is_active = FALSE 
  WHERE last_used_at < NOW() - INTERVAL '30 days' 
  AND is_active = TRUE;
  
  -- Delete tokens older than 90 days
  DELETE FROM public.user_push_tokens 
  WHERE last_used_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Create function to get active push tokens for a user
CREATE OR REPLACE FUNCTION get_user_push_tokens(target_user_id UUID)
RETURNS TABLE(expo_push_token TEXT, device_type TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT upt.expo_push_token, upt.device_type
  FROM public.user_push_tokens upt
  WHERE upt.user_id = target_user_id 
  AND upt.is_active = TRUE
  ORDER BY upt.last_used_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_push_tokens(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_push_tokens() TO service_role;

-- Create notification_logs table for tracking sent notifications
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('match', 'message', 'like', 'system')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  expo_push_token TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'opened')),
  error_message TEXT,
  related_id UUID, -- Can reference match_id, message_id, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for notification logs
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON public.notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON public.notification_logs(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON public.notification_logs(sent_at DESC);

-- RLS policies for notification logs (admin only)
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can access notification logs
CREATE POLICY "Service role can manage notification logs" ON public.notification_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Create view for notification statistics
CREATE OR REPLACE VIEW public.notification_stats AS
SELECT 
  DATE(sent_at) as date,
  notification_type,
  COUNT(*) as total_sent,
  COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
  COUNT(CASE WHEN status = 'opened' THEN 1 END) as opened,
  ROUND(
    COUNT(CASE WHEN status = 'delivered' THEN 1 END)::numeric / 
    NULLIF(COUNT(*), 0) * 100, 2
  ) as delivery_rate,
  ROUND(
    COUNT(CASE WHEN status = 'opened' THEN 1 END)::numeric / 
    NULLIF(COUNT(CASE WHEN status = 'delivered' THEN 1 END), 0) * 100, 2
  ) as open_rate
FROM public.notification_logs
WHERE sent_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(sent_at), notification_type
ORDER BY date DESC, notification_type;

-- Grant permissions
GRANT SELECT ON public.notification_stats TO authenticated;
GRANT ALL ON public.user_push_tokens TO authenticated;
GRANT ALL ON public.notification_logs TO service_role;
