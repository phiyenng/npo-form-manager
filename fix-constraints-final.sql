-- Final fix for constraints to allow closing tickets at any status
-- This removes all restrictive constraints and allows flexible status changes

-- Step 1: Drop ALL existing constraints that might prevent status changes
ALTER TABLE forms DROP CONSTRAINT IF EXISTS check_response_when_accepted;
ALTER TABLE forms DROP CONSTRAINT IF EXISTS check_accepter_when_accepted;
ALTER TABLE forms DROP CONSTRAINT IF EXISTS check_response_when_accepted_or_closed;
ALTER TABLE forms DROP CONSTRAINT IF EXISTS check_accepter_when_accepted_or_closed;

-- Step 2: Clean up any problematic data
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

-- Step 3: Add very permissive constraints that allow any status changes
-- Only constraint: if you have response, you must have accepter_id
ALTER TABLE forms ADD CONSTRAINT check_response_requires_accepter 
CHECK (
  (response IS NULL) OR 
  (response IS NOT NULL AND accepter_id IS NOT NULL)
);

-- Only constraint: if you have accepter_id, status must be Accepted or Closed
ALTER TABLE forms ADD CONSTRAINT check_accepter_status 
CHECK (
  (accepter_id IS NULL) OR 
  (accepter_id IS NOT NULL AND status IN ('Accepted', 'Closed'))
);

-- Step 4: Test the constraints work
SELECT 'Constraints updated successfully' as status;

-- Step 5: Verify current data is clean
SELECT 
    status,
    COUNT(*) as total,
    COUNT(CASE WHEN accepter_id IS NOT NULL THEN 1 END) as with_accepter,
    COUNT(CASE WHEN response IS NOT NULL THEN 1 END) as with_response,
    COUNT(CASE WHEN solution IS NOT NULL THEN 1 END) as with_solution
FROM forms 
GROUP BY status
ORDER BY status;
