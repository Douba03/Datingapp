# 📸 Photo Storage Setup Guide

## **🎯 WHAT THIS FIXES:**

Your photos currently don't persist because they're stored as local file paths (`file://...`) or blob URLs (`blob:...`). We need to upload them to **Supabase Storage** (cloud storage) so they work across sessions.

---

## **Step 1: Create Storage Bucket in Supabase**

### **Option A: Using the Supabase Dashboard (Recommended)**

1. **Go to Supabase Storage**: https://supabase.com/dashboard/project/zfnwtnqwokwvuxxwxgsr/storage/buckets

2. **Click "New bucket"**

3. **Configure the bucket:**
   - **Name**: `photos`
   - **Public bucket**: ✅ **Enable** (so photos can be viewed publicly)
   - **File size limit**: 50MB (or your preference)
   - **Allowed MIME types**: `image/*`

4. **Click "Create bucket"**

### **Option B: Using SQL**

Run this in Supabase SQL Editor:
```sql
-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;
```

---

## **Step 2: Set Up Storage Policies**

Run this SQL in Supabase SQL Editor:

```sql
-- Allow authenticated users to upload their own photos
CREATE POLICY "Users can upload own photos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to update their own photos
CREATE POLICY "Users can update own photos" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to delete their own photos
CREATE POLICY "Users can delete own photos" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow everyone to view photos (for public profiles)
CREATE POLICY "Anyone can view photos" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'photos');
```

---

## **Step 3: Test Photo Upload**

1. **Hard reload** your app (`Ctrl+Shift+R`)
2. **Go to Profile tab**
3. **Tap "Edit"**
4. **Tap "Add Photo" button**
5. **Select a photo** from your computer
6. **Wait for upload** (you'll see a loading spinner)
7. **Check console** for upload logs:
   ```
   [ProfileEditModal] Starting photo upload...
   [usePhotoUpload] Starting upload for URI: blob:http://...
   [usePhotoUpload] Uploading to: profile-photos/[user-id]/[timestamp].jpg
   [usePhotoUpload] Upload successful: [data]
   [usePhotoUpload] Public URL: https://zfnwtnqwokwvuxxwxgsr.supabase.co/storage/v1/object/public/photos/...
   [ProfileEditModal] Photo uploaded successfully: https://...
   ```
8. **Tap "Save"**
9. **Hard reload** to verify photo persists

---

## **Step 4: Verify Photo Storage**

1. **Go to Supabase Storage**: https://supabase.com/dashboard/project/zfnwtnqwokwvuxxwxgsr/storage/buckets/photos

2. **Check for uploaded photos** in `profile-photos/[user-id]/` folder

3. **Click on a photo** to see the public URL

4. **Copy the URL** and paste it in a browser to verify it's accessible

---

## **🎯 Expected Behavior:**

### **Before:**
- ❌ Photos disappear after hard reload
- ❌ Photo URIs are local: `file:///...` or `blob:...`
- ❌ Photos only work in current session

### **After:**
- ✅ Photos persist across sessions
- ✅ Photo URLs are public: `https://zfnwtnqwokwvuxxwxgsr.supabase.co/storage/...`
- ✅ Photos work everywhere (Discover, Profile, Chat)
- ✅ Photos load instantly from CDN

---

## **🔧 Troubleshooting:**

### **Error: "Bucket not found"**
- Make sure you created the `photos` bucket in Step 1
- Check bucket name is exactly `photos` (lowercase)

### **Error: "Permission denied"**
- Make sure you ran the storage policies in Step 2
- Check you're logged in (authenticated)

### **Error: "Upload failed"**
- Check your internet connection
- Try with a smaller image (< 5MB)
- Check browser console for detailed error

### **Photo uploads but doesn't display**
- Check the public URL in console logs
- Verify the URL is accessible in a browser
- Make sure bucket is set to `public: true`

---

## **✅ Testing Checklist:**

- [ ] Storage bucket created
- [ ] Storage policies applied
- [ ] Photo upload works
- [ ] Photo displays in profile
- [ ] Photo persists after hard reload
- [ ] Photo URL is public (https://...)
- [ ] Multiple photos can be uploaded
- [ ] Photos display in Discover/Swipe screens

---

## **🚀 Next Steps:**

Once photo storage is working:
1. Test swiping with profiles that have photos
2. Test chat with profile photos
3. Add photo cropping/editing
4. Add photo verification feature
5. Implement photo moderation

**Ready to test?** Follow the steps above and let me know if you encounter any issues!
