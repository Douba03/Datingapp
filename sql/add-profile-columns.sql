-- =====================================================
-- ADD MISSING PROFILE COLUMNS
-- =====================================================
-- Run this in Supabase SQL Editor to add all columns
-- needed for onboarding data
-- =====================================================

-- Create enums if they don't exist
DO $$ BEGIN
  CREATE TYPE religious_practice AS ENUM ('very_practicing', 'practicing', 'moderately_practicing', 'cultural', 'not_practicing');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE prayer_frequency AS ENUM ('five_daily', 'some_daily', 'friday_only', 'occasionally', 'rarely', 'never');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE hijab_preference AS ENUM ('always', 'sometimes', 'not_currently', 'never', 'not_applicable');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE dietary_preference AS ENUM ('strictly_halal', 'halal_preferred', 'no_pork', 'no_restrictions');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE family_involvement AS ENUM ('very_involved', 'somewhat_involved', 'minimal', 'not_involved');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE marriage_timeline AS ENUM ('asap', 'within_year', 'one_to_two_years', 'when_right_person', 'not_sure');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE education_level AS ENUM ('high_school', 'some_college', 'bachelors', 'masters', 'doctorate', 'trade_school', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE living_situation AS ENUM ('alone', 'with_family', 'with_roommates', 'with_spouse', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add columns to profiles table (IF NOT EXISTS)
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

-- Create indexes for commonly filtered fields
CREATE INDEX IF NOT EXISTS idx_profiles_religious_practice ON profiles(religious_practice);
CREATE INDEX IF NOT EXISTS idx_profiles_marriage_timeline ON profiles(marriage_timeline);
CREATE INDEX IF NOT EXISTS idx_profiles_education_level ON profiles(education_level);
CREATE INDEX IF NOT EXISTS idx_profiles_has_children ON profiles(has_children);
CREATE INDEX IF NOT EXISTS idx_profiles_wants_children ON profiles(wants_children);

-- Success message
SELECT 'Profile columns added successfully! All onboarding data will now be saved.' as message;
