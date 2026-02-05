-- =====================================================
-- CREATE HIDDEN PROFILES TABLE
-- =====================================================
-- This table stores profiles that users have marked as "Not What I'm Looking For"
-- These profiles will be filtered out from the user's feed
-- =====================================================

-- Create hidden_profiles table
CREATE TABLE IF NOT EXISTS hidden_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hidden_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL DEFAULT 'not_looking_for', -- 'not_looking_for', 'not_interested', 'not_my_type'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent duplicate entries
  UNIQUE(user_id, hidden_user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_hidden_profiles_user_id ON hidden_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_hidden_profiles_hidden_user_id ON hidden_profiles(hidden_user_id);
CREATE INDEX IF NOT EXISTS idx_hidden_profiles_created_at ON hidden_profiles(created_at DESC);

-- Enable RLS
ALTER TABLE hidden_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own hidden profiles
CREATE POLICY "Users can view their own hidden profiles"
  ON hidden_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can hide profiles
CREATE POLICY "Users can hide profiles"
  ON hidden_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can unhide profiles
CREATE POLICY "Users can unhide profiles"
  ON hidden_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Function to hide a profile
CREATE OR REPLACE FUNCTION hide_profile(
  target_user_id UUID,
  reason TEXT DEFAULT 'not_looking_for'
)
RETURNS void AS $$
BEGIN
  INSERT INTO hidden_profiles (user_id, hidden_user_id, reason)
  VALUES (auth.uid(), target_user_id, reason)
  ON CONFLICT (user_id, hidden_user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unhide a profile
CREATE OR REPLACE FUNCTION unhide_profile(
  target_user_id UUID
)
RETURNS void AS $$
BEGIN
  DELETE FROM hidden_profiles 
  WHERE user_id = auth.uid() 
    AND hidden_user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a profile is hidden
CREATE OR REPLACE FUNCTION is_profile_hidden(
  target_user_id UUID
)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM hidden_profiles 
    WHERE user_id = auth.uid() 
      AND hidden_user_id = target_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success message
SELECT 'Hidden profiles table created successfully!' as message;
