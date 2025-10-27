-- Reset swipes for testuser1@example.com (Alice)
-- Run this in Supabase SQL Editor if swipe counter is at 0

-- Alice's user ID
-- 430daeb0-c722-40de-976a-183036aade4a

-- 1. Check current status
SELECT 
  'Current Status' as info,
  remaining as swipes_left,
  next_refill_at
FROM swipe_counters 
WHERE user_id = '430daeb0-c722-40de-976a-183036aade4a';

-- 2. Reset swipe counter to 100
UPDATE swipe_counters 
SET remaining = 100, 
    next_refill_at = NOW() + INTERVAL '24 hours',
    last_exhausted_at = NULL
WHERE user_id = '430daeb0-c722-40de-976a-183036aade4a';

-- 3. Verify the update
SELECT 
  'After Reset' as info,
  remaining as swipes_left,
  next_refill_at
FROM swipe_counters 
WHERE user_id = '430daeb0-c722-40de-976a-183036aade4a';

-- 4. Optional: Clear all swipes to see profiles again
-- Uncomment the lines below if you want to swipe on people again

-- DELETE FROM swipes 
-- WHERE swiper_user_id = '430daeb0-c722-40de-976a-183036aade4a';

-- SELECT 'Swipes cleared! You can now swipe on everyone again.' as message;

SELECT '✅ Swipe counter reset to 100! Try swiping now.' as message;

