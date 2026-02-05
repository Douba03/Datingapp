-- Migration: Connection Requests System for Calafdoon
-- Replaces the swipe/match system with a request-based contact model

-- Create request status enum
CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'declined');

-- Create decline reason enum
CREATE TYPE decline_reason AS ENUM (
  'not_interested',
  'different_values', 
  'location_too_far',
  'age_preference',
  'already_talking',
  'other'
);

-- Connection Requests table
CREATE TABLE IF NOT EXISTS connection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status request_status NOT NULL DEFAULT 'pending',
  message TEXT, -- Optional intro message from sender
  decline_reason decline_reason,
  decline_note TEXT, -- Optional custom note when declining
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  
  -- Prevent duplicate requests
  UNIQUE(sender_id, receiver_id)
);

-- Request Counters table (daily limit for free users)
CREATE TABLE IF NOT EXISTS request_counters (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  remaining INTEGER NOT NULL DEFAULT 10,
  last_exhausted_at TIMESTAMPTZ,
  next_refill_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_connection_requests_sender ON connection_requests(sender_id);
CREATE INDEX idx_connection_requests_receiver ON connection_requests(receiver_id);
CREATE INDEX idx_connection_requests_status ON connection_requests(status);
CREATE INDEX idx_connection_requests_created ON connection_requests(created_at DESC);

-- RLS Policies
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_counters ENABLE ROW LEVEL SECURITY;

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

-- Users can view their own counter
CREATE POLICY "Users can view their own counter"
  ON request_counters FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own counter
CREATE POLICY "Users can update their own counter"
  ON request_counters FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can insert their own counter
CREATE POLICY "Users can insert their own counter"
  ON request_counters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to create a conversation when request is accepted
CREATE OR REPLACE FUNCTION handle_request_accepted()
RETURNS TRIGGER AS $$
BEGIN
  -- When a request is accepted, create a match/conversation entry
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Insert into matches table (reusing existing matches table for conversations)
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
CREATE TRIGGER on_request_accepted
  AFTER UPDATE ON connection_requests
  FOR EACH ROW
  WHEN (NEW.status = 'accepted' AND OLD.status = 'pending')
  EXECUTE FUNCTION handle_request_accepted();

-- Function to check and refill request counters (daily reset)
CREATE OR REPLACE FUNCTION check_and_refill_requests()
RETURNS void AS $$
BEGIN
  UPDATE request_counters
  SET 
    remaining = 10,
    last_exhausted_at = NULL,
    next_refill_at = NULL,
    updated_at = NOW()
  WHERE 
    next_refill_at IS NOT NULL 
    AND next_refill_at <= NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
