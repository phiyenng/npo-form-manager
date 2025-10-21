-- Add response_images column to forms table
-- Run this in Supabase SQL Editor

-- Add response_images column to forms table
ALTER TABLE forms 
ADD COLUMN IF NOT EXISTS response_images TEXT;

-- Add comment for documentation
COMMENT ON COLUMN forms.response_images IS 'Comma-separated URLs of response images';

-- Create response-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('response-images', 'response-images', true, 20971520)
ON CONFLICT (id) DO UPDATE SET 
  file_size_limit = 20971520,
  public = true;

-- Enable RLS on storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for response-images bucket to avoid conflicts
DROP POLICY IF EXISTS "Allow all for response images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for response images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload response images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update response images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete response images" ON storage.objects;

-- Create a permissive policy for all operations by all roles on response-images bucket
CREATE POLICY "Allow all for response images" ON storage.objects
FOR ALL
TO public -- Apply to all roles, including anonymous and authenticated
USING (bucket_id = 'response-images')
WITH CHECK (bucket_id = 'response-images');

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'forms' 
AND column_name = 'response_images';

-- Verify the bucket was created
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'response-images';
