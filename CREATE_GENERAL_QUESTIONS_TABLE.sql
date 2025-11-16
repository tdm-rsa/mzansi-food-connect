-- Create table for general store questions (not tied to specific products)
-- This allows customers to ask general questions about the store

CREATE TABLE IF NOT EXISTS general_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  question TEXT NOT NULL,
  vendor_response TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'answered')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  answered_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_general_questions_store_id ON general_questions(store_id);
CREATE INDEX IF NOT EXISTS idx_general_questions_status ON general_questions(status);
CREATE INDEX IF NOT EXISTS idx_general_questions_created_at ON general_questions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE general_questions ENABLE ROW LEVEL SECURITY;

-- Policy: Vendors can see and manage their own store's questions
CREATE POLICY "Vendors can manage their store questions"
ON general_questions
FOR ALL
USING (
  store_id IN (
    SELECT id FROM tenants WHERE owner_id = auth.uid()
  )
);

-- Policy: Allow anonymous users to insert questions (customers)
CREATE POLICY "Anyone can ask general questions"
ON general_questions
FOR INSERT
WITH CHECK (true);

-- Verify table was created
SELECT
  '✅ General questions table created successfully!' AS status,
  COUNT(*) AS total_columns
FROM information_schema.columns
WHERE table_name = 'general_questions';
