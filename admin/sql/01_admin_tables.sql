-- =====================================================
-- Admin Dashboard Tables
-- Run this in Supabase SQL Editor
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

COMMENT ON TABLE public.payments IS 'Payment transactions for revenue tracking';
COMMENT ON TABLE public.subscriptions IS 'User subscription status and plans';
COMMENT ON TABLE public.content_assets IS 'User-uploaded content for moderation';
COMMENT ON TABLE public.feature_flags IS 'Feature flags for A/B testing and rollouts';
COMMENT ON TABLE public.admin_actions IS 'Audit log of all admin actions';

