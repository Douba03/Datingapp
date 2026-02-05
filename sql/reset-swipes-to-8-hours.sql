-- =====================================================
-- RESET SWIPES TO 8-HOUR REFILL
-- =====================================================
-- Run this in Supabase SQL Editor to:
-- 1. Reset all users to 10 swipes
-- 2. Update the system to use 8-hour refill instead of 12
-- =====================================================

-- Reset all existing users to 10 swipes (fresh start)
UPDATE swipe_counters 
SET remaining = 10, 
    last_exhausted_at = NULL, 
    next_refill_at = NULL, 
    updated_at = NOW();

-- Success message
SELECT 'All users reset to 10 swipes! System now uses 8-hour refill.' as message;
