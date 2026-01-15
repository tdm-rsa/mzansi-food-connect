-- Create pending_payments table for tracking signup payments before account creation
CREATE TABLE IF NOT EXISTS public.pending_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  store_name TEXT NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('trial', 'pro', 'premium')),
  payment_reference TEXT,
  amount_in_cents INTEGER NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pending_payments_user_id ON public.pending_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_payments_email ON public.pending_payments(email);
CREATE INDEX IF NOT EXISTS idx_pending_payments_processed_at ON public.pending_payments(processed_at);

-- Enable RLS
ALTER TABLE public.pending_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own pending payments" ON public.pending_payments;
DROP POLICY IF EXISTS "Service role has full access to pending_payments" ON public.pending_payments;
DROP POLICY IF EXISTS "Users can insert their own pending payments" ON public.pending_payments;

-- Allow users to read their own pending payments
CREATE POLICY "Users can view their own pending payments"
  ON public.pending_payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow service role to do everything (for edge functions)
CREATE POLICY "Service role has full access to pending_payments"
  ON public.pending_payments
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Allow authenticated users to insert their own records
CREATE POLICY "Users can insert their own pending payments"
  ON public.pending_payments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
