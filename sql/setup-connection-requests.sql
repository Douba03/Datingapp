-- =====================================================
-- CONNECTION REQUESTS SYSTEM SETUP
-- =====================================================
-- Run this in Supabase SQL Editor to enable connection requests
-- =====================================================

-- Create request status enum
DO $$ BEGIN
  CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'declined');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create decline reason enum
DO $$ BEGIN
  CREATE TYPE decline_reason AS ENUM (
    'not_interested',
    'different_values', 
    'location_too_far',
    'age_preference',
    'already_talking',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Connection Requests table
CREATE TABLE IF NOT EXISTS connection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status request_status NOT NULL DEFAULT 'pending',
  message TEXT,
  decline_reason decline_reason,
  decline_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE(sender_id, receiver_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_connection_requests_sender ON connection_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_receiver ON connection_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_status ON connection_requests(status);
CREATE INDEX IF NOT EXISTS idx_connection_requests_created ON connection_requests(created_at DESC);

-- RLS Policies
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own requests" ON connection_requests;
DROP POLICY IF EXISTS "Users can send requests" ON connection_requests;
DROP POLICY IF EXISTS "Users can respond to received requests" ON connection_requests;

-- Users can view requests they sent or received
CREATE POLICY "Users can view their own requests"
  ON connection_requests FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can send requests
CREATE POLICY "Users can send requests"
  ON connection_requests FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Users can respond to requests they received
CREATE POLICY "Users can respond to received requests"
  ON connection_requests FOR UPDATE
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- Function to create a conversation when request is accepted
CREATE OR REPLACE FUNCTION handle_request_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO matches (user_a_id, user_b_id, status, created_at)
    VALUES (
      LEAST(NEW.sender_id, NEW.receiver_id),
      GREATEST(NEW.sender_id, NEW.receiver_id),
      'active',
      NOW()
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for accepted requests
DROP TRIGGER IF EXISTS on_request_accepted ON connection_requests;

CREATE TRIGGER on_request_accepted
  AFTER UPDATE ON connection_requests
  FOR EACH ROW
  WHEN (NEW.status = 'accepted' AND OLD.status = 'pending')
  EXECUTE FUNCTION handle_request_accepted();

-- Grant permissions
GRANT EXECUTE ON FUNCTION handle_request_accepted() TO authenticated;

-- Success message
SELECT 'Connection requests system setup complete!' as message;
