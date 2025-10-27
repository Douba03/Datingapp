-- Create user_warnings table to store admin warnings
CREATE TABLE IF NOT EXISTS public.user_warnings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  issued_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  severity TEXT DEFAULT 'warning' CHECK (severity IN ('warning', 'final_warning', 'notice')),
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_warnings_user_id ON public.user_warnings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_warnings_acknowledged ON public.user_warnings(user_id, acknowledged);

-- Enable RLS
ALTER TABLE public.user_warnings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own warnings
CREATE POLICY "users_view_own_warnings" 
  ON public.user_warnings 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Policy: Users can acknowledge their own warnings
CREATE POLICY "users_acknowledge_own_warnings" 
  ON public.user_warnings 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, UPDATE ON public.user_warnings TO authenticated;

-- Update the admin_warn_user function to actually store warnings
CREATE OR REPLACE FUNCTION admin_warn_user(
  target_user_id UUID,
  warning_reason TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  warning_id UUID;
  total_warnings INTEGER;
BEGIN
  -- Insert the warning
  INSERT INTO user_warnings (user_id, reason, severity)
  VALUES (target_user_id, warning_reason, 'warning')
  RETURNING id INTO warning_id;
  
  -- Count total warnings for this user
  SELECT COUNT(*) INTO total_warnings
  FROM user_warnings
  WHERE user_id = target_user_id;
  
  -- If user has 3+ warnings, consider escalating (optional)
  IF total_warnings >= 3 THEN
    -- You could auto-ban or send a final warning here
    -- For now, just return the count
    NULL;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', target_user_id,
    'warning_id', warning_id,
    'total_warnings', total_warnings,
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

-- Function for users to acknowledge warnings
CREATE OR REPLACE FUNCTION acknowledge_warning(warning_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_warnings
  SET acknowledged = true,
      acknowledged_at = NOW()
  WHERE id = warning_id
    AND user_id = auth.uid()
    AND acknowledged = false;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Warning not found or already acknowledged'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'warning_id', warning_id
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION acknowledge_warning(UUID) TO authenticated;

SELECT '✅ User warnings table and functions created successfully!' AS status;

