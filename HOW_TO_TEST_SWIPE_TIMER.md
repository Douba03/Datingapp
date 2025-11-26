# How to Test the Swipe Counter and 12-Hour Timer

## Overview

There are 3 ways to test the swipe counter and timer system:

### Method 1: Quick SQL Test (Recommended for initial setup)

Run the SQL script in your Supabase SQL Editor:

**File:** `src/sql/test-swipe-timer.sql`

**What it does:**
- Checks current swipe counters
- Shows which users have exhausted swipes
- Simulates exhausting swipes with a 1-minute timer (for quick testing)
- Tests the refill function
- Lists all swipe counter states

**How to use:**
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `src/sql/test-swipe-timer.sql`
3. Run the script
4. Review the results to verify everything is working

### Method 2: JavaScript Test Script

Run the automated test script from your terminal:

**File:** `test-swipe-timer.js`

**What it does:**
- Authenticates with your current user
- Tests the swipe counter creation
- Simulates exhausting swipes
- Tests the refill function
- Verifies swipe count decrements properly

**How to use:**
```bash
node test-swipe-timer.js
```

### Method 3: Manual App Testing (Best for real user experience)

Test directly in your app:

**Steps:**
1. Log in to your app
2. Navigate to the Discover screen
3. Swipe on profiles until you reach 0 swipes
4. Note the refill timer that appears
5. Wait 12 hours or manually trigger refill (see below)

**To manually trigger a refill for testing:**

Run this SQL in Supabase:

```sql
-- Set your swipe counter to exhausted with 1-minute timer
UPDATE swipe_counters
SET remaining = 0,
    last_exhausted_at = NOW(),
    next_refill_at = NOW() + INTERVAL '1 minute',
    updated_at = NOW()
WHERE user_id = 'YOUR_USER_ID_HERE';

-- Then wait 1 minute and run:
SELECT check_and_refill_swipes();

-- Check if it refilled:
SELECT * FROM swipe_counters WHERE user_id = 'YOUR_USER_ID_HERE';
```

## Expected Behavior

### Normal Operation

1. **Initial state:** User has 10 swipes
2. **Swipe:** Counter decreases by 1 each swipe (not 2!)
3. **Exhausted:** When swipes reach 0, timer starts
4. **Timer:** Shows "Swipes refill in X hours Y minutes"
5. **Refill:** After 12 hours, swipes reset to 10

### Error Cases to Check

1. **Double decrement:** Should NOT happen - verify count goes down by 1 per swipe
2. **Timer not setting:** Check `next_refill_at` is set when swipes reach 0
3. **Refill not working:** Timer expires but swipes don't reset
4. **UI not updating:** Counter in app doesn't match database

## Troubleshooting

### Counter Decrements by 2 Instead of 1

**Cause:** Duplicate trigger or function call

**Solution:** Run `src/sql/fix-swipe-counter-and-timer.sql` in Supabase SQL Editor

### Timer Not Showing

**Cause:** `next_refill_at` not being set

**Solution:** Check the `record_swipe` function is setting the timer correctly

### Swipes Not Refilling

**Cause:** `check_and_refill_swipes` not being called

**Solutions:**
1. Set up a cron job in Supabase Dashboard (Database → Cron Jobs)
2. Call it manually: `SELECT check_and_refill_swipes();`
3. Or implement client-side check in your app

## Setting Up Automated Refills

### Option 1: Supabase Cron Job (Recommended)

1. Go to Supabase Dashboard → Database → Cron Jobs
2. Create a new cron job:
   - **Name:** Refill Swipes
   - **Schedule:** `0 * * * *` (every hour)
   - **SQL:** `SELECT check_and_refill_swipes();`

### Option 2: Client-Side Check

Add to your app initialization:

```typescript
// Check and refill swipes on app start
useEffect(() => {
  supabase.rpc('check_and_refill_swipes');
}, []);
```

## Quick Test Checklist

- [ ] Run `test-swipe-timer.sql` - all tests pass
- [ ] Swipe 5 times - counter goes from 10 to 5
- [ ] Swipe until 0 - timer shows refill time
- [ ] Wait for timer (or manually trigger) - swipes reset to 10
- [ ] UI shows correct count
- [ ] No duplicate decrements

## Getting Your User ID

To get your user ID for testing, run this SQL:

```sql
SELECT id, email FROM auth.users;
```

Or check the console in your app when logged in.
