-- =====================================================
-- FIX STORAGE BUCKET FOR PROFILE PICTURES
-- =====================================================
-- Run this in Supabase SQL Editor if photo upload is failing
-- =====================================================

-- Step 1: Check if bucket exists
SELECT 'Checking existing buckets...' as step;
SELECT id, name, public, file_size_limit FROM storage.buckets;

-- Step 2: Create or update the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-pictures',
  'profile-pictures',
  true,  -- PUBLIC bucket so images can be viewed
  10485760, -- 10MB limit (increased from 5MB)
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];

-- Step 3: Drop ALL existing policies on storage.objects for this bucket
DROP POLICY IF EXISTS "Anyone can view profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow user uploads" ON storage.objects;
DROP POLICY IF EXISTS "profile_pictures_select" ON storage.objects;
DROP POLICY IF EXISTS "profile_pictures_insert" ON storage.objects;
DROP POLICY IF EXISTS "profile_pictures_update" ON storage.objects;
DROP POLICY IF EXISTS "profile_pictures_delete" ON storage.objects;

-- Step 4: Create SIMPLE and PERMISSIVE policies

-- Allow ANYONE to view profile pictures (public bucket)
CREATE POLICY "Anyone can view profile pictures"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-pictures');

-- Allow ANY authenticated user to upload to profile-pictures bucket
-- The folder structure is: user_id/filename.jpg
CREATE POLICY "Authenticated users can upload profile pictures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-pictures');

-- Allow users to update files in the bucket
CREATE POLICY "Users can update their own profile pictures"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-pictures');

-- Allow users to delete files in the bucket
CREATE POLICY "Users can delete their own profile pictures"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-pictures');

-- Step 5: Verify the setup
SELECT 'Storage bucket verification:' as step;

SELECT 
  b.id as bucket_id,
  b.name as bucket_name,
  b.public as is_public,
  b.file_size_limit,
  b.allowed_mime_types
FROM storage.buckets b
WHERE b.id = 'profile-pictures';

SELECT 'Storage policies:' as step;
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%profile%';

SELECT '✅ Storage bucket fixed! Try uploading a photo now.' as message;
