-- Add test location data for existing profiles
-- Run this in Supabase SQL Editor to give existing profiles realistic locations

-- Update profiles with test locations (different cities for testing)
UPDATE profiles 
SET 
  location = '{"lat": 37.7749, "lng": -122.4194}'::jsonb,  -- San Francisco
  city = 'San Francisco',
  country = 'United States'
WHERE first_name = 'abdi';

UPDATE profiles 
SET 
  location = '{"lat": 40.7128, "lng": -74.0060}'::jsonb,  -- New York
  city = 'New York',
  country = 'United States'
WHERE first_name = 'qqwqwq';

UPDATE profiles 
SET 
  location = '{"lat": 34.0522, "lng": -118.2437}'::jsonb,  -- Los Angeles
  city = 'Los Angeles',
  country = 'United States'
WHERE first_name = 'bby';

UPDATE profiles 
SET 
  location = '{"lat": 41.8781, "lng": -87.6298}'::jsonb,  -- Chicago
  city = 'Chicago',
  country = 'United States'
WHERE first_name = 'sarah';

-- Verify the updates
SELECT 
  first_name,
  city,
  country,
  location
FROM profiles 
ORDER BY first_name;

SELECT 'Test locations added successfully!' as message;
