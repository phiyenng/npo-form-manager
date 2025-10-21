-- Remove ALL constraints that prevent status changes
-- This allows maximum flexibility for status management

-- Drop all existing constraints
ALTER TABLE forms DROP CONSTRAINT IF EXISTS check_response_when_accepted;
ALTER TABLE forms DROP CONSTRAINT IF EXISTS check_accepter_when_accepted;
ALTER TABLE forms DROP CONSTRAINT IF EXISTS check_response_when_accepted_or_closed;
ALTER TABLE forms DROP CONSTRAINT IF EXISTS check_accepter_when_accepted_or_closed;
ALTER TABLE forms DROP CONSTRAINT IF EXISTS check_response_requires_accepter;
ALTER TABLE forms DROP CONSTRAINT IF EXISTS check_accepter_status;
ALTER TABLE forms DROP CONSTRAINT IF EXISTS check_response_with_accepter_or_closed;

-- Verify no constraints remain
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'forms'::regclass 
AND (conname LIKE '%response%' OR conname LIKE '%accepter%');

-- Test: Update a ticket with response to closed
-- UPDATE forms SET status = 'Closed', end_time = NOW() WHERE response IS NOT NULL LIMIT 1;

SELECT 'All constraints removed - maximum flexibility for status changes' as result;
