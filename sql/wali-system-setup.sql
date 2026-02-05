-- =====================================================
-- WALI SYSTEM & PREMIUM FEATURES SETUP
-- =====================================================
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Profile Views Table (Se vem som kollar på din profil)
CREATE TABLE IF NOT EXISTS profile_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  viewer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  viewed_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(viewer_id, viewed_id) -- One view per user pair (updates timestamp)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_id ON profile_views(viewed_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer_id ON profile_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_at ON profile_views(viewed_at DESC);

-- 2. Wali Requests Table (Förfrågan om tjejens hand)
CREATE TABLE IF NOT EXISTS wali_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
  requester_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL, -- Killen som frågar
  recipient_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL, -- Tjejen som får förfrågan
  message TEXT NOT NULL, -- Personligt meddelande
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(match_id) -- Only one wali request per match
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_wali_requests_recipient ON wali_requests(recipient_id);
CREATE INDEX IF NOT EXISTS idx_wali_requests_requester ON wali_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_wali_requests_status ON wali_requests(status);

-- 3. Successful Matches Table (Lyckade Lärkänningar)
CREATE TABLE IF NOT EXISTS successful_matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE NOT NULL UNIQUE,
  wali_request_id UUID REFERENCES wali_requests(id) ON DELETE CASCADE NOT NULL,
  user_a_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  user_b_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT -- Optional notes about the successful match
);

-- Index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_successful_matches_completed ON successful_matches(completed_at DESC);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE wali_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE successful_matches ENABLE ROW LEVEL SECURITY;

-- Profile Views Policies
DROP POLICY IF EXISTS "Users can insert their own views" ON profile_views;
CREATE POLICY "Users can insert their own views" ON profile_views
  FOR INSERT WITH CHECK (auth.uid() = viewer_id);

DROP POLICY IF EXISTS "Users can see who viewed them (premium only checked in app)" ON profile_views;
CREATE POLICY "Users can see who viewed them (premium only checked in app)" ON profile_views
  FOR SELECT USING (auth.uid() = viewed_id OR auth.uid() = viewer_id);

DROP POLICY IF EXISTS "Users can update their own views" ON profile_views;
CREATE POLICY "Users can update their own views" ON profile_views
  FOR UPDATE USING (auth.uid() = viewer_id);

-- Wali Requests Policies
DROP POLICY IF EXISTS "Users can create wali requests" ON wali_requests;
CREATE POLICY "Users can create wali requests" ON wali_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Users can view their wali requests" ON wali_requests;
CREATE POLICY "Users can view their wali requests" ON wali_requests
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Recipients can update wali requests" ON wali_requests;
CREATE POLICY "Recipients can update wali requests" ON wali_requests
  FOR UPDATE USING (auth.uid() = recipient_id);

-- Successful Matches Policies
DROP POLICY IF EXISTS "Users can view their successful matches" ON successful_matches;
CREATE POLICY "Users can view their successful matches" ON successful_matches
  FOR SELECT USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

DROP POLICY IF EXISTS "System can insert successful matches" ON successful_matches;
CREATE POLICY "System can insert successful matches" ON successful_matches
  FOR INSERT WITH CHECK (auth.uid() = user_a_id OR auth.uid() = user_b_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if 5 days have passed since match
CREATE OR REPLACE FUNCTION can_send_wali_request(p_match_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  match_date TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT matched_at INTO match_date
  FROM matches
  WHERE id = p_match_id;
  
  IF match_date IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if 5 days have passed
  RETURN (NOW() - match_date) >= INTERVAL '5 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record a profile view (upsert)
CREATE OR REPLACE FUNCTION record_profile_view(p_viewer_id UUID, p_viewed_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO profile_views (viewer_id, viewed_id, viewed_at)
  VALUES (p_viewer_id, p_viewed_id, NOW())
  ON CONFLICT (viewer_id, viewed_id) 
  DO UPDATE SET viewed_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept wali request and create successful match
CREATE OR REPLACE FUNCTION accept_wali_request(p_request_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_match_id UUID;
  v_requester_id UUID;
  v_recipient_id UUID;
BEGIN
  -- Get request details
  SELECT match_id, requester_id, recipient_id 
  INTO v_match_id, v_requester_id, v_recipient_id
  FROM wali_requests
  WHERE id = p_request_id AND status = 'pending';
  
  IF v_match_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Update wali request status
  UPDATE wali_requests
  SET status = 'accepted', responded_at = NOW()
  WHERE id = p_request_id;
  
  -- Create successful match entry
  INSERT INTO successful_matches (match_id, wali_request_id, user_a_id, user_b_id)
  VALUES (v_match_id, p_request_id, v_requester_id, v_recipient_id);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT EXECUTE ON FUNCTION can_send_wali_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION record_profile_view(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_wali_request(UUID) TO authenticated;

SELECT 'Wali System Setup Complete!' as status;
