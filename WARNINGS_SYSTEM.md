# ⚠️ User Warnings System - Complete Guide

## Overview

The warnings system allows admins to issue warnings to users, and users can see and acknowledge these warnings in the mobile app.

---

## 🔄 How It Works

### Admin Side (Web Dashboard)

1. **Admin issues a warning**:
   - Admin goes to Users page
   - Clicks "Warn" button next to a user
   - Enters warning reason
   - Clicks "Issue Warning"

2. **What happens in the database**:
   - A new record is created in `user_warnings` table
   - The warning includes:
     - User ID
     - Reason text
     - Severity level (warning, final_warning, or notice)
     - Timestamp
     - Acknowledged status (initially false)

3. **Action is logged**:
   - The admin action is recorded in `admin_actions` table
   - Includes admin ID, action type, target user, and reason

### User Side (Mobile App)

1. **User sees warning banner**:
   - When user has unacknowledged warnings, an orange banner appears at the top
   - Banner shows: "You have X unread warning(s)"
   - Banner is visible on all tabs (Discover, Matches, Profile)

2. **User views warning details**:
   - User taps the banner (or it auto-opens)
   - A modal slides up showing all warnings
   - Each warning shows:
     - Severity level (WARNING, FINAL WARNING, or NOTICE)
     - Reason text
     - Date/time issued
     - Acknowledged status

3. **User acknowledges warnings**:
   - User can tap "I Understand" on each warning
   - Or tap "Acknowledge All" to acknowledge all at once
   - Once acknowledged, the warning is marked as read
   - Banner disappears when all warnings are acknowledged

4. **Real-time updates**:
   - If admin issues a new warning while user is in the app
   - The banner appears immediately (via Supabase real-time)
   - Modal auto-opens to show the new warning

---

## 📊 Database Schema

### `user_warnings` Table

```sql
CREATE TABLE user_warnings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  reason TEXT NOT NULL,
  issued_by UUID REFERENCES users(id),
  severity TEXT DEFAULT 'warning',
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Severity Levels

| Severity | Color | Icon | Use Case |
|----------|-------|------|----------|
| `notice` | Blue | ℹ️ | Informational messages |
| `warning` | Orange | ⚠️ | Standard warnings |
| `final_warning` | Red | 🔴 | Serious violations, last chance |

---

## 🚀 Setup Instructions

### 1. Run the SQL Migration

In Supabase SQL Editor, run:

```bash
sql/create-user-warnings.sql
```

This will:
- ✅ Create `user_warnings` table
- ✅ Set up RLS policies
- ✅ Create `admin_warn_user` function (updated)
- ✅ Create `acknowledge_warning` function
- ✅ Grant necessary permissions

### 2. Mobile App Already Configured

The mobile app already includes:
- ✅ `WarningBanner` component
- ✅ Integrated into tabs layout
- ✅ Real-time subscription to warnings
- ✅ Acknowledge functionality

### 3. Admin Dashboard Already Configured

The admin dashboard already has:
- ✅ Warn button on Users page
- ✅ Warning dialog with reason input
- ✅ API route `/api/admin/warn-user`
- ✅ Audit logging

---

## 🎯 User Experience Flow

### Scenario: Admin warns a user

1. **Admin action**:
   ```
   Admin Dashboard → Users → Find "kvinna@test.com" → Click "Warn"
   → Enter: "Inappropriate profile photo" → Issue Warning
   ```

2. **User experience**:
   ```
   User opens app → Orange banner appears at top
   → "You have 1 unread warning"
   → User taps banner → Modal opens
   → Shows: "⚠️ WARNING: Inappropriate profile photo"
   → User taps "I Understand" → Warning marked as read
   → Banner disappears
   ```

3. **Database state**:
   ```sql
   -- Before acknowledgment
   SELECT * FROM user_warnings WHERE user_id = 'kvinna-user-id';
   -- acknowledged = false, acknowledged_at = null
   
   -- After acknowledgment
   SELECT * FROM user_warnings WHERE user_id = 'kvinna-user-id';
   -- acknowledged = true, acknowledged_at = '2025-10-15 10:30:00'
   ```

---

## 📱 Mobile App Components

### `WarningBanner.tsx`

**Location**: `src/components/warnings/WarningBanner.tsx`

**Features**:
- Fetches warnings on mount
- Subscribes to real-time updates
- Shows banner when unacknowledged warnings exist
- Opens modal to display warning details
- Allows individual or bulk acknowledgment
- Color-coded by severity
- Shows read/unread status

**Usage**:
```tsx
import { WarningBanner } from '@/components/warnings/WarningBanner';

// In your layout
<WarningBanner />
```

---

## 🔐 Security & Permissions

### RLS Policies

1. **Users can view their own warnings**:
   ```sql
   CREATE POLICY "users_view_own_warnings" 
     ON user_warnings FOR SELECT 
     USING (auth.uid() = user_id);
   ```

2. **Users can acknowledge their own warnings**:
   ```sql
   CREATE POLICY "users_acknowledge_own_warnings" 
     ON user_warnings FOR UPDATE 
     USING (auth.uid() = user_id);
   ```

3. **Only admins can insert warnings**:
   - Handled via `SECURITY DEFINER` function
   - Admin authentication checked in API route

### Functions

1. **`admin_warn_user(target_user_id, warning_reason)`**:
   - `SECURITY DEFINER` - runs with elevated privileges
   - Inserts warning into `user_warnings` table
   - Returns warning ID and total warning count

2. **`acknowledge_warning(warning_id)`**:
   - `SECURITY DEFINER` - runs with elevated privileges
   - Checks that warning belongs to current user
   - Sets `acknowledged = true` and `acknowledged_at = NOW()`

---

## 🧪 Testing

### Test the Complete Flow

1. **Start both servers**:
   ```bash
   # Terminal 1: Mobile app
   npm start
   
   # Terminal 2: Admin dashboard
   cd admin
   npm run dev
   ```

2. **Issue a warning**:
   - Login to admin dashboard (http://localhost:3001)
   - Go to Users page
   - Find a user (e.g., kvinna@test.com)
   - Click "Warn"
   - Enter reason: "Test warning - inappropriate behavior"
   - Click "Issue Warning"

3. **Check mobile app**:
   - Login as the warned user (kvinna@test.com)
   - You should immediately see an orange banner at the top
   - Tap the banner to view the warning
   - Read the warning details
   - Tap "I Understand"
   - Banner should disappear

4. **Verify in database**:
   ```sql
   -- Check warnings table
   SELECT * FROM user_warnings 
   WHERE user_id = (SELECT id FROM users WHERE email = 'kvinna@test.com');
   
   -- Check admin actions log
   SELECT * FROM admin_actions 
   WHERE action = 'warn_user' 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```

---

## 🎨 UI Customization

### Severity Colors

Edit in `WarningBanner.tsx`:

```tsx
const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'final_warning':
      return '#DC2626'; // Red - change this
    case 'warning':
      return '#F59E0B'; // Orange - change this
    case 'notice':
      return '#3B82F6'; // Blue - change this
  }
};
```

### Banner Style

Edit `styles.banner` in `WarningBanner.tsx`:

```tsx
banner: {
  backgroundColor: '#F59E0B', // Change banner color
  paddingVertical: 12, // Change height
  // ... other styles
}
```

---

## 📊 Analytics & Monitoring

### Useful Queries

**Count warnings per user**:
```sql
SELECT 
  u.email,
  COUNT(w.id) as total_warnings,
  SUM(CASE WHEN w.acknowledged THEN 1 ELSE 0 END) as acknowledged,
  SUM(CASE WHEN NOT w.acknowledged THEN 1 ELSE 0 END) as pending
FROM users u
LEFT JOIN user_warnings w ON w.user_id = u.id
GROUP BY u.id, u.email
HAVING COUNT(w.id) > 0
ORDER BY total_warnings DESC;
```

**Recent warnings**:
```sql
SELECT 
  u.email as warned_user,
  w.reason,
  w.severity,
  w.acknowledged,
  w.created_at
FROM user_warnings w
JOIN users u ON u.id = w.user_id
ORDER BY w.created_at DESC
LIMIT 20;
```

**Unacknowledged warnings**:
```sql
SELECT 
  u.email,
  w.reason,
  w.severity,
  w.created_at,
  NOW() - w.created_at as time_since_warning
FROM user_warnings w
JOIN users u ON u.id = w.user_id
WHERE w.acknowledged = false
ORDER BY w.created_at DESC;
```

---

## 🔄 Future Enhancements

Possible improvements:
- [ ] Email notifications when warning is issued
- [ ] Push notifications for warnings
- [ ] Warning expiration (auto-archive after 30 days)
- [ ] Warning escalation (3 warnings = auto-ban)
- [ ] Warning categories/types
- [ ] User appeal system
- [ ] Admin dashboard to view all warnings
- [ ] Warning templates for common violations

---

## ❓ FAQ

**Q: Where does the user see the warning?**
A: In the mobile app, an orange banner appears at the top of all screens. Tapping it shows the full warning details.

**Q: Can users delete warnings?**
A: No, users can only acknowledge (mark as read) warnings. Admins would need to delete them from the database.

**Q: What happens if a user has multiple warnings?**
A: All warnings are shown in the modal. The banner shows the count. User can acknowledge all at once or one by one.

**Q: Do warnings expire?**
A: Not automatically. You can add expiration logic if needed.

**Q: Can users see old acknowledged warnings?**
A: Yes, they're shown in the modal but with a "Read" badge and slightly faded.

**Q: What if a user ignores the warning?**
A: The banner persists until they acknowledge it. You could implement auto-escalation after X days.

---

## ✅ Checklist

Setup complete when:
- [x] SQL migration run (`create-user-warnings.sql`)
- [x] `user_warnings` table exists
- [x] RLS policies active
- [x] Functions created (`admin_warn_user`, `acknowledge_warning`)
- [x] `WarningBanner` component added to mobile app
- [x] Admin dashboard "Warn" button functional
- [x] Test warning issued and visible in mobile app
- [x] Test acknowledgment works
- [x] Real-time updates working

---

**🎉 The warnings system is now fully functional!**

Users will see warnings in the mobile app as soon as admins issue them.

