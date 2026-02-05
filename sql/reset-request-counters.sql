-- =====================================================
-- RESET REQUEST COUNTERS TO 10 FOR ALL USERS
-- =====================================================
-- This resets all existing users to 10 requests
-- and ensures new users get 10 requests automatically
-- =====================================================

-- 1. Reset all existing users to 10 requests
UPDATE request_counters 
SET remaining = 10, 
    last_exhausted_at = NULL, 
    next_refill_at = NULL, 
    updated_at = NOW();

-- 2. Create request counters for any users who don't have one yet
INSERT INTO request_counters (user_id, remaining)
SELECT id, 10
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM request_counters)
ON CONFLICT (user_id) DO NOTHING;

-- Success message
SELECT 
  COUNT(*) as total_users_with_requests,
  'All users now have 10 requests!' as message
FROM request_counters;
