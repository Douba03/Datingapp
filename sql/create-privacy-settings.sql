-- ============================================
-- PRIVACY SETTINGS & ONLINE STATUS
-- ============================================
-- Copy this entire file and paste it into Supabase SQL Editor
-- Then click "Run" button
-- ============================================

-- Step 1: Create privacy_settings table
CREATE TABLE IF NOT EXISTS privacy_settings (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  show_online_status BOOLEAN DEFAULT true,
  show_distance BOOLEAN DEFAULT true,
  show_age BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Add last_seen_at column to users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'last_seen_at'
  ) THEN
    ALTER TABLE users ADD COLUMN last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Step 3: Enable Row Level Security
ALTER TABLE privacy_settings ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS Policies for privacy_settings
CREATE POLICY "Users can view own privacy settings"
  ON privacy_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own privacy settings"
  ON privacy_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own privacy settings"
  ON privacy_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Step 5: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_privacy_settings_user_id 
  ON privacy_settings(user_id);

CREATE INDEX IF NOT EXISTS idx_users_last_seen_at 
  ON users(last_seen_at);

-- Step 6: Create function to auto-create privacy settings for new users
CREATE OR REPLACE FUNCTION create_default_privacy_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO privacy_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created_privacy_settings ON auth.users;
CREATE TRIGGER on_auth_user_created_privacy_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_privacy_settings();

-- Step 8: Create privacy settings for ALL existing users
INSERT INTO privacy_settings (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Step 9: Create function to update last_seen_at
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET last_seen_at = NOW()
  WHERE id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Create view for online users (online = active in last 5 minutes)
CREATE OR REPLACE VIEW online_users AS
SELECT 
  u.id,
  u.last_seen_at,
  ps.show_online_status,
  CASE 
    WHEN ps.show_online_status = false THEN false
    WHEN u.last_seen_at > NOW() - INTERVAL '5 minutes' THEN true
    ELSE false
  END as is_online
FROM users u
LEFT JOIN privacy_settings ps ON u.id = ps.user_id;

-- Step 11: Grant access to the view
GRANT SELECT ON online_users TO authenticated;

-- ============================================
-- DONE! You should see "Success. No rows returned"
-- ============================================

