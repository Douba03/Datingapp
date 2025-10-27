-- SETUP SUPABASE STORAGE FOR PHOTOS
-- Run this in Supabase SQL Editor

-- Create storage bucket for photos (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for the photos bucket
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

SELECT 'Storage bucket and policies created successfully!' as message;
