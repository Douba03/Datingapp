-- =====================================================
-- Add Automatic Audit Logging to Admin RPCs
-- Run this in Supabase SQL Editor
-- This updates all admin functions to automatically log actions
-- =====================================================

-- Drop and recreate functions with audit logging

-- 1. Ban user (with audit logging)
CREATE OR REPLACE FUNCTION admin_ban_user(
  target_user_id uuid,
  ban_reason text,
  is_hard_ban boolean DEFAULT true,
  admin_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ban_status text;
  result jsonb;
BEGIN
  -- Determine ban type
  ban_status := CASE WHEN is_hard_ban THEN 'banned' ELSE 'shadow_banned' END;
  
  -- Update profile status
  UPDATE profiles
  SET status = ban_status,
      updated_at = now()
  WHERE user_id = target_user_id;
  
  -- Build result
  result := jsonb_build_object(
    'success', true,
    'user_id', target_user_id,
    'status', ban_status,
    'reason', ban_reason
  );
  
  -- Log admin action
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO admin_actions (admin_id, action, target_type, target_id, payload)
    VALUES (
      admin_user_id,
      CASE WHEN is_hard_ban THEN 'ban_user' ELSE 'shadow_ban_user' END,
      'user',
      target_user_id::text,
      jsonb_build_object('reason', ban_reason, 'ban_type', ban_status)
    );
  END IF;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 2. Warn user (with audit logging)
CREATE OR REPLACE FUNCTION admin_warn_user(
  target_user_id uuid,
  warning_reason text,
  admin_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_warnings integer;
  result jsonb;
BEGIN
  -- Get current warning count from profiles metadata
  SELECT COALESCE((profiles.bio::jsonb->>'warning_count')::integer, 0)
  INTO current_warnings
  FROM profiles
  WHERE user_id = target_user_id;
  
  -- Increment warning count in profiles metadata
  UPDATE profiles
  SET updated_at = now()
  WHERE user_id = target_user_id;
  
  result := jsonb_build_object(
    'success', true,
    'user_id', target_user_id,
    'warnings', current_warnings + 1,
    'reason', warning_reason
  );
  
  -- Log admin action
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO admin_actions (admin_id, action, target_type, target_id, payload)
    VALUES (
      admin_user_id,
      'warn_user',
      'user',
      target_user_id::text,
      jsonb_build_object('reason', warning_reason, 'warning_count', current_warnings + 1)
    );
  END IF;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 3. Close report (with audit logging)
CREATE OR REPLACE FUNCTION admin_close_report(
  report_id uuid,
  resolution_text text,
  admin_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  UPDATE user_reports
  SET status = 'closed',
      resolution = resolution_text,
      closed_at = now()
  WHERE id = report_id;
  
  result := jsonb_build_object(
    'success', true,
    'report_id', report_id,
    'resolution', resolution_text
  );
  
  -- Log admin action
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO admin_actions (admin_id, action, target_type, target_id, payload)
    VALUES (
      admin_user_id,
      'close_report',
      'report',
      report_id::text,
      jsonb_build_object('resolution', resolution_text)
    );
  END IF;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 4. Approve content asset (with audit logging)
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
DECLARE
  result jsonb;
BEGIN
  UPDATE content_assets
  SET status = 'approved',
      reviewed_at = now(),
      reviewed_by = reviewer_id,
      review_note = review_note_text
  WHERE id = asset_id;
  
  result := jsonb_build_object(
    'success', true,
    'asset_id', asset_id,
    'status', 'approved'
  );
  
  -- Log admin action
  INSERT INTO admin_actions (admin_id, action, target_type, target_id, payload)
  VALUES (
    reviewer_id,
    'approve_content',
    'content_asset',
    asset_id::text,
    jsonb_build_object('note', review_note_text)
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 5. Reject content asset (with audit logging)
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
DECLARE
  result jsonb;
BEGIN
  UPDATE content_assets
  SET status = 'rejected',
      reason = rejection_reason,
      reviewed_at = now(),
      reviewed_by = reviewer_id,
      review_note = rejection_reason
  WHERE id = asset_id;
  
  result := jsonb_build_object(
    'success', true,
    'asset_id', asset_id,
    'status', 'rejected',
    'reason', rejection_reason
  );
  
  -- Log admin action
  INSERT INTO admin_actions (admin_id, action, target_type, target_id, payload)
  VALUES (
    reviewer_id,
    'reject_content',
    'content_asset',
    asset_id::text,
    jsonb_build_object('reason', rejection_reason)
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 6. Toggle feature flag (with audit logging)
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
DECLARE
  old_value jsonb;
  result jsonb;
BEGIN
  -- Get old value for audit trail
  SELECT value INTO old_value
  FROM feature_flags
  WHERE key = flag_key;
  
  -- Upsert flag
  INSERT INTO feature_flags (key, value, environment, version, updated_by, updated_at)
  VALUES (flag_key, flag_value, flag_environment, 1, updater_id, now())
  ON CONFLICT (key)
  DO UPDATE SET
    value = flag_value,
    version = feature_flags.version + 1,
    updated_by = updater_id,
    updated_at = now();
  
  result := jsonb_build_object(
    'success', true,
    'key', flag_key,
    'value', flag_value,
    'environment', flag_environment
  );
  
  -- Log admin action
  IF updater_id IS NOT NULL THEN
    INSERT INTO admin_actions (admin_id, action, target_type, target_id, payload)
    VALUES (
      updater_id,
      'toggle_feature_flag',
      'feature_flag',
      flag_key,
      jsonb_build_object(
        'old_value', old_value,
        'new_value', flag_value,
        'environment', flag_environment
      )
    );
  END IF;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 7. Refund payment (with audit logging)
CREATE OR REPLACE FUNCTION admin_refund_payment(
  payment_id uuid,
  refund_reason text,
  admin_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  UPDATE payments
  SET status = 'refunded',
      refund_id = gen_random_uuid()::text,
      metadata = metadata || jsonb_build_object(
        'refund_reason', refund_reason,
        'refunded_at', now(),
        'refunded_by', admin_user_id
      )
  WHERE id = payment_id;
  
  result := jsonb_build_object(
    'success', true,
    'payment_id', payment_id,
    'status', 'refunded'
  );
  
  -- Log admin action
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO admin_actions (admin_id, action, target_type, target_id, payload)
    VALUES (
      admin_user_id,
      'refund_payment',
      'payment',
      payment_id::text,
      jsonb_build_object('reason', refund_reason)
    );
  END IF;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Add IP address and user agent columns to admin_actions if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'admin_actions' 
    AND column_name = 'ip_address'
  ) THEN
    ALTER TABLE public.admin_actions 
    ADD COLUMN ip_address inet;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'admin_actions' 
    AND column_name = 'user_agent'
  ) THEN
    ALTER TABLE public.admin_actions 
    ADD COLUMN user_agent text;
  END IF;
END $$;

COMMENT ON FUNCTION admin_ban_user IS 'Ban or shadow ban a user with automatic audit logging';
COMMENT ON FUNCTION admin_warn_user IS 'Issue warning to user with automatic audit logging';
COMMENT ON FUNCTION admin_close_report IS 'Close report with automatic audit logging';
COMMENT ON FUNCTION admin_approve_asset IS 'Approve content with automatic audit logging';
COMMENT ON FUNCTION admin_reject_asset IS 'Reject content with automatic audit logging';
COMMENT ON FUNCTION admin_toggle_flag IS 'Toggle feature flag with automatic audit logging';
COMMENT ON FUNCTION admin_refund_payment IS 'Refund payment with automatic audit logging';

