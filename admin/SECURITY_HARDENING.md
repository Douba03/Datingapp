# Security Hardening Guide

## 🔒 Security Improvements Applied

### Phase 1: Audit Logging ✅
**File**: `sql/05_add_audit_logging.sql`

All admin RPCs now automatically log actions to `admin_actions` table:
- ✅ `admin_ban_user` - Logs bans with reason and type
- ✅ `admin_warn_user` - Logs warnings with count
- ✅ `admin_close_report` - Logs report resolutions
- ✅ `admin_approve_asset` - Logs content approvals
- ✅ `admin_reject_asset` - Logs content rejections
- ✅ `admin_toggle_flag` - Logs flag changes with old/new values
- ✅ `admin_refund_payment` - Logs refunds with reason

**Benefits:**
- Complete audit trail of all admin actions
- Tracks who did what, when, and why
- Supports compliance and accountability
- Can export for security reviews

### Phase 2: RPC Hardening ✅
**File**: `sql/06_harden_rpc_security.sql`

**Changes:**
1. **Revoked public execute** on all admin functions
2. **Granted execute only to authenticated users** (service role bypasses)
3. **Created admin role** for granular permissions
4. **Added admin check functions**:
   - `is_admin_user(uuid)` - Check if user has admin role
   - `current_user_is_admin()` - RLS helper for current user
5. **Updated RLS policies** to require admin status
6. **Added rate limiting** infrastructure

**Benefits:**
- Prevents unauthorized function execution
- Supports role-based access control
- Rate limiting prevents abuse
- Better separation of concerns

### Phase 3: Test Data ✅
**File**: `sql/07_seed_test_data.sql`

**Includes:**
- Sample payments (succeeded, failed, refunded)
- Sample subscriptions (active plans)
- Sample content assets (pending, approved, rejected)
- Extended feature flags (8 flags for testing)

**Benefits:**
- Test admin dashboard with realistic data
- Verify moderation workflows
- Test revenue analytics
- Validate feature flag management

## 🚀 How to Apply

### Step 1: Run SQL Migrations (in order)
```sql
-- In Supabase SQL Editor, run these files:
1. sql/05_add_audit_logging.sql      -- Add audit logging to RPCs
2. sql/06_harden_rpc_security.sql    -- Harden RPC permissions
3. sql/07_seed_test_data.sql         -- (Optional) Add test data
```

### Step 2: Update Environment Variables

**Production `.env` (Vercel/deployment):**
```env
# Public (safe to expose)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Secrets (use secret manager)
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # ⚠️ NEVER commit or expose
ADMIN_EMAILS=admin@yourcompany.com

# Optional
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=https://admin.yourapp.com
```

**Local `.env.local`:**
```env
# Same as above but for local development
NEXT_PUBLIC_SUPABASE_URL=https://zfnwtnqwokwvuxxwxgsr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ADMIN_EMAILS=admin@test.com
```

### Step 3: Set Admin Roles in Supabase

**Option A: Via SQL**
```sql
-- Add admin role to user's app_metadata
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"roles": ["admin"]}'::jsonb
WHERE email = 'admin@test.com';
```

**Option B: Via Supabase Dashboard**
1. Go to Authentication → Users
2. Click on user
3. Edit "User Metadata" (app_metadata)
4. Add: `{"roles": ["admin"]}`

## 🔐 Security Best Practices

### 1. Environment Variables
- ✅ **DO**: Use secret managers (Vercel, AWS Secrets Manager, etc.)
- ✅ **DO**: Rotate keys regularly (quarterly)
- ✅ **DO**: Use different keys for dev/staging/prod
- ❌ **DON'T**: Commit `.env.local` to git
- ❌ **DON'T**: Expose service role key to client
- ❌ **DON'T**: Share keys in Slack/email

### 2. Admin Access
- ✅ **DO**: Use company emails (@yourcompany.com)
- ✅ **DO**: Require 2FA for admin accounts
- ✅ **DO**: Review admin list quarterly
- ✅ **DO**: Use principle of least privilege
- ❌ **DON'T**: Use personal emails for production
- ❌ **DON'T**: Share admin credentials
- ❌ **DON'T**: Leave test accounts as admins

### 3. Audit Logging
- ✅ **DO**: Review audit logs weekly
- ✅ **DO**: Set up alerts for sensitive actions (bans, refunds)
- ✅ **DO**: Export logs for compliance
- ✅ **DO**: Retain logs for 90+ days
- ❌ **DON'T**: Delete audit logs
- ❌ **DON'T**: Ignore suspicious patterns

### 4. Rate Limiting
- ✅ **DO**: Implement rate limits on API routes
- ✅ **DO**: Use `check_rate_limit()` function
- ✅ **DO**: Set reasonable limits (e.g., 100 requests/hour)
- ❌ **DON'T**: Allow unlimited API calls
- ❌ **DON'T**: Ignore rate limit violations

### 5. Database Security
- ✅ **DO**: Keep RLS enabled on all tables
- ✅ **DO**: Use SECURITY DEFINER for privileged operations
- ✅ **DO**: Test RLS policies with non-admin users
- ✅ **DO**: Review policies quarterly
- ❌ **DON'T**: Disable RLS "temporarily"
- ❌ **DON'T**: Grant public execute on admin functions
- ❌ **DON'T**: Use raw SQL from client

## 📊 Monitoring & Alerts

### Recommended Alerts
1. **Failed login attempts** (>5 in 10 minutes)
2. **User bans** (any hard ban)
3. **Payment refunds** (>$100 or >5 per day)
4. **Feature flag changes** (production environment)
5. **Rate limit violations** (>10 per user per hour)

### Metrics to Track
- Admin actions per day
- Failed authentication attempts
- API response times
- RLS policy violations
- Database query performance

## 🧪 Testing Security

### Test Checklist
- [ ] Non-admin users cannot access admin dashboard
- [ ] Service role key is not in client bundle
- [ ] All admin actions are logged to `admin_actions`
- [ ] RLS policies prevent unauthorized data access
- [ ] Rate limiting works on API routes
- [ ] Feature flags require admin role to modify
- [ ] Audit log export works correctly

### Security Audit Commands
```sql
-- Check who has admin access
SELECT email, raw_app_meta_data->>'roles' as roles
FROM auth.users
WHERE raw_app_meta_data->>'roles' LIKE '%admin%';

-- Recent admin actions
SELECT admin_id, action, target_type, created_at
FROM admin_actions
ORDER BY created_at DESC
LIMIT 20;

-- Failed authentication attempts (if tracked)
SELECT COUNT(*), DATE(created_at)
FROM admin_actions
WHERE action = 'failed_login'
GROUP BY DATE(created_at)
ORDER BY DATE(created_at) DESC;

-- Rate limit violations
SELECT user_id, action, SUM(count) as total_requests
FROM rate_limits
WHERE window_start >= now() - interval '1 hour'
GROUP BY user_id, action
HAVING SUM(count) > 100;
```

## 🚨 Incident Response

### If Service Role Key is Compromised
1. **Immediately**: Rotate key in Supabase Dashboard
2. **Update**: All deployment environments with new key
3. **Review**: Audit logs for suspicious activity
4. **Notify**: Team and affected users if necessary
5. **Document**: Incident and response actions

### If Unauthorized Access Detected
1. **Revoke**: User's admin access immediately
2. **Review**: Audit logs for actions taken
3. **Assess**: Damage and data exposure
4. **Notify**: Security team and stakeholders
5. **Implement**: Additional safeguards

## 📚 Additional Resources

- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)

---

**Status**: Security hardening complete ✅  
**Last Updated**: 2025-10-14  
**Next Review**: 2025-01-14 (quarterly)

