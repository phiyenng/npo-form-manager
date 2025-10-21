-- Update form-attachments bucket to support larger files
-- Run this in Supabase SQL Editor

-- Update the form-attachments bucket to allow larger files (50MB)
UPDATE storage.buckets 
SET file_size_limit = 52428800 -- 50MB
WHERE id = 'form-attachments';

-- If the bucket doesn't exist, create it with larger limits
INSERT INTO storage.buckets (id, name, public, file_size_limit) 
VALUES ('form-attachments', 'form-attachments', true, 52428800)
ON CONFLICT (id) DO UPDATE SET 
  file_size_limit = 52428800,
  public = true;

-- Verify the bucket settings
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'form-attachments';
