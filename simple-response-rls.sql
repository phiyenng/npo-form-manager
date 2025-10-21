-- Simple RLS policy for response-images bucket
-- Run this in Supabase SQL Editor

-- Drop all existing policies for response-images
DROP POLICY IF EXISTS "response_images_select" ON storage.objects;
DROP POLICY IF EXISTS "response_images_insert" ON storage.objects;
DROP POLICY IF EXISTS "response_images_update" ON storage.objects;
DROP POLICY IF EXISTS "response_images_delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow all for response images" ON storage.objects;
DROP POLICY IF EXISTS "response_images_policy" ON storage.objects;

-- Create a single permissive policy
CREATE POLICY "response_images_policy" ON storage.objects
FOR ALL
USING (bucket_id = 'response-images')
WITH CHECK (bucket_id = 'response-images');

-- Test the policy
SELECT 
  'Policy created' as status,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname = 'response_images_policy';
