# 🚀 Admin Dashboard Setup Instructions

## ✅ You've Already Done:
1. ✅ Created `.env.local` with service role key
2. ✅ Started the dev server (`npm run dev`)
3. ✅ Created admin user (`admin@test.com`)
4. ✅ Logged into the dashboard

## ⚠️ Current Issue:
The dashboard is showing an error because some database tables don't exist yet:
```
relation "user_reports" does not exist
```

## 🔧 Fix: Run the Complete Setup SQL

### Step 1: Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard/project/zfnwtnqwokwvuxxwxgsr/sql/new
2. Or navigate: **Supabase Dashboard** → **SQL Editor** → **New Query**

### Step 2: Copy the SQL Script
1. Open the file: `admin/sql/00_complete_setup.sql`
2. **Copy ALL the contents** (it's a long file, make sure you get everything!)

### Step 3: Run the SQL
1. **Paste** the entire SQL script into the Supabase SQL Editor
2. Click **"Run"** (or press `Ctrl + Enter`)
3. Wait for it to complete (should take 5-10 seconds)

### Step 4: Verify Success
You should see this message at the bottom:
```
✅ Admin dashboard setup complete! All tables, policies, functions, and seed data created successfully.
```

### Step 5: Refresh Your Dashboard
1. Go back to your browser with the admin dashboard
2. **Refresh the page** (`F5` or `Ctrl + R`)
3. The dashboard should now load with data! 🎉

---

## 📊 What This SQL Does:

### Creates Tables:
- ✅ `payments` - Payment transactions
- ✅ `subscriptions` - User subscription plans
- ✅ `content_assets` - Content for moderation
- ✅ `feature_flags` - Feature toggles
- ✅ `admin_actions` - Audit log of admin actions
- ✅ Adds `status` column to `profiles` (for banning)

### Creates Security Policies:
- ✅ Row Level Security (RLS) for all tables
- ✅ Service role access for admin operations
- ✅ User access to their own data

### Creates Admin Functions:
- ✅ `admin_ban_user()` - Ban or shadow ban users
- ✅ `admin_warn_user()` - Issue warnings
- ✅ `admin_close_report()` - Close user reports
- ✅ `admin_approve_asset()` - Approve content
- ✅ `admin_reject_asset()` - Reject content
- ✅ `admin_toggle_flag()` - Toggle feature flags
- ✅ `admin_refund_payment()` - Process refunds
- ✅ `admin_get_dashboard_stats()` - Get KPI data

### Seeds Initial Data:
- ✅ Default feature flags
- ✅ Sample data for testing (if needed)

---

## 🎯 After Setup, You'll See:

### Overview Dashboard:
- **6 KPI Cards:**
  - New Signups (30d)
  - Active Users (30d)
  - Total Matches (30d)
  - Total Messages (30d)
  - Open Reports
  - Revenue (30d)

- **Activity Feeds:**
  - Latest Signups
  - Latest Reports
  - Latest Payments

- **Charts:**
  - User growth over time
  - Revenue trends

---

## 🐛 Troubleshooting:

### If SQL fails with "already exists" errors:
✅ **This is OK!** It means some tables were already created. The script uses `IF NOT EXISTS` so it's safe to run multiple times.

### If you see "permission denied":
❌ Make sure you're logged into the correct Supabase project
❌ Make sure you have admin access to the project

### If dashboard still shows errors after running SQL:
1. **Hard refresh** the browser: `Ctrl + Shift + R`
2. **Check the terminal** for any errors
3. **Verify the SQL ran successfully** in Supabase

### If you see "service_role key invalid":
1. Double-check `.env.local` has the correct `SUPABASE_SERVICE_ROLE_KEY`
2. Restart the dev server: `Ctrl + C`, then `npm run dev`

---

## 📝 Quick Reference:

### Admin Dashboard URL:
```
http://localhost:3001
```

### Admin Login:
- Email: `admin@test.com`
- Password: (what you set in Supabase)

### Supabase Project:
- URL: https://zfnwtnqwokwvuxxwxgsr.supabase.co
- Dashboard: https://supabase.com/dashboard/project/zfnwtnqwokwvuxxwxgsr

---

## ✅ Next Steps After Setup:

Once the dashboard loads successfully, you can:
1. **Explore the Overview page** - See your app's KPIs
2. **View user reports** - Check what users are reporting
3. **Moderate content** - Review flagged photos/videos
4. **Manage users** - Ban, warn, or suspend users
5. **Toggle features** - Turn features on/off
6. **View audit log** - See all admin actions

---

## 🚀 Ready to Continue Building?

After the dashboard is working, I can build:
- **Users Management Page** - Full user CRUD with search/filters
- **Reports Queue** - Review and action user reports
- **Content Moderation** - Approve/reject user content
- **Revenue Analytics** - Detailed payment tracking
- **Feature Flags UI** - Toggle features with one click
- **Audit Log Viewer** - Track all admin actions

Let me know when you're ready! 🎉

