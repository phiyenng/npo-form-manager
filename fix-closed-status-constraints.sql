-- Fix constraints to allow 'Closed' status regardless of response/solution state
-- This allows closing tickets at any stage of the workflow

-- 1. Drop existing constraints that prevent closing tickets
ALTER TABLE forms DROP CONSTRAINT IF EXISTS check_response_when_accepted;
ALTER TABLE forms DROP CONSTRAINT IF EXISTS check_accepter_when_accepted;

-- 2. Create new constraint for response that allows 'Closed' status
ALTER TABLE forms ADD CONSTRAINT check_response_when_accepted_or_closed 
CHECK (
  (response IS NOT NULL AND status IN ('Accepted', 'Closed') AND accepter_id IS NOT NULL) OR 
  (response IS NULL)
);

-- 3. Create new constraint for accepter that allows 'Closed' status  
ALTER TABLE forms ADD CONSTRAINT check_accepter_when_accepted_or_closed
CHECK (
  (status IN ('Accepted', 'Closed') AND accepter_id IS NOT NULL) OR 
  (status NOT IN ('Accepted', 'Closed') AND accepter_id IS NULL)
);

-- 4. Verify the constraints were updated
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'forms'::regclass 
AND conname LIKE '%response%' OR conname LIKE '%accepter%';

-- 5. Test: Try to close a ticket with response/solution (should work now)
-- UPDATE forms SET status = 'Closed' WHERE id = 'your-form-id-here';
