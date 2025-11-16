-- Create pending_payments table to store payment info before email confirmation
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/iuuckvthpmttrsutmvga/sql

CREATE TABLE IF NOT EXISTS pending_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  store_name TEXT NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('trial', 'pro', 'premium')),
  payment_reference TEXT NOT NULL,
  amount_in_cents INTEGER NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id) -- One payment per user
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pending_payments_user_id ON pending_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_payments_email ON pending_payments(email);

-- Enable Row Level Security
ALTER TABLE pending_payments ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything (for backend operations)
CREATE POLICY "Service role has full access" ON pending_payments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow users to read their own pending payments
CREATE POLICY "Users can read own pending payments" ON pending_payments
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow unauthenticated users to insert (during signup before email confirmation)
CREATE POLICY "Allow insert during signup" ON pending_payments
  FOR INSERT
  TO anon
  WITH CHECK (true);

SELECT '✅ pending_payments table created successfully!' AS status;
