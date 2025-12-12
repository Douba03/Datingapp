# 📖 Admin Dashboard - Warn & Ban Usage Guide

## Quick Start

### 1. Access the Users Page
- Login to admin dashboard at http://localhost:3001/login
- Click "Users" in the sidebar
- You'll see a table of all users with search functionality

### 2. Warn a User

**When to use**: For minor violations or first-time offenses

**Steps**:
1. Find the user in the table (use search if needed)
2. Click the **"Warn"** button (yellow/outline style) in the Actions column
3. A dialog will open with:
   - User's name at the top
   - Text area for warning reason
4. Enter a clear reason (e.g., "Inappropriate profile photo")
5. Click **"Issue Warning"**
6. Wait for success message: "✅ Warning issued to [User Name]"
7. The page will refresh automatically

**What happens**:
- User receives a warning on their account
- Warning is logged in the audit trail
- User can still access the app normally
- Admins can see warning history (future feature)

---

### 3. Ban a User

**When to use**: For serious violations or repeated offenses

**Steps**:
1. Find the user in the table
2. Click the **"Ban"** button (red/destructive style) in the Actions column
3. A dialog will open with:
   - User's name at the top
   - Ban type selector (dropdown)
   - Text area for ban reason
   - Warning message about action severity

4. **Choose ban type**:
   - **Hard Ban**: User cannot login or access the app at all
   - **Shadow Ban**: User can login but is invisible to others (good for spam/bots)

5. Enter a detailed reason (e.g., "Harassment of other users, multiple reports")
6. Click **"Ban User"** or **"Shadow Ban User"** (button text changes based on type)
7. Wait for success message: "✅ User [Name] has been [banned/shadow banned]"
8. The page will refresh automatically

**What happens**:
- **Hard Ban**:
  - User's status set to "banned"
  - User cannot login
  - All matches/chats hidden
  - Profile hidden from discovery
  
- **Shadow Ban**:
  - User's status set to "shadow_banned"
  - User can login normally
  - Other users cannot see them
  - Their swipes don't create matches
  - Good for quietly removing spam accounts

---

## 🎯 Best Practices

### Warning Guidelines
- Use for first-time minor violations
- Be specific about what rule was broken
- Give users a chance to correct behavior
- Example reasons:
  - "Inappropriate profile photo"
  - "Spam messages reported"
  - "Misleading profile information"

### Ban Guidelines
- Use for serious or repeated violations
- Document the reason thoroughly
- Consider shadow ban first for suspected spam
- Example reasons:
  - "Harassment of multiple users"
  - "Scam/fraud activity"
  - "Repeated violations after warnings"
  - "Spam bot detected"

### Hard Ban vs Shadow Ban
- **Use Hard Ban for**:
  - Dangerous users (harassment, threats)
  - Scammers/fraudsters
  - Users who need immediate removal
  
- **Use Shadow Ban for**:
  - Spam bots
  - Suspicious accounts
  - When you want to observe behavior
  - Gradual removal without alerting user

---

## 🔍 Verification

After taking action, you can verify:

1. **Check user status**:
   - Go to Supabase Dashboard
   - Open `profiles` table
   - Find the user
   - Check `status` column (should be "banned" or "shadow_banned")

2. **Check audit log**:
   - Go to `admin_actions` table
   - Find your recent action
   - Verify it was logged with correct details

3. **Test the ban**:
   - Try logging in as the banned user
   - Hard ban: Should fail at login
   - Shadow ban: Should login but be invisible to others

---

## 🚨 Important Notes

- **Actions are immediate**: No undo button (yet)
- **All actions are logged**: Every warn/ban is recorded with your admin ID
- **Page refreshes**: After action, the page reloads to show updated data
- **Error handling**: If something fails, you'll see an error message in the dialog
- **Required fields**: You must provide a reason for all actions

---

## 🐛 Troubleshooting

**Dialog doesn't open**:
- Check browser console for errors
- Refresh the page and try again

**"Unauthorized" error**:
- Your admin session may have expired
- Logout and login again

**Action fails with error**:
- Check that the SQL functions exist in your database
- Verify you ran `00_complete_setup_fixed.sql`
- Check server logs in terminal

**Success message but user not banned**:
- Check Supabase logs for RPC errors
- Verify RLS policies are set correctly
- Check `admin_actions` table to see if action was logged

---

## 📊 Future Enhancements

Coming soon:
- [ ] View user's warning history
- [ ] Undo ban action
- [ ] Temporary bans with expiration
- [ ] Bulk actions (ban multiple users)
- [ ] Email notifications to banned users
- [ ] Ban appeal system
- [ ] More detailed ban reasons (dropdown + custom)

---

## ✅ Quick Reference

| Action | Button Color | Severity | User Impact |
|--------|-------------|----------|-------------|
| Warn | Yellow/Outline | Low | None (just logged) |
| Shadow Ban | Red | Medium | Invisible to others |
| Hard Ban | Red | High | Cannot access app |

---

**Need help?** Check the console logs or refer to `WARN_BAN_IMPLEMENTED.md` for technical details.

