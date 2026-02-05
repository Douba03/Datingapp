-- Migration: Add religious and cultural fields to profiles for Calafdoon
-- These fields support the Somali marriage-focused platform

-- Create enums for the new fields
CREATE TYPE religious_practice AS ENUM (
  'very_practicing',
  'practicing', 
  'somewhat_practicing',
  'cultural',
  'not_practicing'
);

CREATE TYPE prayer_frequency AS ENUM (
  'five_daily',
  'some_daily',
  'friday_only',
  'occasionally',
  'rarely',
  'prefer_not_say'
);

CREATE TYPE hijab_preference AS ENUM (
  'always',
  'sometimes',
  'not_currently',
  'prefer_not_say',
  'not_applicable'
);

CREATE TYPE dietary_preference AS ENUM (
  'strict_halal',
  'halal_preferred',
  'no_pork',
  'no_restriction'
);

CREATE TYPE family_involvement AS ENUM (
  'very_involved',
  'somewhat_involved',
  'minimal',
  'prefer_not_say'
);

CREATE TYPE marriage_timeline AS ENUM (
  'within_year',
  'one_to_two_years',
  'when_ready',
  'not_sure'
);

CREATE TYPE education_level AS ENUM (
  'high_school',
  'some_college',
  'bachelors',
  'masters',
  'doctorate',
  'other'
);

CREATE TYPE living_situation AS ENUM (
  'with_family',
  'alone',
  'with_roommates',
  'other'
);

-- Add new columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS religious_practice religious_practice;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS prayer_frequency prayer_frequency;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hijab_preference hijab_preference;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dietary_preference dietary_preference;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS family_involvement family_involvement;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS marriage_timeline marriage_timeline;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS education_level education_level;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS occupation TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS living_situation living_situation;
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

-- Add comments for documentation
COMMENT ON COLUMN profiles.religious_practice IS 'Level of religious practice';
COMMENT ON COLUMN profiles.prayer_frequency IS 'How often the user prays';
COMMENT ON COLUMN profiles.hijab_preference IS 'Hijab wearing preference (for women)';
COMMENT ON COLUMN profiles.dietary_preference IS 'Halal/dietary preferences';
COMMENT ON COLUMN profiles.family_involvement IS 'How involved family will be in marriage decision';
COMMENT ON COLUMN profiles.marriage_timeline IS 'When looking to get married';
COMMENT ON COLUMN profiles.education_level IS 'Highest education level';
COMMENT ON COLUMN profiles.occupation IS 'Current occupation/job';
COMMENT ON COLUMN profiles.living_situation IS 'Current living arrangement';
COMMENT ON COLUMN profiles.has_children IS 'Whether user has children';
COMMENT ON COLUMN profiles.wants_children IS 'Whether user wants children';
COMMENT ON COLUMN profiles.ethnicity IS 'Ethnic background';
COMMENT ON COLUMN profiles.languages IS 'Languages spoken';
COMMENT ON COLUMN profiles.tribe_clan IS 'Somali tribe/clan (optional)';
