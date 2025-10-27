# 🚀 Quick Setup: User Warnings System

## Step 1: Run SQL Migration

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Create a new query
4. Copy and paste the contents of `sql/create-user-warnings.sql`
5. Click "Run"
6. You should see: ✅ "User warnings table and functions created successfully!"

## Step 2: Test in Admin Dashboard

1. **Start admin dashboard** (if not already running):
   ```bash
   cd admin
   npm run dev
   ```

2. **Login** at http://localhost:3001

3. **Go to Users page**

4. **Issue a test warning**:
   - Find any user (e.g., kvinna@test.com)
   - Click the "Warn" button
   - Enter reason: "Test warning - please acknowledge"
   - Click "Issue Warning"
   - You should see: ✅ "Warning issued to [User Name]"

## Step 3: Test in Mobile App

1. **Start mobile app** (if not already running):
   ```bash
   npm start
   ```

2. **Login as the warned user** (e.g., kvinna@test.com)

3. **You should immediately see**:
   - Orange banner at the top: "You have 1 unread warning"

4. **Tap the banner**:
   - Modal slides up
   - Shows warning details
   - Shows reason: "Test warning - please acknowledge"

5. **Tap "I Understand"**:
   - Warning marked as read
   - Banner disappears

## Step 4: Verify in Database

1. Open Supabase Dashboard
2. Go to Table Editor
3. Open `user_warnings` table
4. You should see your test warning with `acknowledged = true`

---

## ✅ That's It!

The warnings system is now fully functional:
- ✅ Admins can issue warnings from the dashboard
- ✅ Users see warnings in the mobile app
- ✅ Users can acknowledge warnings
- ✅ Real-time updates work
- ✅ All actions are logged

---

## 📚 For More Details

See `WARNINGS_SYSTEM.md` for:
- Complete documentation
- Database schema
- Security policies
- Customization options
- Analytics queries
- Troubleshooting

---

## 🎯 Answer to Your Question

**"When I warn kvinna@test.com, where does the user get the warning?"**

**Answer**: 
1. **In the mobile app** - An orange banner appears at the top of all screens
2. **Immediately** - Via real-time Supabase subscription
3. **Persistent** - Banner stays until user acknowledges it
4. **Detailed** - User can tap banner to see full warning details in a modal

The warning is stored in the `user_warnings` database table and displayed via the `WarningBanner` component that's now integrated into the mobile app's tab layout.

