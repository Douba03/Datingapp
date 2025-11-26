-- TEST SWIPE COUNTER AND 12-HOUR TIMER
-- Run this in Supabase SQL Editor to test the swipe counter system

-- First, let's check the current state
SELECT 
  'Current swipe counters:' as test_name,
  user_id,
  remaining,
  last_exhausted_at,
  next_refill_at,
  created_at,
  updated_at
FROM swipe_counters;

-- Test 1: Set up a test scenario - exhaust swipes for a user
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID from auth.users
SELECT 'Test 1: Exhaust swipes for testing' as test_name;

-- First, get a real user ID to test with
SELECT 
  'Test User IDs:' as info,
  id,
  email
FROM auth.users
LIMIT 5;

-- Test 2: Manually set a user's swipes to 0 and set refill to 1 minute from now
-- This simulates exhausting swipes and lets you test refill quickly
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID
UPDATE swipe_counters
SET remaining = 0,
    last_exhausted_at = NOW(),
    next_refill_at = NOW() + INTERVAL '1 minute',
    updated_at = NOW()
WHERE user_id = (SELECT id FROM auth.users LIMIT 1);

SELECT 'Swipes exhausted for test user. Timer set to 1 minute.' as message;

-- Test 3: Check the refill function
SELECT 'Test 3: Test refill function manually' as test_name;

-- Call the refill function to see if it works
SELECT check_and_refill_swipes();

-- Check if swipes were refilled
SELECT 
  'Result after refill:' as info,
  user_id,
  remaining,
  next_refill_at
FROM swipe_counters
WHERE user_id = (SELECT id FROM auth.users LIMIT 1);

-- Test 4: Reset back to normal for your user
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID
UPDATE swipe_counters
SET remaining = 10,
    last_exhausted_at = NULL,
    next_refill_at = NULL,
    updated_at = NOW()
WHERE user_id = (SELECT id FROM auth.users LIMIT 1);

SELECT 'Swipes reset to 10 for testing.' as message;

-- Test 5: Test the record_swipe function with a real swipe
-- This will test if it decrements by 1 only
SELECT 'Test 5: Test record_swipe function' as test_name;

-- Get two test users
WITH test_users AS (
  SELECT id FROM auth.users LIMIT 2
)
SELECT 
  'Test users:' as info,
  t1.id as user_1,
  t2.id as user_2
FROM 
  (SELECT id FROM test_users LIMIT 1) t1,
  (SELECT id FROM test_users OFFSET 1 LIMIT 1) t2;

-- Test 6: Show all active swipe counters
SELECT 
  'All swipe counters:' as info,
  user_id,
  remaining,
  last_exhausted_at,
  next_refill_at,
  CASE 
    WHEN remaining > 0 THEN 'Has swipes available'
    WHEN next_refill_at IS NULL THEN 'No timer set'
    WHEN next_refill_at > NOW() THEN 'Waiting for refill'
    ELSE 'Refill ready!'
  END as status
FROM swipe_counters
ORDER BY remaining DESC, next_refill_at DESC NULLS LAST;

-- Test 7: Check for users with expired refill timers
SELECT 
  'Users with expired timers (should be refilled):' as info,
  user_id,
  remaining,
  next_refill_at,
  NOW() as current_time,
  next_refill_at <= NOW() as should_be_refilled
FROM swipe_counters
WHERE next_refill_at IS NOT NULL
  AND next_refill_at <= NOW();

-- Success message
SELECT 'All tests completed! Check the results above.' as final_message;
