-- Add is_solution_read column to forms table
-- Run this in Supabase SQL Editor

-- Add is_solution_read column to forms table
ALTER TABLE forms 
ADD COLUMN IF NOT EXISTS is_solution_read BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN forms.is_solution_read IS 'Whether the user has read the solution';

-- Set default value for existing records
UPDATE forms 
SET is_solution_read = FALSE 
WHERE is_solution_read IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'forms' 
AND column_name = 'is_solution_read';
