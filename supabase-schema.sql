-- Create the forms table
CREATE TABLE IF NOT EXISTS forms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  operator TEXT NOT NULL,
  country TEXT NOT NULL,
  issue TEXT NOT NULL,
  issue_description TEXT NOT NULL,
  kpis_affected TEXT NOT NULL,
  counter_evaluation TEXT NOT NULL,
  optimization_actions TEXT NOT NULL,
  file_url TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('High', 'Medium', 'Low')),
  service_impacted BOOLEAN NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  creator TEXT NOT NULL,
  status TEXT DEFAULT 'Inprocess' CHECK (status IN ('Inprocess', 'Closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now (you can restrict this later)
CREATE POLICY "Allow all operations on forms" ON forms
FOR ALL USING (true);

-- Create storage bucket for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('form-attachments', 'form-attachments', true);

-- Create policy for storage bucket
CREATE POLICY "Allow all operations on form attachments" ON storage.objects
FOR ALL USING (bucket_id = 'form-attachments');
