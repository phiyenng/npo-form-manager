-- Add Accepter feature to the system

-- 1. Create accepter table
CREATE TABLE IF NOT EXISTS accepters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add accepter_id column to forms table
ALTER TABLE forms ADD COLUMN IF NOT EXISTS accepter_id UUID REFERENCES accepters(id);

-- 3. Insert sample accepter data
INSERT INTO accepters (name, email, phone) VALUES 
('Le Tam', 'le.tam2@zte.com.cn', '0983438818'),
('Nguyen Van A', 'nguyen.van.a@zte.com.cn', '0987654321'),
('Tran Thi B', 'tran.thi.b@zte.com.cn', '0987654322'),
('Pham Van C', 'pham.van.c@zte.com.cn', '0987654323'),
('Hoang Thi D', 'hoang.thi.d@zte.com.cn', '0987654324')
ON CONFLICT (email) DO NOTHING;

-- 4. Enable RLS for accepters table
ALTER TABLE accepters ENABLE ROW LEVEL SECURITY;

-- 5. Create policy for accepters table
CREATE POLICY "Allow all operations on accepters" ON accepters
FOR ALL USING (true);

-- 6. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for accepters updated_at
CREATE TRIGGER update_accepters_updated_at
    BEFORE UPDATE ON accepters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_forms_accepter_id ON forms(accepter_id);
CREATE INDEX IF NOT EXISTS idx_accepters_email ON accepters(email);

-- 9. Add constraint to ensure accepter_id is only set when status is 'Accepted'
ALTER TABLE forms ADD CONSTRAINT check_accepter_when_accepted 
CHECK (
  (status = 'Accepted' AND accepter_id IS NOT NULL) OR 
  (status != 'Accepted' AND accepter_id IS NULL)
);

-- 10. Create function to automatically clear accepter_id when status changes from Accepted
CREATE OR REPLACE FUNCTION clear_accepter_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- If status is changing from 'Accepted' to something else, clear accepter_id
    IF OLD.status = 'Accepted' AND NEW.status != 'Accepted' THEN
        NEW.accepter_id = NULL;
    END IF;
    
    -- If status is changing to 'Accepted' but no accepter_id is provided, raise an error
    IF NEW.status = 'Accepted' AND NEW.accepter_id IS NULL THEN
        RAISE EXCEPTION 'Accepter must be selected when status is set to Accepted';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Create trigger for status changes
CREATE TRIGGER trigger_clear_accepter_on_status_change
    BEFORE UPDATE ON forms
    FOR EACH ROW
    EXECUTE FUNCTION clear_accepter_on_status_change();

-- 12. Verify the changes
SELECT 
    'accepters' as table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'accepters' 
UNION ALL
SELECT 
    'forms' as table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'forms' AND column_name = 'accepter_id'
ORDER BY table_name, column_name;
