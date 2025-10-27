-- =====================================================
-- Seed Data for Admin Dashboard Testing
-- Run this in Supabase SQL Editor (optional, for local dev)
-- =====================================================

-- Insert sample feature flags
INSERT INTO public.feature_flags (key, value, environment, description)
VALUES
  ('enable_video_chat', 'true'::jsonb, 'production', 'Enable video chat feature'),
  ('max_daily_swipes', '50'::jsonb, 'production', 'Maximum swipes per day'),
  ('enable_super_likes', 'true'::jsonb, 'production', 'Enable super likes feature'),
  ('maintenance_mode', 'false'::jsonb, 'production', 'Put app in maintenance mode')
ON CONFLICT (key) DO NOTHING;

-- Note: Payments, subscriptions, and content_assets will be populated
-- as users interact with the app. For testing, you can manually insert:

-- Sample payment (replace user_id with actual auth.users.id)
-- INSERT INTO public.payments (user_id, amount_cents, currency, status, provider, product)
-- VALUES 
--   ('YOUR_USER_ID_HERE', 999, 'USD', 'succeeded', 'stripe', 'premium_monthly');

-- Sample subscription (replace user_id with actual auth.users.id)
-- INSERT INTO public.subscriptions (user_id, plan, status, current_period_end)
-- VALUES
--   ('YOUR_USER_ID_HERE', 'premium', 'active', now() + interval '30 days');

COMMENT ON TABLE public.feature_flags IS 'Seeded with default feature flags';

