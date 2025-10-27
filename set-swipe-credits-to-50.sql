-- Migration: Set swipe credits to 50
-- Run this in Supabase SQL Editor

-- 1) Update default for new rows
ALTER TABLE public.swipe_counters
  ALTER COLUMN remaining SET DEFAULT 50;

-- 2) Update refill function to top up to 50
CREATE OR REPLACE FUNCTION refill_daily_swipes()
RETURNS void AS $$
BEGIN
  UPDATE swipe_counters 
  SET remaining = 50,
      last_exhausted_at = NULL,
      next_refill_at = NULL,
      updated_at = NOW()
  WHERE next_refill_at <= NOW() 
  AND remaining <= 0;
END;
$$ LANGUAGE plpgsql;

-- 3) Reset everyone to 50 now (safe: only increases to 50)
UPDATE public.swipe_counters
SET remaining = 50,
    last_exhausted_at = NULL,
    next_refill_at = NULL,
    updated_at = NOW();

-- 4) Ensure a row exists for all users (optional)
INSERT INTO public.swipe_counters (user_id, remaining)
SELECT u.id, 50
FROM public.users u
LEFT JOIN public.swipe_counters sc ON sc.user_id = u.id
WHERE sc.user_id IS NULL;

SELECT '✅ Swipe credits set to 50 for all users.' AS status;

