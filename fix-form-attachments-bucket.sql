-- Fix form-attachments bucket size limit
-- Run this in Supabase SQL Editor

-- Update existing bucket
UPDATE storage.buckets 
SET file_size_limit = 52428800 -- 50MB
WHERE id = 'form-attachments';

-- If bucket doesn't exist, create it
INSERT INTO storage.buckets (id, name, public, file_size_limit) 
VALUES ('form-attachments', 'form-attachments', true, 52428800)
ON CONFLICT (id) DO NOTHING;

-- Check result
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'form-attachments';
