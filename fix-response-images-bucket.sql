-- Fix response-images bucket and RLS policies
-- Run this in Supabase SQL Editor

-- 1. First, create the bucket manually
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('response-images', 'response-images', true, 20971520)
ON CONFLICT (id) DO UPDATE SET 
  file_size_limit = 20971520,
  public = true;

-- 2. Disable RLS temporarily to create policies
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 3. Create permissive policies for response-images bucket
CREATE POLICY "response_images_select" ON storage.objects
FOR SELECT USING (bucket_id = 'response-images');

CREATE POLICY "response_images_insert" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'response-images');

CREATE POLICY "response_images_update" ON storage.objects
FOR UPDATE USING (bucket_id = 'response-images');

CREATE POLICY "response_images_delete" ON storage.objects
FOR DELETE USING (bucket_id = 'response-images');

-- 4. Re-enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 5. Verify bucket exists
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'response-images';

-- 6. Verify policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%response_images%';
