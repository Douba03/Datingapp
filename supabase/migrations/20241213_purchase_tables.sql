-- Purchase transactions table for tracking validated purchases
CREATE TABLE IF NOT EXISTS purchase_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  product_id TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  validated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Index for looking up by transaction ID (for webhooks)
  UNIQUE(transaction_id)
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_purchase_transactions_user_id ON purchase_transactions(user_id);

-- Webhook events table for logging all incoming webhooks
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  payload JSONB,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for debugging/auditing
CREATE INDEX IF NOT EXISTS idx_webhook_events_user_id ON webhook_events(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);

-- Enable RLS
ALTER TABLE purchase_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Users can only see their own transactions
CREATE POLICY "Users can view own transactions" ON purchase_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role can insert/update (from edge functions)
CREATE POLICY "Service role can manage transactions" ON purchase_transactions
  FOR ALL USING (auth.role() = 'service_role');

-- Only service role can access webhook events
CREATE POLICY "Service role can manage webhook events" ON webhook_events
  FOR ALL USING (auth.role() = 'service_role');
