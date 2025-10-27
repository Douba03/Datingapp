# ⚠️ Warning System - Setup & Test Guide

## ✅ Status: Ready to Test!

The warning banner is now integrated into the mobile app. Follow these steps to see it in action.

---

## 🚀 Step 1: Run SQL Migration

**IMPORTANT**: You must run this SQL script first, or the warnings won't work!

1. Open **Supabase Dashboard** (https://supabase.com)
2. Go to your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the entire contents of `sql/create-user-warnings.sql`
6. Click **Run** (or press Ctrl+Enter)
7. You should see: ✅ **"User warnings table and functions created successfully!"**

---

## 🧪 Step 2: Test the Warning System

### A. Issue a Warning from Admin Dashboard

1. **Open admin dashboard**: http://localhost:3001
2. **Login** with your admin credentials
3. **Go to Users page** (click "Users" in sidebar)
4. **Find kvinna@test.com** (or any user)
5. **Click "Warn" button**
6. **Enter reason**: "Test warning - inappropriate behavior"
7. **Click "Issue Warning"**
8. You should see: ✅ **"Warning issued to [User Name]"**

### B. See the Warning in Mobile App

1. **Open mobile app** (should be running on port 8082 now)
2. **Login as kvinna@test.com**
3. **You should immediately see**:
   - Orange banner at the top: "⚠️ You have 1 unread warning →"
   - Banner appears on all tabs (Discover, Matches, Profile)

4. **Tap the banner**:
   - Modal slides up from bottom
   - Shows warning details
   - Displays: "⚠️ WARNING"
   - Shows your reason: "Test warning - inappropriate behavior"
   - Shows date/time

5. **Tap "I Understand"**:
   - Warning marked as acknowledged
   - Banner disappears
   - You can continue using the app normally

---

## 📱 Where the Banner Appears

The warning banner now appears on:
- ✅ **Discover screen** (top of screen)
- ✅ **Matches screen** (top of screen)
- ✅ **Profile screen** (top of scroll view)

---

## 🎨 What It Looks Like

### Banner (when you have warnings):
```
┌─────────────────────────────────────────────────────┐
│ ⚠️  You have 1 unread warning              →       │  ← Orange banner
└─────────────────────────────────────────────────────┘
```

### Modal (when you tap the banner):
```
┌─────────────────────────────────────────────────────┐
│  Account Warnings                          [X]       │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────────────────┐      │
│  │ ⚠️ WARNING                               │      │
│  │                                          │      │
│  │ Test warning - inappropriate behavior    │      │
│  │                                          │      │
│  │ October 15, 2025 at 10:30 AM            │      │
│  │                                          │      │
│  │ [I Understand]                           │      │
│  └──────────────────────────────────────────┘      │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 🔄 Real-Time Updates

The warning system uses Supabase real-time subscriptions:
- ✅ Warning appears **instantly** when admin issues it
- ✅ No need to refresh or restart the app
- ✅ Works even if user is on a different tab
- ✅ Banner updates when warning is acknowledged

---

## 🐛 Troubleshooting

### "I don't see the banner"

**Check 1**: Did you run the SQL migration?
- Go to Supabase → SQL Editor
- Run `sql/create-user-warnings.sql`

**Check 2**: Did you actually issue a warning?
- Go to admin dashboard
- Click "Warn" on the user
- Submit the form

**Check 3**: Are you logged in as the correct user?
- Make sure you're logged in as the user you warned (e.g., kvinna@test.com)

**Check 4**: Check the database
- Go to Supabase → Table Editor
- Open `user_warnings` table
- Look for a row with your user's ID
- Check that `acknowledged = false`

**Check 5**: Check console for errors
- Look at the terminal where `npm start` is running
- Look for any error messages

### "I see a white screen"

If you see a white screen:
1. Check the terminal for errors
2. The app is running on port **8082** (not 8081)
3. Try pressing `r` in the terminal to reload
4. Try pressing `c` to clear cache and reload

### "Banner doesn't disappear after acknowledging"

- Refresh the app (pull down on the screen)
- Check Supabase logs for errors
- Verify the `acknowledge_warning` function exists in your database

---

## 📊 Verify in Database

After testing, check that everything was recorded:

### Check warnings table:
```sql
SELECT * FROM user_warnings 
WHERE user_id = (SELECT id FROM users WHERE email = 'kvinna@test.com');
```

You should see:
- Your warning with `acknowledged = true`
- `acknowledged_at` timestamp

### Check admin actions:
```sql
SELECT * FROM admin_actions 
WHERE action = 'warn_user' 
ORDER BY created_at DESC 
LIMIT 5;
```

You should see:
- The admin action logged
- Your admin user ID
- The target user ID
- The reason in the payload

---

## ✅ Success Checklist

- [ ] SQL migration run successfully
- [ ] Admin can issue warning from dashboard
- [ ] Warning appears in mobile app immediately
- [ ] Banner shows correct message
- [ ] Tapping banner opens modal
- [ ] Modal shows warning details
- [ ] "I Understand" button works
- [ ] Banner disappears after acknowledgment
- [ ] Warning recorded in database
- [ ] Admin action logged

---

## 🎉 That's It!

Once you complete these steps, the warning system is fully functional!

Users will see warnings in real-time whenever admins issue them.

---

## 📚 More Documentation

- `WARNINGS_SYSTEM.md` - Complete technical documentation
- `WARNINGS_FLOW.md` - Visual flow diagrams
- `WARNINGS_COMPLETE.md` - Implementation summary
- `INTEGRATE_WARNING_BANNER.md` - Integration details

