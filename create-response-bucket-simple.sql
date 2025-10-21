-- Simple script to create response-images bucket
-- Run this in Supabase SQL Editor

-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('response-images', 'response-images', true, 20971520)
ON CONFLICT (id) DO NOTHING;

-- Verify it was created
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'response-images';
