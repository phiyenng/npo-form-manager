-- Simple step-by-step fix for constraint violations

-- Step 1: Drop the problematic constraints first
ALTER TABLE forms DROP CONSTRAINT IF EXISTS check_response_when_accepted;
ALTER TABLE forms DROP CONSTRAINT IF EXISTS check_accepter_when_accepted;
ALTER TABLE forms DROP CONSTRAINT IF EXISTS check_response_when_accepted_or_closed;
ALTER TABLE forms DROP CONSTRAINT IF EXISTS check_accepter_when_accepted_or_closed;

-- Step 2: Clean up the data
-- Clear accepter_id for non-Accepted/Closed statuses
UPDATE forms 
SET accepter_id = NULL 
WHERE status NOT IN ('Accepted', 'Closed') AND accepter_id IS NOT NULL;

-- Clear response for non-Accepted/Closed statuses
UPDATE forms 
SET response = NULL, 
    response_created_at = NULL,
    response_updated_at = NULL,
    response_images = NULL,
    is_response_read = FALSE
WHERE status NOT IN ('Accepted', 'Closed') AND response IS NOT NULL;

-- Clear response for tickets without accepter_id
UPDATE forms 
SET response = NULL, 
    response_created_at = NULL,
    response_updated_at = NULL,
    response_images = NULL,
    is_response_read = FALSE
WHERE response IS NOT NULL AND accepter_id IS NULL;

-- Step 3: Add the new constraints
ALTER TABLE forms ADD CONSTRAINT check_response_when_accepted_or_closed 
CHECK (
  (response IS NOT NULL AND status IN ('Accepted', 'Closed') AND accepter_id IS NOT NULL) OR 
  (response IS NULL)
);

ALTER TABLE forms ADD CONSTRAINT check_accepter_when_accepted_or_closed
CHECK (
  (status IN ('Accepted', 'Closed') AND accepter_id IS NOT NULL) OR 
  (status NOT IN ('Accepted', 'Closed') AND accepter_id IS NULL)
);

-- Step 4: Verify everything is working
SELECT 'Constraints added successfully' as status;
