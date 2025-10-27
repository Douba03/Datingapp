-- =====================================================
-- Seed Test Data for Admin Dashboard
-- Run this in Supabase SQL Editor (OPTIONAL - for local testing only)
-- This creates sample payments, subscriptions, and content assets
-- =====================================================

-- Note: Replace USER_ID_HERE with actual user IDs from your auth.users table
-- You can get user IDs by running: SELECT id, email FROM auth.users LIMIT 5;

-- Sample payments (replace user_ids with real ones)
DO $$
DECLARE
  sample_user_id uuid;
BEGIN
  -- Get a sample user ID
  SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
  
  IF sample_user_id IS NOT NULL THEN
    -- Insert sample payments
    INSERT INTO public.payments (user_id, amount_cents, currency, status, provider, product, created_at)
    VALUES
      (sample_user_id, 999, 'USD', 'succeeded', 'stripe', 'premium_monthly', now() - interval '1 day'),
      (sample_user_id, 999, 'USD', 'succeeded', 'stripe', 'premium_monthly', now() - interval '5 days'),
      (sample_user_id, 2999, 'USD', 'succeeded', 'stripe', 'premium_yearly', now() - interval '10 days'),
      (sample_user_id, 499, 'USD', 'failed', 'stripe', 'basic_monthly', now() - interval '2 days'),
      (sample_user_id, 1999, 'USD', 'refunded', 'stripe', 'premium_quarterly', now() - interval '15 days')
    ON CONFLICT DO NOTHING;
    
    -- Insert sample subscription
    INSERT INTO public.subscriptions (user_id, plan, status, started_at, current_period_end, created_at)
    VALUES
      (sample_user_id, 'premium', 'active', now() - interval '30 days', now() + interval '30 days', now() - interval '30 days')
    ON CONFLICT (user_id) DO UPDATE
    SET plan = 'premium',
        status = 'active',
        current_period_end = now() + interval '30 days';
    
    -- Insert sample content assets
    INSERT INTO public.content_assets (user_id, type, url, status, uploaded_at)
    VALUES
      (sample_user_id, 'photo', 'https://example.com/photo1.jpg', 'pending', now() - interval '1 hour'),
      (sample_user_id, 'photo', 'https://example.com/photo2.jpg', 'approved', now() - interval '2 days'),
      (sample_user_id, 'photo', 'https://example.com/photo3.jpg', 'rejected', now() - interval '3 days'),
      (sample_user_id, 'video', 'https://example.com/video1.mp4', 'pending', now() - interval '30 minutes')
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Sample data inserted for user: %', sample_user_id;
  ELSE
    RAISE NOTICE 'No users found. Create users first before running seed data.';
  END IF;
END $$;

-- Insert more sample payments for different users (if available)
DO $$
DECLARE
  user_record RECORD;
  counter integer := 0;
BEGIN
  FOR user_record IN (SELECT id FROM auth.users LIMIT 5) LOOP
    counter := counter + 1;
    
    -- Random payment amounts
    INSERT INTO public.payments (user_id, amount_cents, currency, status, provider, product, created_at)
    VALUES
      (user_record.id, 999, 'USD', 'succeeded', 'stripe', 'premium_monthly', now() - interval '1 day' * counter),
      (user_record.id, 499, 'USD', 'succeeded', 'stripe', 'basic_monthly', now() - interval '2 days' * counter)
    ON CONFLICT DO NOTHING;
  END LOOP;
  
  RAISE NOTICE 'Inserted payments for % users', counter;
END $$;

-- Update feature flags with more examples
INSERT INTO public.feature_flags (key, value, environment, description)
VALUES
  ('enable_video_chat', 'true'::jsonb, 'production', 'Enable video chat feature'),
  ('max_daily_swipes', '50'::jsonb, 'production', 'Maximum swipes per day'),
  ('enable_super_likes', 'true'::jsonb, 'production', 'Enable super likes feature'),
  ('maintenance_mode', 'false'::jsonb, 'production', 'Put app in maintenance mode'),
  ('enable_voice_messages', 'false'::jsonb, 'production', 'Enable voice messages in chat'),
  ('premium_discount_percent', '20'::jsonb, 'production', 'Premium subscription discount'),
  ('show_profile_verification', 'true'::jsonb, 'production', 'Show verification badge on profiles'),
  ('enable_ai_matching', 'false'::jsonb, 'production', 'Enable AI-powered matching algorithm')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = now();

-- Summary query to verify seed data
DO $$
DECLARE
  payment_count integer;
  subscription_count integer;
  content_count integer;
  flag_count integer;
BEGIN
  SELECT COUNT(*) INTO payment_count FROM public.payments;
  SELECT COUNT(*) INTO subscription_count FROM public.subscriptions;
  SELECT COUNT(*) INTO content_count FROM public.content_assets;
  SELECT COUNT(*) INTO flag_count FROM public.feature_flags;
  
  RAISE NOTICE '=== Seed Data Summary ===';
  RAISE NOTICE 'Payments: %', payment_count;
  RAISE NOTICE 'Subscriptions: %', subscription_count;
  RAISE NOTICE 'Content Assets: %', content_count;
  RAISE NOTICE 'Feature Flags: %', flag_count;
  RAISE NOTICE '========================';
END $$;

COMMENT ON TABLE public.payments IS 'Seeded with sample transaction data';
COMMENT ON TABLE public.subscriptions IS 'Seeded with sample subscription data';
COMMENT ON TABLE public.content_assets IS 'Seeded with sample content for moderation';
COMMENT ON TABLE public.feature_flags IS 'Seeded with production feature flags';

