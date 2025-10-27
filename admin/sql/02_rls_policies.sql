-- =====================================================
-- RLS Policies for Admin Tables
-- Run this in Supabase SQL Editor AFTER 01_admin_tables.sql
-- =====================================================

-- Enable RLS on all admin tables
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Payments policies (users can view their own, admins can view all)
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

-- Feature flags policies (read-only for authenticated users)
CREATE POLICY "Authenticated users can view feature flags"
  ON public.feature_flags FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage feature flags"
  ON public.feature_flags FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Admin actions policies (only service role can write, admins can read their own)
CREATE POLICY "Admins can view own actions"
  ON public.admin_actions FOR SELECT
  USING (auth.uid() = admin_id);

CREATE POLICY "Service role can manage admin actions"
  ON public.admin_actions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

COMMENT ON POLICY "Users can view own payments" ON public.payments IS 'Users can see their payment history';
COMMENT ON POLICY "Service role can manage payments" ON public.payments IS 'Admin dashboard uses service role for all payment operations';

