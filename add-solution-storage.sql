-- Create storage bucket for solution images (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('solution-images', 'solution-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for solution images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload solution images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update solution images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete solution images" ON storage.objects;

-- Set up RLS policies for solution-images bucket
CREATE POLICY "Public read access for solution images" ON storage.objects
FOR SELECT USING (bucket_id = 'solution-images');

CREATE POLICY "Authenticated users can upload solution images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'solution-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update solution images" ON storage.objects
FOR UPDATE USING (bucket_id = 'solution-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete solution images" ON storage.objects
FOR DELETE USING (bucket_id = 'solution-images' AND auth.role() = 'authenticated');

-- Alternative: Allow all operations for solution-images bucket (for testing)
-- Uncomment the following lines if the above policies don't work
/*
DROP POLICY IF EXISTS "Allow all operations for solution images" ON storage.objects;
CREATE POLICY "Allow all operations for solution images" ON storage.objects
FOR ALL USING (bucket_id = 'solution-images');
*/
