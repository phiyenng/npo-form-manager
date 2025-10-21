-- Simple setup for response images (run in Supabase SQL Editor)
-- This avoids RLS policy issues by using simpler approach

-- 1. Add response_images column to forms table
ALTER TABLE forms 
ADD COLUMN IF NOT EXISTS response_images TEXT;

-- 2. Add comment for documentation
COMMENT ON COLUMN forms.response_images IS 'Comma-separated URLs of response images';

-- 3. Create response-images storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('response-images', 'response-images', true, 20971520)
ON CONFLICT (id) DO UPDATE SET 
  file_size_limit = 20971520,
  public = true;

-- 4. Verify the setup
SELECT 
  'Column added' as status,
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'forms' 
AND column_name = 'response_images'

UNION ALL

SELECT 
  'Bucket created' as status,
  id as column_name,
  name as data_type,
  public::text as is_nullable
FROM storage.buckets 
WHERE id = 'response-images';
