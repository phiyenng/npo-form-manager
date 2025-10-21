-- Test script to verify that tickets can be closed with response/solution
-- Run this after applying fix-closed-status-constraints.sql

-- 1. Check current constraints
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'forms'::regclass 
AND (conname LIKE '%response%' OR conname LIKE '%accepter%');

-- 2. Test: Try to close a ticket that has response and solution
-- Replace 'your-form-id' with an actual form ID that has response and solution
-- UPDATE forms 
-- SET status = 'Closed', end_time = NOW() 
-- WHERE id = 'your-form-id' 
-- AND response IS NOT NULL 
-- AND solution IS NOT NULL;

-- 3. Verify the update worked
-- SELECT id, status, response, solution, accepter_id, end_time 
-- FROM forms 
-- WHERE id = 'your-form-id';
