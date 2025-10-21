-- Add Response feature to the system

-- 1. Add response column to forms table
ALTER TABLE forms ADD COLUMN IF NOT EXISTS response TEXT;

-- 2. Add response_created_at column to track when response was created
ALTER TABLE forms ADD COLUMN IF NOT EXISTS response_created_at TIMESTAMP WITH TIME ZONE;

-- 3. Add response_updated_at column to track when response was last updated
ALTER TABLE forms ADD COLUMN IF NOT EXISTS response_updated_at TIMESTAMP WITH TIME ZONE;

-- 4. Add is_response_read column to track if user has read the response
ALTER TABLE forms ADD COLUMN IF NOT EXISTS is_response_read BOOLEAN DEFAULT FALSE;

-- 5. Create function to automatically set response timestamps
CREATE OR REPLACE FUNCTION update_response_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    -- If response is being added for the first time
    IF OLD.response IS NULL AND NEW.response IS NOT NULL THEN
        NEW.response_created_at = NOW();
        NEW.response_updated_at = NOW();
        NEW.is_response_read = FALSE; -- Mark as unread for user
    -- If response is being updated
    ELSIF OLD.response IS NOT NULL AND NEW.response IS NOT NULL AND OLD.response != NEW.response THEN
        NEW.response_updated_at = NOW();
        NEW.is_response_read = FALSE; -- Mark as unread for user
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger for response timestamps
CREATE TRIGGER trigger_update_response_timestamps
    BEFORE UPDATE ON forms
    FOR EACH ROW
    EXECUTE FUNCTION update_response_timestamps();

-- 7. Create index for better performance on response queries
CREATE INDEX IF NOT EXISTS idx_forms_response_created_at ON forms(response_created_at);
CREATE INDEX IF NOT EXISTS idx_forms_is_response_read ON forms(is_response_read);

-- 8. Add constraint to ensure response can only be added when status is 'Accepted'
ALTER TABLE forms ADD CONSTRAINT check_response_when_accepted 
CHECK (
  (response IS NOT NULL AND status = 'Accepted' AND accepter_id IS NOT NULL) OR 
  (response IS NULL)
);

-- 9. Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'forms' 
  AND column_name IN ('response', 'response_created_at', 'response_updated_at', 'is_response_read')
ORDER BY column_name;
