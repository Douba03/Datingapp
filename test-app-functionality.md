# 🧪 Test App Functionality After Database Updates

## **Step 1: Run Database Integrity Check**

1. **Go to Supabase SQL Editor**: https://supabase.com/dashboard/project/zfnwtnqwokwvuxxwxgsr/sql

2. **Run integrity check**: Copy/paste contents of `database-integrity-check.sql`

3. **Verify results**: Look for any errors or orphaned records

## **Step 2: Test Profile Updates**

Run the profile update test:

```bash
node test-profile-update.js
```

This will test:
- ✅ Profile fetching
- ✅ Profile updating (bio, interests)
- ✅ Swipe functionality
- ✅ Database performance

## **Step 3: Test in the App**

### **Profile Editing Test:**
1. **Hard reload** your app (`Ctrl+Shift+R`)
2. **Go to Profile tab**
3. **Tap "Edit" button**
4. **Update bio**: Add some text
5. **Update interests**: Select/deselect some interests
6. **Tap "Save"**
7. **Check console** for these logs:
   ```
   [ProfileEditModal] Saving form data: [data]
   [useAuth] Updating profile: [data]
   [useAuth] Profile updated successfully: [data]
   ```

### **Swiping Test:**
1. **Go to Discover tab**
2. **Swipe right** (heart button) on a profile
3. **Check console** for swipe logs
4. **Verify** remaining swipe count decreases
5. **Check Chat tab** for new matches

### **Chat Test:**
1. **Go to Chat tab**
2. **Tap on a match**
3. **Send a message**
4. **Verify** message appears instantly
5. **Check** if messages persist on reload

## **Step 4: Performance Verification**

### **Check Console Performance:**
- Profile loading should be faster
- Swipe operations should be quicker
- Chat messages should load instantly

### **Check Database Performance:**
Run this query in Supabase to check query performance:

```sql
-- Test profile discovery query performance
EXPLAIN (ANALYZE, BUFFERS) 
SELECT p.*, pr.seeking_genders, pr.age_min, pr.age_max
FROM profiles p
LEFT JOIN preferences pr ON p.user_id = pr.user_id
WHERE p.gender = 'woman' 
  AND p.age BETWEEN 25 AND 35
LIMIT 10;
```

Look for:
- ✅ Index usage (should see "Index Scan")
- ✅ Low execution time (< 50ms)
- ✅ Low buffer usage

## **Expected Results:**

### **✅ What Should Work Better:**
- **Profile saving** - Should work without errors
- **Database queries** - Should be faster with new indexes
- **Swiping** - Should work smoothly
- **Chat loading** - Should be more reliable
- **Real-time updates** - Should work consistently

### **❌ What to Report:**
- Any console errors
- Profile saving failures
- Swipe functionality issues
- Chat message problems
- Performance issues

## **Step 5: Report Results**

After testing, let me know:

1. **✅ What's working better:**
   - Profile editing works?
   - Swiping works?
   - Chat works?
   - Performance improved?

2. **❌ What issues remain:**
   - Any errors in console?
   - Any functionality still broken?
   - Any performance issues?

3. **🎯 What to focus on next:**
   - UI improvements?
   - More features?
   - Bug fixes?

---

**Ready to test?** Start with the database integrity check, then test the app functionality. Let me know the results!
