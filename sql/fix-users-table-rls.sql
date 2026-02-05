-- =====================================================
-- FIX USERS TABLE AND RLS POLICIES
-- =====================================================
-- This fixes the "Database error saving new user" issue
-- =====================================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Service role can manage all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;

-- Create users table if it doesn't exist
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

-- Create permissive policies that allow signup to work
CREATE POLICY "Enable insert for authenticated users only" ON users
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create or replace the trigger function
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
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created_user_record ON auth.users;

CREATE TRIGGER on_auth_user_created_user_record
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_record();

-- Create users for existing auth users
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

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON users TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_record() TO authenticated;

-- Success message
SELECT 'Users table RLS policies fixed! Try signing up again.' as message;
