# 🔧 Fix Swipe Buttons (Like/Dislike)

## 🔍 Problem Identified

The swipe buttons **ARE working**, but they fail when trying to swipe on the same person twice because of a duplicate key error:

```
Error: duplicate key value violates unique constraint "swipes_swiper_user_id_target_user_id_key"
```

This happens because:
1. The test accounts already swiped on each other during our tests
2. The database function wasn't properly handling duplicate swipes
3. It should UPDATE existing swipes instead of failing

---

## ✅ Solution

Run this SQL in your Supabase SQL Editor to fix the function:

### Step 1: Go to Supabase Dashboard
1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New query**

### Step 2: Copy and paste this SQL:

```sql
-- Fix swipe buttons to handle duplicate swipes properly
CREATE OR REPLACE FUNCTION record_swipe(
  swiper_uuid UUID,
  target_uuid UUID,
  swipe_action TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_swipe RECORD;
  reverse_swipe RECORD;
  new_match_id UUID;
  remaining_swipes INTEGER;
  result JSON;
BEGIN
  -- Check if swiper is trying to swipe on themselves
  IF swiper_uuid = target_uuid THEN
    RAISE EXCEPTION 'Cannot swipe on yourself';
  END IF;

  -- Get or create swipe counter
  INSERT INTO swipe_counters (user_id, remaining)
  VALUES (swiper_uuid, 100)
  ON CONFLICT (user_id) DO NOTHING;

  -- Get remaining swipes
  SELECT remaining INTO remaining_swipes
  FROM swipe_counters
  WHERE user_id = swiper_uuid;

  -- Check if user has swipes remaining
  IF remaining_swipes <= 0 THEN
    result := json_build_object(
      'success', false,
      'error', 'No swipes remaining',
      'remaining', 0
    );
    RETURN result;
  END IF;

  -- Check if swipe already exists
  SELECT * INTO existing_swipe
  FROM swipes
  WHERE swiper_user_id = swiper_uuid AND target_user_id = target_uuid;

  IF existing_swipe IS NOT NULL THEN
    -- Update existing swipe with explicit cast
    UPDATE swipes
    SET action = swipe_action::swipe_action,
        created_at = NOW()
    WHERE swiper_user_id = swiper_uuid AND target_user_id = target_uuid;
    
    -- Don't decrement counter for re-swipes
    result := json_build_object(
      'success', true,
      'is_match', false,
      'remaining', remaining_swipes,
      'message', 'Swipe updated'
    );
    RETURN result;
  ELSE
    -- Insert new swipe with explicit cast
    INSERT INTO swipes (swiper_user_id, target_user_id, action)
    VALUES (swiper_uuid, target_uuid, swipe_action::swipe_action);
    
    -- Decrement swipe counter only for new swipes
    UPDATE swipe_counters
    SET remaining = remaining - 1
    WHERE user_id = swiper_uuid;
    
    remaining_swipes := remaining_swipes - 1;
  END IF;

  -- Check for mutual like (match)
  IF swipe_action = 'like' OR swipe_action = 'superlike' THEN
    SELECT * INTO reverse_swipe
    FROM swipes
    WHERE swiper_user_id = target_uuid 
      AND target_user_id = swiper_uuid 
      AND action IN ('like', 'superlike');

    IF reverse_swipe IS NOT NULL THEN
      -- Create match
      INSERT INTO matches (user_a_id, user_b_id, status)
      VALUES (
        LEAST(swiper_uuid, target_uuid),
        GREATEST(swiper_uuid, target_uuid),
        'active'
      )
      ON CONFLICT (user_a_id, user_b_id) DO NOTHING
      RETURNING id INTO new_match_id;

      result := json_build_object(
        'success', true,
        'is_match', true,
        'match_id', new_match_id,
        'remaining', remaining_swipes
      );
      RETURN result;
    END IF;
  END IF;

  -- No match
  result := json_build_object(
    'success', true,
    'is_match', false,
    'remaining', remaining_swipes
  );
  RETURN result;
END;
$$;
```

### Step 3: Run the query
1. Click **Run** (or press Ctrl+Enter / Cmd+Enter)
2. You should see: `✅ Success. No rows returned`

---

## 🧪 Test It

After running the SQL:

1. **Login** to your app with any test account:
   ```
   Email: testuser1@example.com
   Password: TestPass123!
   ```

2. **Go to Discover tab**

3. **Click the heart button** ❤️
   - Should show "Liked!" alert
   - Profile should disappear from stack
   - Should work even if you already swiped on this person

4. **Try other buttons:**
   - ❌ Pass button
   - ⭐ Superlike button

---

## 🎯 What This Fixes

✅ Handles duplicate swipes gracefully (updates instead of failing)
✅ Doesn't decrement swipe counter for re-swipes
✅ Properly casts text to enum type
✅ Creates matches when both users like each other
✅ Returns proper success/error messages

---

## 📊 Expected Behavior

### First time swiping on someone:
- ✅ Swipe is recorded
- ✅ Counter decrements
- ✅ Profile disappears
- ✅ Shows feedback alert

### Swiping on same person again (if they appear again):
- ✅ Swipe is updated
- ✅ Counter stays same (no decrement)
- ✅ Profile disappears
- ✅ Shows feedback alert

### When it's a match:
- ✅ Creates match in database
- ✅ Shows "It's a Match!" alert
- ✅ Option to view matches or keep swiping

---

## 🔍 Troubleshooting

### If buttons still don't work:

1. **Check browser console** (F12 → Console tab)
   - Look for `[Discover] Button pressed: like`
   - Look for any error messages

2. **Check if you have swipes left:**
   - Look at the swipe counter at the top
   - If it says "0 swipes left", you need to wait for refill

3. **Check if there are profiles to swipe on:**
   - If you see "No profiles available", you've swiped on everyone
   - Create more test accounts or wait for new users

4. **Run test script:**
   ```bash
   node test-swipe-buttons-detailed.js
   ```
   - This will show exactly what's happening

---

## ✅ Summary

The swipe buttons ARE working! The issue was:
- ❌ Database function failed on duplicate swipes
- ✅ Fixed by updating existing swipes instead of inserting

After running the SQL above, all swipe buttons should work perfectly! 🎉

