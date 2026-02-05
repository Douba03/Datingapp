-- =====================================================
-- CREATE REQUEST_COUNTERS TABLE
-- =====================================================
-- Creates the request_counters table for connection requests
-- with 10 requests per user, 8-hour refill
-- =====================================================

-- 1. Create the request_counters table
CREATE TABLE IF NOT EXISTS request_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  remaining INTEGER NOT NULL DEFAULT 10,
  last_exhausted_at TIMESTAMPTZ,
  next_refill_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. Enable RLS on request_counters
ALTER TABLE request_counters ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies
CREATE POLICY "Users can view own request counter" ON request_counters
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own request counter" ON request_counters
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own request counter" ON request_counters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Create function to auto-create request counter for new users
CREATE OR REPLACE FUNCTION create_request_counter_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO request_counters (user_id, remaining)
  VALUES (NEW.id, 10)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created_request_counter ON auth.users;

CREATE TRIGGER on_auth_user_created_request_counter
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_request_counter_for_new_user();

-- 6. Create request counters for all existing users
INSERT INTO request_counters (user_id, remaining)
SELECT id, 10
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- 7. Grant permissions
GRANT EXECUTE ON FUNCTION create_request_counter_for_new_user() TO authenticated;

-- Success message
SELECT 
  COUNT(*) as total_users,
  'Request counters table created! All users have 10 requests.' as message
FROM request_counters;
