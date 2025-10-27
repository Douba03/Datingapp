-- OPTIMIZED DATABASE SCHEMA FOR PARTNER PRODUCTIVITY APP
-- Run this in Supabase SQL Editor to set up the complete database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- CORE TABLES
-- ========================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  auth_provider TEXT DEFAULT 'email',
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,
  premium_until TIMESTAMP WITH TIME ZONE,
  grace_period_until TIMESTAMP WITH TIME ZONE
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('man', 'woman', 'non_binary', 'prefer_not_to_say', 'custom')),
  custom_gender TEXT,
  sexual_orientation TEXT[] DEFAULT '{}',
  bio TEXT,
  photos TEXT[] DEFAULT '{}',
  primary_photo_idx INTEGER DEFAULT 0,
  location POINT, -- Changed from JSONB to POINT for better performance
  city TEXT,
  country TEXT,
  interests TEXT[] DEFAULT '{}', -- Moved from preferences for better querying
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_verified BOOLEAN DEFAULT FALSE,
  verification_photo TEXT,
  age INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM AGE(date_of_birth))) STORED
);

-- Preferences table (simplified)
CREATE TABLE IF NOT EXISTS preferences (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
  seeking_genders TEXT[] DEFAULT '{}',
  age_min INTEGER DEFAULT 18,
  age_max INTEGER DEFAULT 100,
  max_distance_km INTEGER DEFAULT 50,
  relationship_intent TEXT DEFAULT 'not_sure' CHECK (relationship_intent IN ('serious_relationship', 'open_to_long_term', 'not_sure', 'casual')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- MATCHING TABLES
-- ========================================

-- Swipes table
CREATE TABLE IF NOT EXISTS swipes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  swiper_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('like', 'pass', 'superlike')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(swiper_user_id, target_user_id)
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_a_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_b_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unmatched', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE,
  ai_icebreakers TEXT[] DEFAULT '{}',
  icebreakers_generated_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_a_id, user_b_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  media TEXT[] DEFAULT '{}',
  message_type TEXT DEFAULT 'text',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_by_a BOOLEAN DEFAULT FALSE,
  read_by_b BOOLEAN DEFAULT FALSE,
  read_at_a TIMESTAMP WITH TIME ZONE,
  read_at_b TIMESTAMP WITH TIME ZONE,
  is_ai_generated BOOLEAN DEFAULT FALSE
);

-- Swipe counters table
CREATE TABLE IF NOT EXISTS swipe_counters (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
  remaining INTEGER DEFAULT 10,
  last_exhausted_at TIMESTAMP WITH TIME ZONE,
  next_refill_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- OPTIMIZED INDEXES
-- ========================================

-- Core indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen_at);

-- Profile indexes for fast discovery
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_age ON profiles(age);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_profiles_interests ON profiles USING GIN(interests);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_profiles_discovery ON profiles(gender, age, city);
CREATE INDEX IF NOT EXISTS idx_profiles_location_gender_age ON profiles USING GIST(location, gender, age);

-- Swipe indexes
CREATE INDEX IF NOT EXISTS idx_swipes_swiper ON swipes(swiper_user_id);
CREATE INDEX IF NOT EXISTS idx_swipes_target ON swipes(target_user_id);
CREATE INDEX IF NOT EXISTS idx_swipes_action ON swipes(action);
CREATE INDEX IF NOT EXISTS idx_swipes_composite ON swipes(swiper_user_id, target_user_id, action);

-- Match indexes
CREATE INDEX IF NOT EXISTS idx_matches_user_a ON matches(user_a_id);
CREATE INDEX IF NOT EXISTS idx_matches_user_b ON matches(user_b_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_last_message ON matches(last_message_at);

-- Message indexes
CREATE INDEX IF NOT EXISTS idx_messages_match ON messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_match_created ON messages(match_id, created_at);

-- ========================================
-- OPTIMIZED FUNCTIONS
-- ========================================

-- Function to record a swipe with proper enum casting
CREATE OR REPLACE FUNCTION record_swipe(
  swiper_uuid UUID,
  target_uuid UUID,
  swipe_action TEXT
)
RETURNS JSON AS $$
DECLARE
  remaining_count INTEGER;
  is_match BOOLEAN := FALSE;
BEGIN
  -- Insert the swipe with proper enum casting
  INSERT INTO swipes (swiper_user_id, target_user_id, action)
  VALUES (swiper_uuid, target_uuid, swipe_action::swipe_action)
  ON CONFLICT (swiper_user_id, target_user_id) DO UPDATE SET
    action = EXCLUDED.action,
    created_at = NOW();
  
  -- Get remaining swipes
  SELECT remaining INTO remaining_count
  FROM swipe_counters
  WHERE user_id = swiper_uuid;
  
  -- Check if it's a match
  IF EXISTS (
    SELECT 1 FROM swipes 
    WHERE swiper_user_id = target_uuid 
    AND target_user_id = swiper_uuid 
    AND action IN ('like', 'superlike')
  ) AND swipe_action IN ('like', 'superlike') THEN
    is_match := TRUE;
  END IF;
  
  RETURN json_build_object(
    'remaining', remaining_count,
    'is_match', is_match
  );
END;
$$ LANGUAGE plpgsql;

-- Function to create matches automatically
CREATE OR REPLACE FUNCTION create_match_on_mutual_like()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM swipes 
    WHERE swiper_user_id = NEW.target_user_id 
    AND target_user_id = NEW.swiper_user_id 
    AND action IN ('like', 'superlike')
  ) AND NEW.action IN ('like', 'superlike') THEN
    INSERT INTO matches (user_a_id, user_b_id, created_at)
    VALUES (
      LEAST(NEW.swiper_user_id, NEW.target_user_id),
      GREATEST(NEW.swiper_user_id, NEW.target_user_id),
      NOW()
    )
    ON CONFLICT (user_a_id, user_b_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update swipe counter
CREATE OR REPLACE FUNCTION update_swipe_counter()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE swipe_counters 
  SET remaining = remaining - 1,
      updated_at = NOW()
  WHERE user_id = NEW.swiper_user_id;
  
  UPDATE swipe_counters 
  SET last_exhausted_at = NOW(),
      next_refill_at = NOW() + INTERVAL '24 hours'
  WHERE user_id = NEW.swiper_user_id 
  AND remaining <= 0;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update match last message time
CREATE OR REPLACE FUNCTION update_match_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE matches 
  SET last_message_at = NEW.created_at
  WHERE id = NEW.match_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- TRIGGERS
-- ========================================

-- Trigger to create matches automatically
DROP TRIGGER IF EXISTS trigger_create_match ON swipes;
CREATE TRIGGER trigger_create_match
  AFTER INSERT ON swipes
  FOR EACH ROW
  EXECUTE FUNCTION create_match_on_mutual_like();

-- Trigger to update swipe counter
DROP TRIGGER IF EXISTS trigger_update_swipe_counter ON swipes;
CREATE TRIGGER trigger_update_swipe_counter
  AFTER INSERT ON swipes
  FOR EACH ROW
  EXECUTE FUNCTION update_swipe_counter();

-- Trigger to update match last message time
DROP TRIGGER IF EXISTS trigger_update_match_last_message ON messages;
CREATE TRIGGER trigger_update_match_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_match_last_message();

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipe_counters ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own preferences" ON preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON preferences;
DROP POLICY IF EXISTS "Users can view own swipes" ON swipes;
DROP POLICY IF EXISTS "Users can insert own swipes" ON swipes;
DROP POLICY IF EXISTS "Users can view own matches" ON matches;
DROP POLICY IF EXISTS "Users can view match messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages to matches" ON messages;
DROP POLICY IF EXISTS "Users can view own swipe counter" ON swipe_counters;
DROP POLICY IF EXISTS "Users can update own swipe counter" ON swipe_counters;
DROP POLICY IF EXISTS "Users can insert own swipe counter" ON swipe_counters;

-- Users policies
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Preferences policies
CREATE POLICY "Users can view own preferences" ON preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Swipes policies
CREATE POLICY "Users can view own swipes" ON swipes FOR SELECT USING (auth.uid() = swiper_user_id);
CREATE POLICY "Users can insert own swipes" ON swipes FOR INSERT WITH CHECK (auth.uid() = swiper_user_id);

-- Matches policies
CREATE POLICY "Users can view own matches" ON matches FOR SELECT USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

-- Messages policies
CREATE POLICY "Users can view match messages" ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM matches 
    WHERE matches.id = messages.match_id 
    AND (matches.user_a_id = auth.uid() OR matches.user_b_id = auth.uid())
  )
);
CREATE POLICY "Users can send messages to matches" ON messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM matches 
    WHERE matches.id = messages.match_id 
    AND (matches.user_a_id = auth.uid() OR matches.user_b_id = auth.uid())
  )
);

-- Swipe counters policies
CREATE POLICY "Users can view own swipe counter" ON swipe_counters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own swipe counter" ON swipe_counters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own swipe counter" ON swipe_counters FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ========================================
-- SAMPLE DATA (for testing)
-- ========================================

-- Insert sample users (replace with actual user IDs from your auth.users table)
-- INSERT INTO users (id, email, onboarding_completed) VALUES 
-- ('your-user-id-1', 'user1@example.com', true),
-- ('your-user-id-2', 'user2@example.com', true);

-- Insert sample profiles (replace with actual user IDs)
-- INSERT INTO profiles (user_id, first_name, date_of_birth, gender, bio, city, country, interests) VALUES
-- ('your-user-id-1', 'John', '1990-01-01', 'man', 'Love hiking and photography', 'New York', 'USA', ARRAY['Hiking', 'Photography', 'Travel']),
-- ('your-user-id-2', 'Sarah', '1992-05-15', 'woman', 'Fitness enthusiast and food lover', 'Los Angeles', 'USA', ARRAY['Fitness', 'Cooking', 'Yoga']);

-- Insert sample preferences (replace with actual user IDs)
-- INSERT INTO preferences (user_id, seeking_genders, age_min, age_max, max_distance_km, relationship_intent) VALUES
-- ('your-user-id-1', ARRAY['woman'], 25, 35, 50, 'serious_relationship'),
-- ('your-user-id-2', ARRAY['man'], 28, 38, 30, 'open_to_long_term');

-- Insert sample swipe counters (replace with actual user IDs)
-- INSERT INTO swipe_counters (user_id, remaining) VALUES
-- ('your-user-id-1', 10),
-- ('your-user-id-2', 10);

SELECT 'Database schema optimized successfully!' as message;
