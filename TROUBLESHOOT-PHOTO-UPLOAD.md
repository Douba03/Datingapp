# 🔧 Troubleshoot Photo Upload Issues

## **Step 1: Check Browser Console**

1. **Open browser console** (`F12` or `Ctrl+Shift+I`)
2. **Go to Profile → Edit → Add Photo**
3. **Look for error messages**

### **Common Error Messages:**

#### **Error: "Bucket not found"**
```
Upload error: { statusCode: "404", error: "Bucket not found" }
```

**Solution:**
- Bucket name mismatch or doesn't exist
- Run: `node test-storage-upload.js` to check if bucket exists
- Make sure bucket is named exactly `profile-pictures`

#### **Error: "Permission denied" or "Policy violation"**
```
Upload error: { statusCode: "403", error: "new row violates row-level security policy" }
```

**Solution:**
- Storage policies not set up correctly
- Make sure you're logged in to the app
- Re-run the storage policies SQL:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view photos" ON storage.objects;

-- Recreate policies
CREATE POLICY "Users can upload own photos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profile-pictures');

CREATE POLICY "Users can update own photos" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'profile-pictures');

CREATE POLICY "Users can delete own photos" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'profile-pictures');

CREATE POLICY "Anyone can view photos" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'profile-pictures');
```

#### **Error: "Failed to fetch" or network error**
```
TypeError: Failed to fetch
```

**Solution:**
- Internet connection issue
- Supabase service down (unlikely)
- CORS issue (check Supabase settings)

#### **Error: "Cannot read properties of undefined"**
```
TypeError: Cannot read properties of undefined (reading 'id')
```

**Solution:**
- User not logged in
- Check if `user` exists in console: Type `localStorage` in console and check for auth data

---

## **Step 2: Verify Storage Bucket**

### **Option A: Using Supabase Dashboard**

1. **Go to**: https://supabase.com/dashboard/project/zfnwtnqwokwvuxxwxgsr/storage/buckets
2. **Check if `profile-pictures` bucket exists**
3. **Check bucket settings:**
   - **Public bucket**: Should be ✅ enabled
   - **File size limit**: At least 10MB
   - **Allowed MIME types**: Should include `image/*`

### **Option B: Using Terminal**

```bash
node test-storage-upload.js
```

This will show:
```
✅ "profile-pictures" bucket exists
   Public: true
✅ Can list files in bucket
```

---

## **Step 3: Check Authentication**

Make sure you're logged in:

1. **Open browser console**
2. **Type:** `localStorage.getItem('supabase.auth.token')`
3. **Should show**: A token string (not `null`)

If `null`, you're not logged in:
- Go to login page
- Sign in with your account
- Try uploading photo again

---

## **Step 4: Simplify Storage Policies**

If still not working, try simpler policies (TEMPORARY - less secure):

```sql
-- TEMPORARY: Allow anyone to upload (for testing only!)
DROP POLICY IF EXISTS "Users can upload own photos" ON storage.objects;
CREATE POLICY "Anyone can upload photos" ON storage.objects
FOR INSERT TO public
WITH CHECK (bucket_id = 'profile-pictures');

-- After testing, revert back to authenticated-only policy!
```

---

## **Step 5: Check Bucket Configuration**

Make sure the bucket is configured correctly:

```sql
-- Check bucket configuration
SELECT * FROM storage.buckets WHERE name = 'profile-pictures';
```

Should show:
```
id: profile-pictures
name: profile-pictures
public: true
file_size_limit: (some number)
allowed_mime_types: (null or array with image types)
```

If `public: false`, update it:
```sql
UPDATE storage.buckets 
SET public = true 
WHERE name = 'profile-pictures';
```

---

## **Step 6: Test Upload Manually**

Test upload directly in browser console:

```javascript
// Get Supabase client
const supabase = window.supabase || /* your supabase client */;

// Create a test blob
const testBlob = new Blob(['test'], { type: 'text/plain' });

// Try to upload
const { data, error } = await supabase.storage
  .from('profile-pictures')
  .upload('profile-photos/test/test.txt', testBlob);

console.log('Upload result:', { data, error });
```

---

## **Common Issues & Solutions:**

### **Issue 1: Button doesn't respond**
- Check if `uploading` state is stuck
- Check if `pickAndUploadPhoto` is being called
- Add `console.log` in `handlePhotoUpload` function

### **Issue 2: Photo picker doesn't open**
- Browser permissions blocked
- Check browser settings for file access
- Try a different browser

### **Issue 3: Upload succeeds but photo doesn't display**
- Check photo URL in console
- Verify URL is accessible: Copy URL and paste in browser
- Check if bucket is public

### **Issue 4: Upload is very slow**
- Large image file (compress first)
- Slow internet connection
- Try with smaller test image (< 1MB)

---

## **Quick Test Script:**

Create a simple test in browser console:

```javascript
// 1. Check if storage is accessible
const { data: buckets } = await supabase.storage.listBuckets();
console.log('Buckets:', buckets);

// 2. Check if you're authenticated
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user?.id);

// 3. Try a simple upload
const blob = new Blob(['test'], { type: 'text/plain' });
const { data, error } = await supabase.storage
  .from('profile-pictures')
  .upload(`test/${Date.now()}.txt`, blob);
console.log('Upload:', { data, error });
```

---

## **Still Not Working?**

**Copy and paste your browser console logs here and I'll help debug!**

Look for:
- Red error messages
- Logs starting with `[usePhotoUpload]` or `[ProfileEditModal]`
- Network errors in Network tab
- Authentication errors

**Common things to share:**
1. Complete error message from console
2. Result of `node test-storage-upload.js`
3. Screenshot of Storage page showing bucket exists
4. Screenshot of browser console when clicking "Add Photo"
