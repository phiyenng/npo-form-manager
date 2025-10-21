-- Fix specific constraints to allow closing tickets with response
-- Based on current constraints shown by user

-- Step 1: Drop the problematic constraint
ALTER TABLE forms DROP CONSTRAINT check_response_requires_accepter;

-- Step 2: Update the accepter constraint to allow Closed status with response
ALTER TABLE forms DROP CONSTRAINT check_accepter_status;
ALTER TABLE forms ADD CONSTRAINT check_accepter_status_flexible
CHECK (
  (accepter_id IS NULL) OR 
  (accepter_id IS NOT NULL AND status IN ('Accepted', 'Closed'))
);

-- Step 3: Add new constraint that allows response with Closed status
ALTER TABLE forms ADD CONSTRAINT check_response_flexible
CHECK (
  (response IS NULL) OR 
  (response IS NOT NULL AND accepter_id IS NOT NULL) OR
  (response IS NOT NULL AND status = 'Closed')
);

-- Step 4: Verify the new constraints
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'forms'::regclass 
AND (conname LIKE '%response%' OR conname LIKE '%accepter%');

-- Step 5: Test - this should now work
-- UPDATE forms SET status = 'Closed', end_time = NOW() WHERE response IS NOT NULL LIMIT 1;

SELECT 'Constraints updated - tickets with response can now be closed' as result;
