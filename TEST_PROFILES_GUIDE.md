# 🧪 Test Profiles Setup Guide

## 🎯 Goal
Create fake user accounts so you can test swiping and matching functionality!

---

## 📝 Test Accounts I'll Create

| Name | Email | Location | Interests |
|------|-------|----------|-----------|
| **Sarah** | sarah@test.com | San Francisco | Entrepreneurship, Hiking, Coffee |
| **Mike** | mike@test.com | San Francisco | Tech, Cooking, Gaming |
| **Emma** | emma@test.com | Los Angeles | Design, Yoga, Art |
| **Alex** | alex@test.com | San Francisco | Startups, Fitness, Marketing |
| **Jessica** | jessica@test.com | San Diego | Marketing, Wine, Pets |

**Password for all:** `test123456`

---

## 🚀 Method 1: Automated Script (Recommended)

### Run this command:

```bash
node create-test-profiles.js
```

This will:
- ✅ Create 5 test user accounts
- ✅ Set up profiles with photos, bio, interests
- ✅ Configure preferences (age, distance, seeking)
- ✅ Initialize swipe counters (10 swipes each)

---

## 🎮 How to Test After Creation

### Test Swipe & Match Flow:

1. **Log in as Sarah** (`sarah@test.com` / `test123456`)
   - Go to Discover tab
   - You should see Mike and Alex (same city, matching preferences)
   - Swipe right ❤️ on Mike

2. **Log out, then log in as Mike** (`mike@test.com` / `test123456`)
   - Go to Discover tab
   - You should see Sarah
   - Swipe right ❤️ on Sarah
   - **BOOM! Match created! 🎉**

3. **Check Matches tab**
   - Should see Sarah in your matches
   - Click to open chat
   - Send a message!

4. **Log back in as Sarah**
   - Check Matches tab
   - Should see Mike
   - See his message
   - Reply!

---

## 🔄 Testing Different Scenarios

### Test 1: Successful Match
```
Sarah ❤️ Mike → Mike ❤️ Sarah = MATCH! ✅
```

### Test 2: No Match (Pass)
```
Sarah ❤️ Alex → Alex ✕ Sarah = No match ❌
```

### Test 3: Super Like
```
Emma ⭐ Mike → Special match notification
```

### Test 4: Swipe Limit
```
Swipe 10 times → Counter hits 0 → Need focus session to earn more
```

---

## 🐛 If Script Fails

### Option 1: Check Database First

Make sure tables exist:
1. Go to Supabase Dashboard
2. Check if you have these tables:
   - ✅ profiles
   - ✅ preferences
   - ✅ swipe_counters
   - ✅ swipes
   - ✅ matches

### Option 2: Manual Creation via Supabase

I'll create a SQL script you can run directly in Supabase SQL Editor.

---

## 📊 What You Can Test

After creating test profiles:

✅ **Swiping:**
- Swipe left (pass)
- Swipe right (like)  
- Swipe up (super like)
- Swipe counter decreases

✅ **Matching:**
- Mutual likes create match
- Match appears in Matches tab
- Can open chat with match

✅ **Filtering:**
- Only see profiles that match your preferences
- Age range filtering works
- Distance filtering works
- Gender preferences work

✅ **Chat:**
- Send messages to matches
- Real-time message updates
- Read receipts (if implemented)

---

## 🔍 Debugging

### Check if profiles were created:

```sql
-- Run in Supabase SQL Editor
SELECT 
  p.first_name, 
  p.gender, 
  p.city,
  pr.age_min,
  pr.age_max
FROM profiles p
JOIN preferences pr ON p.user_id = pr.user_id
ORDER BY p.created_at DESC;
```

### Check swipe counters:

```sql
SELECT 
  u.email,
  sc.remaining,
  sc.next_refill_at
FROM swipe_counters sc
JOIN auth.users u ON sc.user_id = u.id;
```

---

## 🎯 Expected Behavior

### When you swipe:
1. Card disappears
2. Swipe counter decreases
3. If mutual like → Match created
4. If no swipes left → See refill message

### When you match:
1. Celebration animation (if implemented)
2. Match appears in Matches tab
3. Can immediately chat
4. AI icebreakers suggested

---

## 🚨 Common Issues

### Issue: Can't see any profiles
**Cause:** No profiles match your preferences
**Fix:** Adjust age/distance in preferences or create profile in same city

### Issue: Script says "already exists"
**Cause:** Accounts already created
**Fix:** Use those accounts or delete from Supabase Users tab

### Issue: Swipe doesn't work
**Cause:** Swipe counter at 0 or database RLS policies
**Fix:** Check swipe_counters table, verify RLS policies

---

## 📝 Next Steps After Testing

Once swiping works:

1. **Test Focus Timer** - Earn swipes by completing focus sessions
2. **Test AI Icebreakers** - Get conversation starters
3. **Test Notifications** - Match alerts, message notifications
4. **Performance Testing** - Load test with many profiles

---

**Ready? Run the script now!** ⚡

```bash
node create-test-profiles.js
```
