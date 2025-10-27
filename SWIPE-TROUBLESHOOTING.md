# 🔍 Swipe Button Troubleshooting for testuser1@example.com

## ✅ Good News!

The backend test shows **everything is working**:
- ✅ Profile exists (Alice, 30, woman)
- ✅ Preferences set correctly
- ✅ Has swipes remaining (100 default)
- ✅ Has 5+ profiles available to swipe on
- ✅ Swipe function works (test swipe succeeded)

**The swipe system IS working!** The issue is likely in the UI/frontend.

---

## 🔍 What to Check in Your App

### 1. **Open Browser Console** (Most Important!)
Press `F12` or right-click → Inspect → Console tab

Look for these messages when you click a swipe button:

#### ✅ **Good Messages** (means it's working):
```
[Discover] Button pressed: like
[Discover] Current profiles count: 5
[Discover] Can swipe: true
[Discover] Swiping like on TestUser (f6055747...)
[useMatches] Swiping: {targetUserId: "...", action: "like"}
[useMatches] Swipe result: {remaining: 99, is_match: false}
[Discover] ❤️ Liked TestUser
```

#### ❌ **Bad Messages** (means there's an error):
```
[Discover] No swipes left
[Discover] No profile to swipe on
[Discover] Swipe error: {...}
Error: ...
```

---

### 2. **Check What You See in the App**

#### On the Discover Screen, do you see:

**A) No profiles at all?**
- Screen shows "No profiles available"
- **Solution**: You may have swiped on everyone. Create more test accounts or adjust preferences.

**B) Profiles but buttons don't respond?**
- You see profile cards but clicking buttons does nothing
- **Solution**: Check browser console for JavaScript errors

**C) "No swipes left" message?**
- Counter shows 0 swipes remaining
- **Solution**: Wait for refill or reset counter (see below)

**D) Buttons work but show error alert?**
- Buttons respond but show error message
- **Solution**: Check the error message - likely the duplicate key issue

---

### 3. **Common Issues & Solutions**

#### Issue 1: "No swipes left"
**Symptom:** Counter shows 0 swipes

**Solution:** Reset the swipe counter:
```sql
-- Run in Supabase SQL Editor
UPDATE swipe_counters 
SET remaining = 100, 
    next_refill_at = NOW() + INTERVAL '24 hours'
WHERE user_id = '430daeb0-c722-40de-976a-183036aade4a'; -- Alice's ID
```

#### Issue 2: "Duplicate key error"
**Symptom:** Error message about duplicate key constraint

**Solution:** Run `fix-swipe-buttons.sql` in Supabase SQL Editor

#### Issue 3: "No profiles available"
**Symptom:** Empty discover screen

**Solution:** 
- You've swiped on all available users
- Create more test accounts
- Or clear existing swipes:
```sql
-- Run in Supabase SQL Editor
DELETE FROM swipes 
WHERE swiper_user_id = '430daeb0-c722-40de-976a-183036aade4a'; -- Alice's ID
```

#### Issue 4: Buttons don't respond at all
**Symptom:** Clicking buttons does nothing, no console messages

**Possible causes:**
1. **JavaScript error** - Check console for errors
2. **App not loaded** - Try refreshing the page
3. **Wrong tab** - Make sure you're on the Discover tab
4. **Loading state** - Wait for profiles to load

---

### 4. **Quick Test Steps**

1. **Login** to app with:
   ```
   Email: testuser1@example.com
   Password: TestPass123!
   ```

2. **Go to Discover tab** (should be the home/first tab)

3. **Open browser console** (F12)

4. **Click the heart button** ❤️

5. **Check console** - What messages do you see?

6. **Report back** with:
   - What you see on screen
   - What messages appear in console
   - Any error messages

---

### 5. **Reset Everything for Fresh Test**

If you want to start completely fresh:

```sql
-- Run in Supabase SQL Editor

-- Reset swipe counter
UPDATE swipe_counters 
SET remaining = 100, 
    next_refill_at = NOW() + INTERVAL '24 hours'
WHERE user_id = '430daeb0-c722-40de-976a-183036aade4a';

-- Clear all swipes (optional - only if you want to see profiles again)
DELETE FROM swipes 
WHERE swiper_user_id = '430daeb0-c722-40de-976a-183036aade4a';

-- Verify
SELECT * FROM swipe_counters 
WHERE user_id = '430daeb0-c722-40de-976a-183036aade4a';
```

---

### 6. **Test Accounts Available**

You can also test with other accounts:

```
testuser2@example.com / TestPass123!  (Bob, 32, man)
testuser3@example.com / TestPass123!  (Charlie, 27, non-binary)
```

---

## 🎯 Most Likely Issues

Based on the backend test, the most likely issues are:

1. **Swipe counter is at 0** (most common)
   - Solution: Reset counter with SQL above

2. **No profiles showing** (you swiped on everyone)
   - Solution: Clear swipes or create more accounts

3. **Duplicate key error** (trying to swipe twice)
   - Solution: Run `fix-swipe-buttons.sql`

4. **UI not loading** (JavaScript error)
   - Solution: Check browser console, refresh page

---

## 📝 What to Tell Me

To help you further, please tell me:

1. **What do you see on the Discover screen?**
   - Profile cards?
   - Empty screen?
   - Loading spinner?

2. **What happens when you click the heart button?**
   - Nothing?
   - Error alert?
   - Success alert but profile doesn't disappear?

3. **What's in the browser console?** (F12 → Console)
   - Any error messages?
   - Any [Discover] or [useMatches] messages?

4. **What does the swipe counter show?**
   - Number at the top of screen
   - Does it say "0 swipes left"?

---

## ✅ Quick Fix Commands

Copy these to Supabase SQL Editor if needed:

```sql
-- Reset swipe counter for Alice
UPDATE swipe_counters 
SET remaining = 100, 
    next_refill_at = NOW() + INTERVAL '24 hours'
WHERE user_id = '430daeb0-c722-40de-976a-183036aade4a';

-- Clear Alice's swipes (to see profiles again)
DELETE FROM swipes 
WHERE swiper_user_id = '430daeb0-c722-40de-976a-183036aade4a';

-- Check status
SELECT 
  'Swipe Counter' as type,
  remaining as value,
  next_refill_at as details
FROM swipe_counters 
WHERE user_id = '430daeb0-c722-40de-976a-183036aade4a'
UNION ALL
SELECT 
  'Swipes Made' as type,
  COUNT(*)::text as value,
  MAX(created_at)::text as details
FROM swipes 
WHERE swiper_user_id = '430daeb0-c722-40de-976a-183036aade4a';
```

This will show you exactly what's in the database for this user.

