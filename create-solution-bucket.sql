-- Simple script to create solution-images bucket and policies
-- Run this in Supabase SQL Editor

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('solution-images', 'solution-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create a simple policy that allows all operations for solution-images
-- (This is more permissive for testing - you can tighten it later)
CREATE POLICY "Allow all for solution images" ON storage.objects
FOR ALL USING (bucket_id = 'solution-images')
WITH CHECK (bucket_id = 'solution-images');

-- 3. If the above doesn't work, try this alternative:
-- DROP POLICY IF EXISTS "Allow all for solution images" ON storage.objects;
-- CREATE POLICY "Allow all for solution images" ON storage.objects
-- FOR ALL USING (true)
-- WITH CHECK (true);
