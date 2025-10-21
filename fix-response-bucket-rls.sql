-- Fix RLS policies for response-images bucket
-- Run this in Supabase SQL Editor

-- 1. Drop existing policies for response-images bucket (if any)
DROP POLICY IF EXISTS "response_images_select" ON storage.objects;
DROP POLICY IF EXISTS "response_images_insert" ON storage.objects;
DROP POLICY IF EXISTS "response_images_update" ON storage.objects;
DROP POLICY IF EXISTS "response_images_delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow all for response images" ON storage.objects;

-- 2. Create new permissive policies for response-images bucket
CREATE POLICY "Allow all for response images" ON storage.objects
FOR ALL
TO public
USING (bucket_id = 'response-images')
WITH CHECK (bucket_id = 'response-images');

-- 3. Verify the bucket exists and is public
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'response-images';

-- 4. Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%response%';
