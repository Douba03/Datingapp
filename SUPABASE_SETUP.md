# Supabase Database Setup Guide

## Step 1: Create Environment File
Create a `.env.local` file in your project root with:
```
EXPO_PUBLIC_SUPABASE_URL=https://zfnwtnqwokwvuxxwxgsr.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmbnd0bnF3b2t3dnV4eHd4Z3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MzgwNTUsImV4cCI6MjA3MzUxNDA1NX0.Q9MA7FNex8ZrJ_V9wux4OwrvKhsKGjZfxsf0qH-yz4Q
```

## Step 2: Set Up Database Schema
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Open your project: `zfnwtnqwokwvuxxwxgsr`
3. Go to SQL Editor
4. Run the SQL files in this order:
   - `database-schema.sql` - Creates all tables and indexes
   - `database-functions.sql` - Creates functions and triggers
   - `sample-data.sql` - Inserts sample data (optional)

## Step 3: Configure Row Level Security (RLS)
Run these commands in Supabase SQL Editor:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipe_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
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

-- Focus sessions policies
CREATE POLICY "Users can view own focus sessions" ON focus_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own focus sessions" ON focus_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own focus sessions" ON focus_sessions FOR UPDATE USING (auth.uid() = user_id);
```

## Step 4: Test the Connection
1. Restart your Expo server: `npm start`
2. Try to sign up/login in your app
3. Check if profiles load in the Discover tab

## Step 5: Create Test Users
1. Use your app's signup flow to create test accounts
2. Or create users manually in Supabase Auth dashboard
3. Update the sample data with real user IDs

## Troubleshooting
- Check Supabase logs for any errors
- Verify RLS policies are working correctly
- Test database functions in SQL Editor
- Check network requests in Expo DevTools
