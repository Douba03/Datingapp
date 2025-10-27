# 🧪 Create Test Users Manually - Quick Guide

The automated script failed due to Supabase email validation. Here's the **easiest manual method**:

---

## 🎯 Method 1: Sign Up Through Your App (EASIEST!)

### Just create accounts normally through your app:

1. **Sarah's Account:**
   - Email: `sarah.test@gmail.com` (use real format)
   - Password: `test123456`
   - Go through onboarding:
     - Name: Sarah
     - DOB: March 15, 1995
     - Gender: Woman
     - Add 2 photos (any images)
     - Bio: "Entrepreneur and coffee addict"
     - Interests: Entrepreneurship, Hiking, Coffee
     - Preferences: Looking for Men, Age 25-35

2. **Mike's Account:**
   - Email: `mike.test@gmail.com`
   - Password: `test123456`
   - Onboarding:
     - Name: Mike
     - DOB: July 22, 1992
     - Gender: Man
     - Add 2 photos
     - Bio: "Software engineer by day"
     - Interests: Tech, Cooking, Gaming
     - Preferences: Looking for Women, Age 23-32

3. **Repeat for 3-5 more accounts**

**✅ This is the EASIEST method - just use your own app!**

---

## 🎮 How to Test Matching

### Test Flow:

1. **Create 2 accounts** (e.g., Sarah and Mike)

2. **Log in as Sarah:**
   ```
   Email: sarah.test@gmail.com
   Password: test123456
   ```
   - Go to Discover tab
   - You should see Mike's profile (if preferences match)
   - Swipe RIGHT ❤️ on Mike

3. **Log out, log in as Mike:**
   ```
   Email: mike.test@gmail.com
   Password: test123456
   ```
   - Go to Discover tab
   - You should see Sarah's profile
   - Swipe RIGHT ❤️ on Sarah
   - **BOOM! You matched! 🎉**

4. **Check Matches tab:**
   - Both accounts should now see the match
   - Try sending messages!

---

## 📧 Email Suggestions

Use these email patterns (they work with most providers):

✅ `yourname.test1@gmail.com`  
✅ `yourname.test2@gmail.com`  
✅ `yourname+sarah@gmail.com`  
✅ `yourname+mike@gmail.com`  

**Gmail tip:** `yourname+anything@gmail.com` all goes to `yourname@gmail.com` but Supabase treats them as different accounts!

---

## 🚀 Quick Test (Just 2 Accounts Needed)

### Minimal test with just 2 accounts:

**Account 1 - Sarah:**
- Email: `youremail+sarah@gmail.com`
- Password: `test123456`
- Profile: Woman, 28, San Francisco
- Seeking: Men

**Account 2 - Mike:**
- Email: `youremail+mike@gmail.com`
- Password: `test123456`
- Profile: Man, 30, San Francisco
- Seeking: Women

**Then:**
1. Log in as Sarah → Swipe right on Mike
2. Log in as Mike → Swipe right on Sarah
3. **Match created!** ✅
4. Try chatting!

---

## 🎯 What You Can Test

With 2+ test accounts:

✅ **Swiping:**
- Swipe left (pass)
- Swipe right (like)
- Swipe counter decreases

✅ **Matching:**
- Mutual likes = Match
- Match appears in Matches tab

✅ **Chat:**
- Send messages
- See message history

✅ **Profile Discovery:**
- Only see matching profiles
- Filters work (age, gender, distance)

---

## 💡 Pro Tips

### For easier testing:

1. **Use same city** - Makes sure they see each other
2. **Use same password** - Easy to remember: `test123456`
3. **Use Gmail + trick** - `yourmail+test1@gmail.com`
4. **Keep browser tabs open** - Switch between accounts quickly

### Multiple browsers:

- **Chrome:** Sarah's account
- **Incognito:** Mike's account
- **Firefox:** Emma's account

---

## 🔍 Verify Profiles Exist

Check in Supabase Dashboard:

1. Go to **Table Editor → profiles**
2. Should see your created profiles
3. Check **swipe_counters** → Should have 10 swipes each

---

## ✅ Quick Checklist

```
[ ] Create Account 1 (Sarah) through your app
[ ] Complete onboarding for Sarah
[ ] Create Account 2 (Mike) through your app
[ ] Complete onboarding for Mike
[ ] Log in as Sarah
[ ] Swipe right on Mike
[ ] Log in as Mike
[ ] Swipe right on Sarah
[ ] Check Matches tab → Should see match!
[ ] Send test message
[ ] Reply from other account
[ ] ✨ Success - Matching works!
```

---

## 🐛 Troubleshooting

### Can't see other profiles?
- Check preferences match (age, gender, distance)
- Make sure both in similar location
- Check swipe counter > 0

### No match created?
- Both must swipe RIGHT on each other
- Check `matches` table in Supabase
- Look for console errors

### Can't chat?
- Match must exist first
- Check `messages` table permissions
- Verify RLS policies are correct

---

**Start creating accounts now! Just 2 accounts is enough to test matching! 🚀**
