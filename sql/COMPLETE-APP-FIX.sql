-- =====================================================
-- COMPLETE APP FIX - Alla problem
-- =====================================================
-- Kör detta ONCE i Supabase SQL Editor
-- =====================================================

-- =====================================================
-- PROBLEM 1: Profiluppgifter sparas men syns inte
-- =====================================================

-- Säkerställ att alla kolumner finns i profiles-tabellen
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS religious_practice TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS prayer_frequency TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hijab_preference TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dietary_preference TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS family_involvement TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS marriage_timeline TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS education_level TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS occupation TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS living_situation TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_children BOOLEAN;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wants_children BOOLEAN;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ethnicity TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS languages TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tribe_clan TEXT;

-- =====================================================
-- PROBLEM 2: Man/Kvinna ska endast se motsatt kön
-- =====================================================

-- Skapa en funktion som endast visar motsatt kön
CREATE OR REPLACE FUNCTION get_opposite_gender_profiles(
  current_user_id UUID,
  current_gender TEXT,
  seeking_genders TEXT[]
)
RETURNS TABLE (
  user_id UUID,
  first_name TEXT,
  age INTEGER,
  gender TEXT,
  bio TEXT,
  photos TEXT[],
  city TEXT,
  country TEXT,
  religious_practice TEXT,
  marriage_timeline TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.first_name,
    p.age,
    p.gender,
    p.bio,
    p.photos,
    p.city,
    p.country,
    p.religious_practice,
    p.marriage_timeline
  FROM profiles p
  WHERE 
    -- Inte nuvarande användare
    p.user_id != current_user_id
    -- Endast visa profiler vars kön matchar vad användaren söker
    AND (
      seeking_genders IS NULL 
      OR array_length(seeking_genders, 1) IS NULL 
      OR p.gender = ANY(seeking_genders)
    )
    -- Exkludera blockerade användare
    AND p.user_id NOT IN (
      SELECT blocked_user_id FROM user_blocks WHERE blocker_user_id = current_user_id
      UNION
      SELECT blocker_user_id FROM user_blocks WHERE blocked_user_id = current_user_id
    )
    -- Exkludera dolda profiler
    AND p.user_id NOT IN (
      SELECT hidden_user_id FROM hidden_profiles WHERE user_id = current_user_id
    )
  ORDER BY p.created_at DESC
  LIMIT 50;
END;
$$;

GRANT EXECUTE ON FUNCTION get_opposite_gender_profiles(UUID, TEXT, TEXT[]) TO authenticated;

-- =====================================================
-- PROBLEM 3: Messages och Requests hänger
-- =====================================================

-- Säkerställ att realtime är aktiverat för alla relevanta tabeller
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE connection_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- Skapa index för bättre prestanda
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_connection_requests_sender ON connection_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_receiver ON connection_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_status ON connection_requests(status);

-- =====================================================
-- PROBLEM 4: "Inte det jag söker" knappen
-- =====================================================

-- Säkerställ att hidden_profiles tabellen finns
CREATE TABLE IF NOT EXISTS hidden_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hidden_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL DEFAULT 'not_looking_for',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, hidden_user_id)
);

-- Index för hidden_profiles
CREATE INDEX IF NOT EXISTS idx_hidden_profiles_user_id ON hidden_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_hidden_profiles_hidden_user_id ON hidden_profiles(hidden_user_id);

-- Enable RLS
ALTER TABLE hidden_profiles ENABLE ROW LEVEL SECURITY;

-- Drop och återskapa policies
DROP POLICY IF EXISTS "Users can view their own hidden profiles" ON hidden_profiles;
DROP POLICY IF EXISTS "Users can hide profiles" ON hidden_profiles;
DROP POLICY IF EXISTS "Users can unhide profiles" ON hidden_profiles;

CREATE POLICY "Users can view their own hidden profiles" ON hidden_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can hide profiles" ON hidden_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unhide profiles" ON hidden_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Funktion för att dölja profil
CREATE OR REPLACE FUNCTION hide_profile(target_user_id UUID, reason TEXT DEFAULT 'not_looking_for')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO hidden_profiles (user_id, hidden_user_id, reason)
  VALUES (auth.uid(), target_user_id, reason)
  ON CONFLICT (user_id, hidden_user_id) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION hide_profile(UUID, TEXT) TO authenticated;

-- =====================================================
-- PROBLEM 5: Nya profiler syns inte i discover
-- =====================================================

-- Säkerställ att swipe_counters tabellen finns
CREATE TABLE IF NOT EXISTS swipe_counters (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  remaining INTEGER NOT NULL DEFAULT 100,
  last_exhausted_at TIMESTAMPTZ,
  next_refill_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE swipe_counters ENABLE ROW LEVEL SECURITY;

-- Policies för swipe_counters
DROP POLICY IF EXISTS "Users can view their own counter" ON swipe_counters;
DROP POLICY IF EXISTS "Users can update their own counter" ON swipe_counters;
DROP POLICY IF EXISTS "Users can insert their own counter" ON swipe_counters;

CREATE POLICY "Users can view their own counter" ON swipe_counters
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own counter" ON swipe_counters
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own counter" ON swipe_counters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Skapa swipe_counters för alla befintliga användare
INSERT INTO swipe_counters (user_id, remaining)
SELECT id, 100
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM swipe_counters)
ON CONFLICT (user_id) DO NOTHING;

-- Säkerställ att swipes tabellen finns
CREATE TABLE IF NOT EXISTS swipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swiper_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('like', 'pass', 'superlike')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(swiper_user_id, target_user_id)
);

-- Index för swipes
CREATE INDEX IF NOT EXISTS idx_swipes_swiper ON swipes(swiper_user_id);
CREATE INDEX IF NOT EXISTS idx_swipes_target ON swipes(target_user_id);
CREATE INDEX IF NOT EXISTS idx_swipes_created ON swipes(created_at DESC);

-- Enable RLS
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;

-- Policies för swipes
DROP POLICY IF EXISTS "Users can view their own swipes" ON swipes;
DROP POLICY IF EXISTS "Users can create swipes" ON swipes;

CREATE POLICY "Users can view their own swipes" ON swipes
  FOR SELECT USING (auth.uid() = swiper_user_id);

CREATE POLICY "Users can create swipes" ON swipes
  FOR INSERT WITH CHECK (auth.uid() = swiper_user_id);

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT '=== VERIFICATION ===' as section;

-- Kontrollera att alla tabeller finns
SELECT 
  'Tables exist: ' || 
  CASE WHEN (
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') AND
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'preferences' AND table_schema = 'public') AND
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'hidden_profiles' AND table_schema = 'public') AND
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'swipes' AND table_schema = 'public') AND
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'swipe_counters' AND table_schema = 'public')
  ) THEN '✅ YES' ELSE '❌ NO' END as status;

-- Kontrollera realtime
SELECT 
  'Realtime enabled for messages: ' ||
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'messages'
  ) THEN '✅ YES' ELSE '❌ NO' END as status;

SELECT 
  'Realtime enabled for connection_requests: ' ||
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'connection_requests'
  ) THEN '✅ YES' ELSE '❌ NO' END as status;

-- Räkna profiler
SELECT 
  'Total profiles: ' || COUNT(*) as info
FROM profiles;

-- Räkna profiler med kön satt
SELECT 
  'Profiles with gender: ' || COUNT(*) as info
FROM profiles
WHERE gender IS NOT NULL AND gender != 'prefer_not_to_say';

SELECT '=== FIX COMPLETE ===' as message;
SELECT 'Testa appen nu!' as next_step;
