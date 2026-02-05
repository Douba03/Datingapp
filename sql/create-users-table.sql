-- =====================================================
-- CREATE USERS TABLE
-- =====================================================
-- Creates the users table for storing user data
-- =====================================================

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  auth_provider TEXT DEFAULT 'email',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  is_premium BOOLEAN DEFAULT FALSE,
  premium_until TIMESTAMPTZ,
  grace_period_until TIMESTAMPTZ,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Service role can manage all users" ON users;

-- RLS Policies
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow service role to manage all users (for triggers and functions)
CREATE POLICY "Service role can manage all users" ON users
  FOR ALL USING (true);

-- Create function to auto-create user record when auth user is created
CREATE OR REPLACE FUNCTION create_user_record()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, auth_provider, status, is_premium, onboarding_completed)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    'active',
    FALSE,
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new auth users
DROP TRIGGER IF EXISTS on_auth_user_created_user_record ON auth.users;

CREATE TRIGGER on_auth_user_created_user_record
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_record();

-- Create users for any existing auth users who don't have a user record
INSERT INTO users (id, email, auth_provider, status, is_premium, onboarding_completed)
SELECT 
  id,
  email,
  COALESCE(raw_app_meta_data->>'provider', 'email'),
  'active',
  FALSE,
  FALSE
FROM auth.users
WHERE id NOT IN (SELECT id FROM users)
ON CONFLICT (id) DO NOTHING;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_user_record() TO authenticated;

-- Success message
SELECT 
  COUNT(*) as total_users,
  'Users table created successfully!' as message
FROM users;
