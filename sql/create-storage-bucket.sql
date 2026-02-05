-- =====================================================
-- CREATE STORAGE BUCKET FOR PROFILE PICTURES
-- =====================================================
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create the profile-pictures bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-pictures',
  'profile-pictures',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile pictures" ON storage.objects;

-- Allow anyone to view profile pictures (public bucket)
CREATE POLICY "Anyone can view profile pictures"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-pictures');

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Authenticated users can upload profile pictures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own photos
CREATE POLICY "Users can update their own profile pictures"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own photos
CREATE POLICY "Users can delete their own profile pictures"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

SELECT 'Storage bucket profile-pictures created with policies!' as message;
