# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies
```bash
cd admin
npm install
```

### Step 2: Configure Environment
Copy the example env file and add your Supabase keys:
```bash
cp env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://zfnwtnqwokwvuxxwxgsr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ADMIN_EMAILS=your-email@example.com
```

**Where to find keys:**
1. Go to Supabase Dashboard → Project Settings → API
2. Copy `URL` → `NEXT_PUBLIC_SUPABASE_URL`
3. Copy `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Copy `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **Keep this secret!**

### Step 3: Run SQL Migrations
Go to Supabase SQL Editor and run these files **in order**:

1. **sql/01_admin_tables.sql** - Creates admin tables
2. **sql/02_rls_policies.sql** - Sets up security policies
3. **sql/03_admin_rpcs.sql** - Creates admin functions
4. **sql/04_seed_data.sql** - (Optional) Seeds feature flags

### Step 4: Start Development Server
```bash
npm run dev
```

Dashboard will be available at: **http://localhost:3001**

### Step 5: Login
1. Go to http://localhost:3001
2. Login with your admin email (the one you added to `ADMIN_EMAILS`)
3. Use your existing Supabase account password

---

## ✅ What's Working Now

- ✅ Login with admin authentication
- ✅ Protected dashboard layout with sidebar
- ✅ Overview page with KPIs (signups, matches, messages, revenue, reports)
- ✅ Latest activity feeds (signups, reports, payments)
- ✅ Secure server-side data fetching with service role
- ✅ All queries respect RLS and use SECURITY DEFINER functions

## 🚧 What's Next (Coming Soon)

The foundation is complete! Next pages to build:
- Users management (search, ban, warn)
- Reports queue (moderation)
- Content review (approve/reject uploads)
- Revenue analytics (charts, refunds)
- Feature flags (toggle)
- Audit log (export CSV)

## 🐛 Troubleshooting

### "Missing environment variables"
- Make sure `.env.local` exists in the `admin/` folder
- Restart dev server after changing env vars

### "Unauthorized" when logging in
- Check that your email is in `ADMIN_EMAILS`
- Verify you're using the correct password for your Supabase account

### SQL migrations fail
- Run them in order (01, 02, 03, 04)
- Make sure you're in the correct Supabase project
- Check for syntax errors in the SQL editor

### Dashboard shows zeros
- Make sure SQL migrations ran successfully
- Check that you have data in your `profiles`, `matches`, `messages` tables
- The RPC function `admin_get_dashboard_stats` needs to exist

## 📝 Next Steps

1. Test the dashboard with your existing mobile app data
2. Add more admin emails to `ADMIN_EMAILS` for your team
3. Continue building remaining pages (I can help!)
4. Deploy to Vercel when ready

---

**Need help?** Check the full README.md for detailed documentation.

