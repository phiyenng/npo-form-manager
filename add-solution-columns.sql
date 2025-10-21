-- Add solution-related columns to forms table
-- Run this in Supabase SQL Editor

-- Add solution columns to forms table
ALTER TABLE forms 
ADD COLUMN IF NOT EXISTS solution TEXT,
ADD COLUMN IF NOT EXISTS solution_images TEXT,
ADD COLUMN IF NOT EXISTS solution_created_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS solution_updated_at TIMESTAMPTZ;

-- Add comments for documentation
COMMENT ON COLUMN forms.solution IS 'Solution description provided by admin';
COMMENT ON COLUMN forms.solution_images IS 'Comma-separated URLs of solution images';
COMMENT ON COLUMN forms.solution_created_at IS 'When the solution was first created';
COMMENT ON COLUMN forms.solution_updated_at IS 'When the solution was last updated';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'forms' 
AND column_name IN ('solution', 'solution_images', 'solution_created_at', 'solution_updated_at');
