-- =====================================================
-- STEP 1: CREATE REQUEST_COUNTERS TABLE
-- =====================================================
-- Run this FIRST in Supabase SQL Editor
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

-- 3. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own request counter" ON request_counters;
DROP POLICY IF EXISTS "Users can update own request counter" ON request_counters;
DROP POLICY IF EXISTS "Users can insert own request counter" ON request_counters;

-- 4. Create RLS policies
CREATE POLICY "Users can view own request counter" ON request_counters
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own request counter" ON request_counters
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own request counter" ON request_counters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Create request counters for all existing users
INSERT INTO request_counters (user_id, remaining)
SELECT id, 10
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
