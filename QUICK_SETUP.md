# 🚀 Quick Database Setup Guide

## Option 1: Manual Setup (Recommended)

### Step 1: Create .env.local file
Create `.env.local` in your project root:
```
EXPO_PUBLIC_SUPABASE_URL=https://zfnwtnqwokwvuxxwxgsr.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmbnd0bnF3b2t3dnV4eHd4Z3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MzgwNTUsImV4cCI6MjA3MzUxNDA1NX0.Q9MA7FNex8ZrJ_V9wux4OwrvKhsKGjZfxsf0qH-yz4Q
```

### Step 2: Run Database Migrations
1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Open your project**: `zfnwtnqwokwvuxxwxgsr`
3. **Go to SQL Editor**
4. **Run these SQL files in order**:

#### File 1: database-schema.sql
```sql
-- Copy and paste the entire content from database-schema.sql
-- This creates all tables and indexes
```

#### File 2: database-functions.sql  
```sql
-- Copy and paste the entire content from database-functions.sql
-- This creates functions and triggers
```

#### File 3: Row Level Security
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

-- Focus sessions policies
CREATE POLICY "Users can view own focus sessions" ON focus_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own focus sessions" ON focus_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own focus sessions" ON focus_sessions FOR UPDATE USING (auth.uid() = user_id);
```

### Step 3: Test the Setup
1. **Restart your app**: `npm start`
2. **Try to sign up/login** in your app
3. **Check if profiles load** in the Discover tab

## Option 2: Automated Setup (Advanced)

If you want to try automated setup, run:
```bash
node run-migrations.js
```

But you'll still need to manually run the SQL files in Supabase dashboard.

## 🎯 What This Sets Up

✅ **Complete Database Schema** - All tables for your dating app
✅ **Automatic Matching** - When two users like each other, a match is created
✅ **Real-time Chat** - Messages update in real-time  
✅ **Swipe Counter** - Tracks remaining swipes and refills daily
✅ **AI Icebreakers** - Generated conversation starters
✅ **Row Level Security** - Protects user data
✅ **Sample Data** - Test profiles and matches

## 🚨 Important Notes

- **Create .env.local file** with your Supabase credentials
- **Run SQL files in order** - schema → functions → RLS policies
- **Test the connection** before proceeding
- **Create test users** through your app's signup flow

## 🔧 Troubleshooting

- Check Supabase logs for errors
- Verify RLS policies are working
- Test database functions in SQL Editor
- Check network requests in Expo DevTools

Your app should now have full database functionality! 🚀
