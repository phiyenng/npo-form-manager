-- Remove the specific constraint that prevents closing tickets with response
-- This is the minimal fix for the current issue

-- Drop the problematic constraint
ALTER TABLE forms DROP CONSTRAINT check_response_requires_accepter;

-- Keep the accepter constraint as is (it already allows Closed status)
-- Keep the foreign key constraint as is

-- Verify the constraint is removed
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'forms'::regclass 
AND (conname LIKE '%response%' OR conname LIKE '%accepter%');

-- Test: This should now work
-- UPDATE forms SET status = 'Closed', end_time = NOW() WHERE response IS NOT NULL LIMIT 1;

SELECT 'Response constraint removed - tickets with response can now be closed' as result;
