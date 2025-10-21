-- Fix existing data before applying new constraints
-- This script handles data that violates the new constraint rules

-- 1. First, let's see what data is causing the violation
SELECT 
    id, 
    status, 
    accepter_id, 
    response,
    solution,
    CASE 
        WHEN status IN ('Accepted', 'Closed') AND accepter_id IS NULL THEN 'Missing accepter_id'
        WHEN status NOT IN ('Accepted', 'Closed') AND accepter_id IS NOT NULL THEN 'Has accepter_id but wrong status'
        WHEN response IS NOT NULL AND status NOT IN ('Accepted', 'Closed') THEN 'Has response but wrong status'
        WHEN response IS NOT NULL AND accepter_id IS NULL THEN 'Has response but no accepter_id'
        ELSE 'OK'
    END as issue
FROM forms 
WHERE 
    (status IN ('Accepted', 'Closed') AND accepter_id IS NULL) OR
    (status NOT IN ('Accepted', 'Closed') AND accepter_id IS NOT NULL) OR
    (response IS NOT NULL AND status NOT IN ('Accepted', 'Closed')) OR
    (response IS NOT NULL AND accepter_id IS NULL);

-- 2. Fix data violations by clearing problematic fields
-- Option A: Clear accepter_id for non-Accepted/Closed statuses
UPDATE forms 
SET accepter_id = NULL 
WHERE status NOT IN ('Accepted', 'Closed') AND accepter_id IS NOT NULL;

-- Option B: Clear response for non-Accepted/Closed statuses  
UPDATE forms 
SET response = NULL, 
    response_created_at = NULL,
    response_updated_at = NULL,
    response_images = NULL,
    is_response_read = FALSE
WHERE status NOT IN ('Accepted', 'Closed') AND response IS NOT NULL;

-- Option C: Clear solution for non-Accepted/Closed statuses
UPDATE forms 
SET solution = NULL,
    solution_images = NULL,
    solution_created_at = NULL,
    solution_updated_at = NULL,
    is_solution_read = FALSE
WHERE status NOT IN ('Accepted', 'Closed') AND solution IS NOT NULL;

-- 3. For tickets with response but no accepter_id, either:
-- Option D1: Clear the response
UPDATE forms 
SET response = NULL, 
    response_created_at = NULL,
    response_updated_at = NULL,
    response_images = NULL,
    is_response_read = FALSE
WHERE response IS NOT NULL AND accepter_id IS NULL;

-- Option D2: OR set status to 'Accepted' (if you want to keep the response)
-- UPDATE forms 
-- SET status = 'Accepted' 
-- WHERE response IS NOT NULL AND accepter_id IS NOT NULL AND status != 'Closed';

-- 4. Verify the data is now clean
SELECT 
    status,
    COUNT(*) as count,
    COUNT(CASE WHEN accepter_id IS NOT NULL THEN 1 END) as with_accepter,
    COUNT(CASE WHEN response IS NOT NULL THEN 1 END) as with_response,
    COUNT(CASE WHEN solution IS NOT NULL THEN 1 END) as with_solution
FROM forms 
GROUP BY status
ORDER BY status;
