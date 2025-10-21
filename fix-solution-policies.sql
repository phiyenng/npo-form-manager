-- Fix RLS policies for solution-images bucket
-- This will allow all users to upload/download solution images

-- First, drop any existing policies
DROP POLICY IF EXISTS "Allow all for solution images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for solution images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload solution images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update solution images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete solution images" ON storage.objects;

-- Create a very permissive policy that allows all operations for solution-images bucket
CREATE POLICY "Allow all operations for solution images" ON storage.objects
FOR ALL USING (bucket_id = 'solution-images')
WITH CHECK (bucket_id = 'solution-images');

-- Alternative: If the above doesn't work, try this even more permissive version:
-- DROP POLICY IF EXISTS "Allow all operations for solution images" ON storage.objects;
-- CREATE POLICY "Allow all operations for solution images" ON storage.objects
-- FOR ALL USING (true)
-- WITH CHECK (true);

-- Make sure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('solution-images', 'solution-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;
