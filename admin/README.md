# Partner Admin Dashboard

Production-grade Super Admin dashboard for the matching app. Built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## 🚀 Features

- **Overview Dashboard**: KPIs, charts, and latest activity feeds
- **User Management**: Search, filter, ban, warn, and view detailed user profiles
- **Trust & Safety**: Report queue with moderation actions
- **Content Review**: Approve/reject user-uploaded content
- **Revenue Analytics**: MRR, payments, subscriptions, refunds
- **Feature Flags**: Toggle features across environments
- **Audit Log**: Complete trail of all admin actions

## 🏗️ Architecture

### Security Model
- **Server-side only**: All privileged operations use Supabase SERVICE ROLE key
- **RLS enabled**: Row Level Security on all tables
- **SECURITY DEFINER RPCs**: Admin actions go through stored procedures
- **Audit trail**: Every action logged to `admin_actions` table
- **Role-based access**: Email whitelist + app_metadata.roles check

### Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Data Fetching**: TanStack Query + TanStack Table
- **Charts**: Recharts
- **Backend**: Supabase (Postgres, Auth, Storage)
- **Icons**: Lucide React

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- Supabase project (existing one from mobile app)
- Service role key from Supabase dashboard

### Setup Steps

1. **Install dependencies**
   ```bash
   cd admin
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` and add:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://zfnwtnqwokwvuxxwxgsr.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ADMIN_EMAILS=admin@example.com,moderator@example.com
   ```

3. **Run SQL migrations**
   
   Go to your Supabase SQL Editor and run these files in order:
   ```
   sql/01_admin_tables.sql      # Create admin tables
   sql/02_rls_policies.sql      # Set up RLS policies
   sql/03_admin_rpcs.sql        # Create admin functions
   sql/04_seed_data.sql         # (Optional) Seed feature flags
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```
   
   Dashboard will be available at `http://localhost:3001`

## 🔐 Admin Access

### Adding Admins

**Option 1: Environment Variable (Quick)**
Add admin emails to `.env.local`:
```env
ADMIN_EMAILS=admin@example.com,moderator@example.com
```

**Option 2: App Metadata (Granular)**
Update user's `app_metadata` in Supabase Auth:
```sql
-- In Supabase SQL Editor
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"roles": ["admin"]}'::jsonb
WHERE email = 'admin@example.com';
```

### Role Hierarchy
- **SUPER_ADMIN**: Full access (via ADMIN_EMAILS)
- **MODERATOR**: Trust & Safety, Content Review
- **SUPPORT**: User management (read-only)
- **FINANCE**: Revenue analytics
- **ANALYST**: Dashboard analytics (read-only)

## 📊 Database Schema

### New Admin Tables
- `payments`: Payment transactions
- `subscriptions`: User subscription status
- `content_assets`: User uploads for moderation
- `feature_flags`: Feature toggles
- `admin_actions`: Audit log

### Modified Tables
- `profiles`: Added `status` column (active|shadow_banned|banned|suspended)

### Existing Tables (Read-only)
- `auth.users`: User accounts
- `profiles`: User profiles
- `swipes`: Swipe history
- `matches`: Match records
- `messages`: Chat messages
- `user_reports`: User reports
- `user_blocks`: Blocked users

## 🛡️ Security Best Practices

1. **Never expose SERVICE_ROLE_KEY to client**
   - Only use in server components, API routes, server actions
   - Check `lib/supabase/server.ts` for proper usage

2. **Always log admin actions**
   - Use `logAdminAction()` helper for audit trail
   - Include admin_id, action, target, payload

3. **Validate admin permissions**
   - Check `isAdmin(userId)` before privileged operations
   - Use middleware to protect routes

4. **Use SECURITY DEFINER RPCs**
   - All mutations go through `admin_*` functions
   - Never directly UPDATE/DELETE from client

## 🚢 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add admin/
   git commit -m "feat: add admin dashboard"
   git push
   ```

2. **Deploy to Vercel**
   - Connect GitHub repo
   - Set root directory to `admin/`
   - Add environment variables
   - Deploy

3. **Set production URL**
   Update `NEXTAUTH_URL` in Vercel environment variables

### Environment Variables (Production)
```env
NEXT_PUBLIC_SUPABASE_URL=https://zfnwtnqwokwvuxxwxgsr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_EMAILS=admin@yourcompany.com
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=https://admin.yourapp.com
```

## 📁 Project Structure

```
admin/
├── app/
│   ├── (auth)/              # Auth pages (login, etc.)
│   ├── (dashboard)/         # Protected admin pages
│   │   ├── overview/
│   │   ├── users/
│   │   ├── reports/
│   │   ├── content/
│   │   ├── revenue/
│   │   ├── flags/
│   │   └── audit/
│   ├── api/                 # API routes (server actions)
│   ├── layout.tsx
│   ├── providers.tsx
│   └── globals.css
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── dashboard/           # Dashboard-specific components
│   └── ...
├── lib/
│   ├── supabase/
│   │   ├── server.ts        # Service role client
│   │   └── client.ts        # Anon key client
│   └── utils.ts
├── sql/
│   ├── 01_admin_tables.sql
│   ├── 02_rls_policies.sql
│   ├── 03_admin_rpcs.sql
│   └── 04_seed_data.sql
└── README.md
```

## 🧪 Testing

### Local Testing
1. Create test users in Supabase Auth
2. Add test data using SQL seed file
3. Test admin actions and verify audit logs

### Manual Test Checklist
- [ ] Login with admin email
- [ ] View dashboard KPIs
- [ ] Search and filter users
- [ ] Ban/warn a user
- [ ] Close a report
- [ ] Approve/reject content
- [ ] Toggle feature flag
- [ ] View audit log
- [ ] Export data to CSV

## 🐛 Troubleshooting

### "Missing Supabase environment variables"
- Check `.env.local` exists and has correct values
- Restart dev server after changing env vars

### "Unauthorized" errors
- Verify your email is in `ADMIN_EMAILS`
- Check service role key is correct
- Ensure RLS policies are applied

### SQL migrations fail
- Run migrations in order (01, 02, 03, 04)
- Check for existing table conflicts
- Verify Supabase project is accessible

## 📝 License

Private - Internal use only

## 🤝 Contributing

This is an internal admin dashboard. Follow these rules:
1. Never commit `.env.local`
2. Always log admin actions
3. Test locally before deploying
4. Document new features in README
5. Keep mobile app untouched

---

**⚠️ SECURITY WARNING**: This dashboard has full database access. Only grant admin access to trusted team members. Always review audit logs regularly.

