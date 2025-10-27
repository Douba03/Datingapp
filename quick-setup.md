# 🚀 Quick Setup Guide - Critical Fixes

## **Step 1: Update Database Schema**

1. **Go to Supabase SQL Editor**: https://supabase.com/dashboard/project/zfnwtnqwokwvuxxwxgsr/sql

2. **Run the optimized schema**: Copy and paste the contents of `database-optimized-schema.sql`

3. **Verify the changes**: Run this query to check if everything is working:
```sql
-- Check if all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if indexes are created
SELECT indexname, tablename FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
```

## **Step 2: Replace Login Screen (Optional)**

If you want to remove debug code from the login screen:

1. **Backup current login**: `mv src/app/(auth)/login.tsx src/app/(auth)/login-backup.tsx`

2. **Use clean version**: `mv src/app/(auth)/login-clean.tsx src/app/(auth)/login.tsx`

## **Step 3: Test the Changes**

1. **Restart your app**: `npm run web`

2. **Test profile editing**:
   - Go to Profile tab
   - Tap "Edit"
   - Update bio and interests
   - Tap "Save"
   - Check console for success logs

3. **Test swiping**:
   - Go to Discover tab
   - Swipe on profiles
   - Check if matches appear in Chat tab

## **Step 4: Verify Database Performance**

Run these queries to check performance:

```sql
-- Check profile query performance
EXPLAIN ANALYZE 
SELECT * FROM profiles 
WHERE gender = 'woman' 
AND age BETWEEN 25 AND 35 
LIMIT 10;

-- Check swipe query performance  
EXPLAIN ANALYZE
SELECT * FROM swipes 
WHERE swiper_user_id = 'your-user-id' 
ORDER BY created_at DESC;
```

## **What's Fixed:**

✅ **Database Performance**: Added proper indexes and optimized queries  
✅ **Profile Saving**: Enhanced error handling and logging  
✅ **Clean Code**: Removed debug code from production  
✅ **Database Structure**: Fixed relationships and constraints  
✅ **Query Optimization**: Added composite indexes for fast discovery  

## **Next Steps:**

After testing these changes, we can move on to:
1. UI component optimization
2. Real-time chat improvements  
3. Advanced matching algorithm
4. Premium features implementation

---

**Need help?** Check the console logs for detailed error messages and let me know what issues you encounter.
