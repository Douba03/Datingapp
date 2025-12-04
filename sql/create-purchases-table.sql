-- Create purchases table to track all premium purchases
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS purchases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT NOT NULL,
  transaction_id TEXT,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  purchase_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'refunded', 'cancelled')),
  receipt_data TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_transaction_id ON purchases(transaction_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);

-- Enable RLS
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Users can only view their own purchases
CREATE POLICY "Users can view own purchases" ON purchases
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert/update purchases (for backend verification)
CREATE POLICY "Service role can manage purchases" ON purchases
  FOR ALL USING (auth.role() = 'service_role');

-- Users can insert their own purchases (for client-side)
CREATE POLICY "Users can insert own purchases" ON purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add missing premium columns to users table if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_premium') THEN
    ALTER TABLE users ADD COLUMN is_premium BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'premium_until') THEN
    ALTER TABLE users ADD COLUMN premium_until TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'grace_period_until') THEN
    ALTER TABLE users ADD COLUMN grace_period_until TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add boost column to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'boost_expires_at') THEN
    ALTER TABLE profiles ADD COLUMN boost_expires_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Grant permissions
GRANT SELECT, INSERT ON purchases TO authenticated;
GRANT ALL ON purchases TO service_role;

COMMENT ON TABLE purchases IS 'Tracks all premium subscription purchases';











