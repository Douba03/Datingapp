-- =====================================================
-- COMPLETE ADMIN DASHBOARD SETUP
-- Run this ONCE in Supabase SQL Editor
-- This combines all necessary tables, policies, and functions
-- =====================================================

-- =====================================================
-- PART 1: CREATE ADMIN TABLES
-- =====================================================

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  provider text NOT NULL DEFAULT 'stripe',
  product text,
  refund_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  plan text NOT NULL CHECK (plan IN ('free', 'basic', 'premium', 'vip')),
  status text NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  started_at timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz,
  cancel_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- Content assets (for moderation)
CREATE TABLE IF NOT EXISTS public.content_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('photo', 'video', 'document')),
  url text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reason text,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  review_note text,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_content_assets_user_id ON public.content_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_content_assets_status ON public.content_assets(status);
CREATE INDEX IF NOT EXISTS idx_content_assets_uploaded_at ON public.content_assets(uploaded_at DESC);

-- Feature flags
CREATE TABLE IF NOT EXISTS public.feature_flags (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT 'false'::jsonb,
  environment text NOT NULL DEFAULT 'production' CHECK (environment IN ('development', 'staging', 'production')),
  version integer NOT NULL DEFAULT 1,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_environment ON public.feature_flags(environment);

-- Admin actions (audit log)
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id bigserial PRIMARY KEY,
  admin_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON public.admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON public.admin_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_actions_action ON public.admin_actions(action);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target ON public.admin_actions(target_type, target_id);

-- Add status column to profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN status text NOT NULL DEFAULT 'active' 
    CHECK (status IN ('active', 'shadow_banned', 'banned', 'suspended'));
    
    CREATE INDEX idx_profiles_status ON public.profiles(status);
  END IF;
END $$;

-- =====================================================
-- PART 2: ENABLE RLS AND CREATE POLICIES
-- =====================================================

-- Enable RLS on all admin tables
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Service role can manage payments" ON public.payments;
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view own content" ON public.content_assets;
DROP POLICY IF EXISTS "Users can upload content" ON public.content_assets;
DROP POLICY IF EXISTS "Service role can manage content" ON public.content_assets;
DROP POLICY IF EXISTS "Authenticated users can view feature flags" ON public.feature_flags;
DROP POLICY IF EXISTS "Service role can manage feature flags" ON public.feature_flags;
DROP POLICY IF EXISTS "Admins can view own actions" ON public.admin_actions;
DROP POLICY IF EXISTS "Service role can manage admin actions" ON public.admin_actions;

-- Payments policies
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage payments"
  ON public.payments FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Subscriptions policies
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Content assets policies
CREATE POLICY "Users can view own content"
  ON public.content_assets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upload content"
  ON public.content_assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage content"
  ON public.content_assets FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Feature flags policies
CREATE POLICY "Authenticated users can view feature flags"
  ON public.feature_flags FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage feature flags"
  ON public.feature_flags FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Admin actions policies
CREATE POLICY "Admins can view own actions"
  ON public.admin_actions FOR SELECT
  USING (auth.uid() = admin_id);

CREATE POLICY "Service role can manage admin actions"
  ON public.admin_actions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- PART 3: CREATE ADMIN FUNCTIONS (RPCs)
-- =====================================================

-- Ban user
CREATE OR REPLACE FUNCTION admin_ban_user(
  target_user_id uuid,
  ban_reason text,
  is_hard_ban boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ban_status text;
BEGIN
  ban_status := CASE WHEN is_hard_ban THEN 'banned' ELSE 'shadow_banned' END;
  
  UPDATE profiles
  SET status = ban_status,
      updated_at = now()
  WHERE user_id = target_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', target_user_id,
    'status', ban_status,
    'reason', ban_reason
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Warn user
CREATE OR REPLACE FUNCTION admin_warn_user(
  target_user_id uuid,
  warning_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_warnings integer;
BEGIN
  SELECT COALESCE((profiles.bio::jsonb->>'warning_count')::integer, 0)
  INTO current_warnings
  FROM profiles
  WHERE user_id = target_user_id;
  
  UPDATE profiles
  SET updated_at = now()
  WHERE user_id = target_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', target_user_id,
    'warnings', current_warnings + 1,
    'reason', warning_reason
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Close report
CREATE OR REPLACE FUNCTION admin_close_report(
  report_id uuid,
  resolution_text text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_reports
  SET status = 'closed',
      resolution = resolution_text,
      closed_at = now()
  WHERE id = report_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'report_id', report_id,
    'resolution', resolution_text
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Approve content asset
CREATE OR REPLACE FUNCTION admin_approve_asset(
  asset_id uuid,
  reviewer_id uuid,
  review_note_text text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE content_assets
  SET status = 'approved',
      reviewed_at = now(),
      reviewed_by = reviewer_id,
      review_note = review_note_text
  WHERE id = asset_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'asset_id', asset_id,
    'status', 'approved'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Reject content asset
CREATE OR REPLACE FUNCTION admin_reject_asset(
  asset_id uuid,
  reviewer_id uuid,
  rejection_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE content_assets
  SET status = 'rejected',
      reason = rejection_reason,
      reviewed_at = now(),
      reviewed_by = reviewer_id,
      review_note = rejection_reason
  WHERE id = asset_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'asset_id', asset_id,
    'status', 'rejected',
    'reason', rejection_reason
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Toggle feature flag
CREATE OR REPLACE FUNCTION admin_toggle_flag(
  flag_key text,
  flag_value jsonb,
  flag_environment text DEFAULT 'production',
  updater_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO feature_flags (key, value, environment, version, updated_by, updated_at)
  VALUES (flag_key, flag_value, flag_environment, 1, updater_id, now())
  ON CONFLICT (key)
  DO UPDATE SET
    value = flag_value,
    version = feature_flags.version + 1,
    updated_by = updater_id,
    updated_at = now();
  
  RETURN jsonb_build_object(
    'success', true,
    'key', flag_key,
    'value', flag_value,
    'environment', flag_environment
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Mark payment as refunded
CREATE OR REPLACE FUNCTION admin_refund_payment(
  payment_id uuid,
  refund_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE payments
  SET status = 'refunded',
      refund_id = gen_random_uuid()::text,
      metadata = metadata || jsonb_build_object('refund_reason', refund_reason, 'refunded_at', now())
  WHERE id = payment_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'payment_id', payment_id,
    'status', 'refunded'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Get admin dashboard stats
CREATE OR REPLACE FUNCTION admin_get_dashboard_stats(
  days_back integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  cutoff_date timestamptz;
BEGIN
  cutoff_date := now() - (days_back || ' days')::interval;
  
  SELECT jsonb_build_object(
    'new_signups', (SELECT COUNT(*) FROM auth.users WHERE created_at >= cutoff_date),
    'total_users', (SELECT COUNT(*) FROM auth.users),
    'active_users', (SELECT COUNT(DISTINCT sender_id) FROM messages WHERE created_at >= cutoff_date),
    'total_matches', (SELECT COUNT(*) FROM matches WHERE created_at >= cutoff_date),
    'total_messages', (SELECT COUNT(*) FROM messages WHERE created_at >= cutoff_date),
    'open_reports', (SELECT COUNT(*) FROM user_reports WHERE status = 'open'),
    'total_revenue_cents', (SELECT COALESCE(SUM(amount_cents), 0) FROM payments WHERE status = 'succeeded' AND created_at >= cutoff_date),
    'paying_users', (SELECT COUNT(DISTINCT user_id) FROM subscriptions WHERE status = 'active')
  ) INTO result;
  
  RETURN result;
END;
$$;

-- =====================================================
-- PART 4: SEED INITIAL DATA
-- =====================================================

-- Insert default feature flags
INSERT INTO public.feature_flags (key, value, environment, description)
VALUES
  ('enable_premium_features', 'true'::jsonb, 'production', 'Enable premium subscription features'),
  ('enable_video_calls', 'false'::jsonb, 'production', 'Enable video calling feature'),
  ('enable_super_likes', 'true'::jsonb, 'production', 'Enable super likes feature'),
  ('maintenance_mode', 'false'::jsonb, 'production', 'Put app in maintenance mode')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT '✅ Admin dashboard setup complete! All tables, policies, functions, and seed data created successfully.' AS status;

