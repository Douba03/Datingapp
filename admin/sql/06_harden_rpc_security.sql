-- =====================================================
-- Harden SECURITY DEFINER RPCs
-- Run this in Supabase SQL Editor AFTER 05_add_audit_logging.sql
-- This restricts function execution and sets proper ownership
-- =====================================================

-- Create a dedicated role for admin operations (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'admin_role') THEN
    CREATE ROLE admin_role NOLOGIN;
  END IF;
END
$$;

-- Revoke public execute on all admin functions
REVOKE ALL ON FUNCTION admin_ban_user FROM PUBLIC;
REVOKE ALL ON FUNCTION admin_warn_user FROM PUBLIC;
REVOKE ALL ON FUNCTION admin_close_report FROM PUBLIC;
REVOKE ALL ON FUNCTION admin_approve_asset FROM PUBLIC;
REVOKE ALL ON FUNCTION admin_reject_asset FROM PUBLIC;
REVOKE ALL ON FUNCTION admin_toggle_flag FROM PUBLIC;
REVOKE ALL ON FUNCTION admin_refund_payment FROM PUBLIC;
REVOKE ALL ON FUNCTION admin_get_dashboard_stats FROM PUBLIC;

-- Grant execute only to authenticated users (service role will bypass this anyway)
GRANT EXECUTE ON FUNCTION admin_ban_user TO authenticated;
GRANT EXECUTE ON FUNCTION admin_warn_user TO authenticated;
GRANT EXECUTE ON FUNCTION admin_close_report TO authenticated;
GRANT EXECUTE ON FUNCTION admin_approve_asset TO authenticated;
GRANT EXECUTE ON FUNCTION admin_reject_asset TO authenticated;
GRANT EXECUTE ON FUNCTION admin_toggle_flag TO authenticated;
GRANT EXECUTE ON FUNCTION admin_refund_payment TO authenticated;
GRANT EXECUTE ON FUNCTION admin_get_dashboard_stats TO authenticated;

-- Grant to admin_role
GRANT EXECUTE ON FUNCTION admin_ban_user TO admin_role;
GRANT EXECUTE ON FUNCTION admin_warn_user TO admin_role;
GRANT EXECUTE ON FUNCTION admin_close_report TO admin_role;
GRANT EXECUTE ON FUNCTION admin_approve_asset TO admin_role;
GRANT EXECUTE ON FUNCTION admin_reject_asset TO admin_role;
GRANT EXECUTE ON FUNCTION admin_toggle_flag TO admin_role;
GRANT EXECUTE ON FUNCTION admin_refund_payment TO admin_role;
GRANT EXECUTE ON FUNCTION admin_get_dashboard_stats TO admin_role;

-- Add function to check if user is admin (can be called from RLS policies)
CREATE OR REPLACE FUNCTION is_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Check if user has admin role in app_metadata
  RETURN EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = user_id
    AND (
      raw_app_meta_data->>'roles' LIKE '%admin%'
      OR raw_app_meta_data->>'role' = 'admin'
    )
  );
END;
$$;

-- Grant execute on is_admin_user to authenticated users
GRANT EXECUTE ON FUNCTION is_admin_user TO authenticated;

-- Add RLS policy helper for admin-only tables
CREATE OR REPLACE FUNCTION current_user_is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT is_admin_user(auth.uid());
$$;

GRANT EXECUTE ON FUNCTION current_user_is_admin TO authenticated;

-- Update admin_actions RLS to only allow admins to view
DROP POLICY IF EXISTS "Admins can view own actions" ON public.admin_actions;
DROP POLICY IF EXISTS "Service role can manage admin actions" ON public.admin_actions;

CREATE POLICY "Admins can view all actions"
  ON public.admin_actions FOR SELECT
  USING (current_user_is_admin());

CREATE POLICY "Service role can insert admin actions"
  ON public.admin_actions FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Update feature_flags RLS to require admin for writes
DROP POLICY IF EXISTS "Service role can manage feature flags" ON public.feature_flags;

CREATE POLICY "Admins can manage feature flags"
  ON public.feature_flags FOR ALL
  USING (current_user_is_admin());

-- Add rate limiting helper (optional - can be used in API routes)
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL,
  action text NOT NULL,
  count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, action, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action ON public.rate_limits(user_id, action, window_start);

-- Enable RLS on rate_limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rate limits"
  ON public.rate_limits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage rate limits"
  ON public.rate_limits FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Function to check rate limit (returns true if within limit)
CREATE OR REPLACE FUNCTION check_rate_limit(
  user_id uuid,
  action_name text,
  max_requests integer,
  window_minutes integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_count integer;
  window_start timestamptz;
BEGIN
  window_start := date_trunc('minute', now()) - (window_minutes || ' minutes')::interval;
  
  -- Get current count in window
  SELECT COALESCE(SUM(count), 0)
  INTO current_count
  FROM rate_limits
  WHERE rate_limits.user_id = check_rate_limit.user_id
    AND rate_limits.action = action_name
    AND rate_limits.window_start >= window_start;
  
  -- Check if within limit
  IF current_count >= max_requests THEN
    RETURN false;
  END IF;
  
  -- Increment counter
  INSERT INTO rate_limits (user_id, action, count, window_start)
  VALUES (user_id, action_name, 1, date_trunc('minute', now()))
  ON CONFLICT (user_id, action, window_start)
  DO UPDATE SET count = rate_limits.count + 1;
  
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION check_rate_limit TO authenticated;

COMMENT ON FUNCTION is_admin_user IS 'Check if user has admin role in app_metadata';
COMMENT ON FUNCTION current_user_is_admin IS 'RLS helper to check if current user is admin';
COMMENT ON FUNCTION check_rate_limit IS 'Rate limiting helper for API routes';
COMMENT ON TABLE rate_limits IS 'Rate limiting tracking table';

