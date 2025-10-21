-- Update solution-images bucket to support larger files
-- Run this in Supabase SQL Editor

-- Update the bucket to allow larger files
UPDATE storage.buckets 
SET file_size_limit = 20971520 -- 20MB
WHERE id = 'solution-images';

-- If the bucket doesn't exist, create it with larger limits
INSERT INTO storage.buckets (id, name, public, file_size_limit) 
VALUES ('solution-images', 'solution-images', true, 20971520)
ON CONFLICT (id) DO UPDATE SET 
  file_size_limit = 20971520,
  public = true;

-- Verify the bucket settings
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'solution-images';
