// Database Migration Script
// Run this in your Expo app or as a standalone script

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zfnwtnqwokwvuxxwxgsr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmbnd0bnF3b2t3dnV4eHd4Z3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MzgwNTUsImV4cCI6MjA3MzUxNDA1NX0.Q9MA7FNex8ZrJ_V9wux4OwrvKhsKGjZfxsf0qH-yz4Q';

const supabase = createClient(supabaseUrl, supabaseKey);

// Migration SQL commands
const migrations = [
  {
    name: 'Create Database Schema',
    sql: `
      -- Enable necessary extensions
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
        location JSONB,
        city TEXT,
        country TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_verified BOOLEAN DEFAULT FALSE,
        verification_photo TEXT,
        age INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM AGE(date_of_birth))) STORED
      );

      -- Preferences table
      CREATE TABLE IF NOT EXISTS preferences (
        user_id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
        seeking_genders TEXT[] DEFAULT '{}',
        age_min INTEGER DEFAULT 18,
        age_max INTEGER DEFAULT 100,
        max_distance_km INTEGER DEFAULT 50,
        relationship_intent TEXT DEFAULT 'not_sure' CHECK (relationship_intent IN ('serious_relationship', 'open_to_long_term', 'not_sure', 'casual')),
        lifestyle JSONB DEFAULT '{}',
        values TEXT[] DEFAULT '{}',
        deal_breakers TEXT[] DEFAULT '{}',
        interests TEXT[] DEFAULT '{}',
        quiet_hours_start TIME,
        quiet_hours_end TIME,
        focus_session_duration INTEGER DEFAULT 25,
        daily_goal TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

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

      -- Focus sessions table
      CREATE TABLE IF NOT EXISTS focus_sessions (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        duration_minutes INTEGER NOT NULL,
        swipes_count INTEGER DEFAULT 0,
        matches_count INTEGER DEFAULT 0,
        started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ended_at TIMESTAMP WITH TIME ZONE,
        goal TEXT,
        notes TEXT
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_swipes_swiper ON swipes(swiper_user_id);
      CREATE INDEX IF NOT EXISTS idx_swipes_target ON swipes(target_user_id);
      CREATE INDEX IF NOT EXISTS idx_matches_user_a ON matches(user_a_id);
      CREATE INDEX IF NOT EXISTS idx_matches_user_b ON matches(user_b_id);
      CREATE INDEX IF NOT EXISTS idx_messages_match ON messages(match_id);
      CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
      CREATE INDEX IF NOT EXISTS idx_profiles_age ON profiles(age);
      CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);
      CREATE INDEX IF NOT EXISTS idx_profiles_gender ON profiles(gender);
    `
  }
];

export async function runMigrations() {
  console.log('🚀 Starting database migrations...');
  
  for (const migration of migrations) {
    try {
      console.log(`📋 Running: ${migration.name}`);
      
      // Execute SQL using Supabase RPC
      const { error } = await supabase.rpc('exec_sql', { sql: migration.sql });
      
      if (error) {
        console.error(`❌ Failed: ${migration.name}`, error);
        throw error;
      }
      
      console.log(`✅ Completed: ${migration.name}`);
    } catch (error) {
      console.error(`❌ Migration failed: ${migration.name}`, error);
      throw error;
    }
  }
  
  console.log('🎉 Database migrations completed successfully!');
}

// For testing - you can call this function
export async function testConnection() {
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) {
      console.log('❌ Connection test failed:', error.message);
      return false;
    }
    console.log('✅ Supabase connection successful!');
    return true;
  } catch (error) {
    console.log('❌ Connection test failed:', error);
    return false;
  }
}
