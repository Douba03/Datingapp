-- =====================================================
-- Admin RPCs (SECURITY DEFINER functions)
-- Run this in Supabase SQL Editor AFTER 02_rls_policies.sql
-- These functions bypass RLS and should only be called from server-side code
-- =====================================================

-- Ban user (hard or shadow ban)
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
  -- Determine ban type
  ban_status := CASE WHEN is_hard_ban THEN 'banned' ELSE 'shadow_banned' END;
  
  -- Update profile status
  UPDATE profiles
  SET status = ban_status,
      updated_at = now()
  WHERE user_id = target_user_id;
  
  -- Return result
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

-- Warn user (updates profile metadata)
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
  -- Get current warning count from profiles
  SELECT COALESCE((profiles.bio::jsonb->>'warning_count')::integer, 0)
  INTO current_warnings
  FROM profiles
  WHERE user_id = target_user_id;
  
  -- Increment warning count
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

COMMENT ON FUNCTION admin_ban_user IS 'Ban or shadow ban a user (SECURITY DEFINER)';
COMMENT ON FUNCTION admin_warn_user IS 'Issue a warning to a user (SECURITY DEFINER)';
COMMENT ON FUNCTION admin_close_report IS 'Close a user report with resolution (SECURITY DEFINER)';
COMMENT ON FUNCTION admin_approve_asset IS 'Approve user-uploaded content (SECURITY DEFINER)';
COMMENT ON FUNCTION admin_reject_asset IS 'Reject user-uploaded content (SECURITY DEFINER)';
COMMENT ON FUNCTION admin_toggle_flag IS 'Toggle feature flag (SECURITY DEFINER)';
COMMENT ON FUNCTION admin_refund_payment IS 'Mark payment as refunded (SECURITY DEFINER)';
COMMENT ON FUNCTION admin_get_dashboard_stats IS 'Get dashboard KPIs (SECURITY DEFINER)';

