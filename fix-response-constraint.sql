-- Fix constraint to allow closing tickets with response
-- The issue: tickets with response cannot be closed due to constraint

-- Step 1: Check current constraints
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'forms'::regclass 
AND (conname LIKE '%response%' OR conname LIKE '%accepter%');

-- Step 2: Drop any remaining constraints that prevent closing tickets with response
ALTER TABLE forms DROP CONSTRAINT IF EXISTS check_response_when_accepted;
ALTER TABLE forms DROP CONSTRAINT IF EXISTS check_response_when_accepted_or_closed;
ALTER TABLE forms DROP CONSTRAINT IF EXISTS check_response_requires_accepter;
ALTER TABLE forms DROP CONSTRAINT IF EXISTS check_accepter_when_accepted;
ALTER TABLE forms DROP CONSTRAINT IF EXISTS check_accepter_when_accepted_or_closed;
ALTER TABLE forms DROP CONSTRAINT IF EXISTS check_accepter_status;

-- Step 3: Add very permissive constraint that allows any status with response
-- Only rule: if you have response, you should have accepter_id (but allow closing)
ALTER TABLE forms ADD CONSTRAINT check_response_with_accepter_or_closed
CHECK (
  (response IS NULL) OR 
  (response IS NOT NULL AND accepter_id IS NOT NULL) OR
  (response IS NOT NULL AND status = 'Closed')
);

-- Step 4: Test: Try to close a ticket with response
-- UPDATE forms SET status = 'Closed', end_time = NOW() WHERE id = 'your-form-id-with-response';

SELECT 'Constraint updated - tickets with response can now be closed' as result;
