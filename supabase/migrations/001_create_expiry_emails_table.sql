-- Create table to track expiry reminder emails sent
-- This prevents duplicate emails from being sent to the same store

CREATE TABLE IF NOT EXISTS expiry_emails_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  sent_to TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups when checking if email already sent today
CREATE INDEX IF NOT EXISTS idx_expiry_emails_store_date
  ON expiry_emails_sent(store_id, sent_at);

-- Index for email type filtering
CREATE INDEX IF NOT EXISTS idx_expiry_emails_type
  ON expiry_emails_sent(email_type);

-- Add RLS policies
ALTER TABLE expiry_emails_sent ENABLE ROW LEVEL SECURITY;

-- Only service role can insert (edge functions)
CREATE POLICY "Service role can insert expiry emails"
  ON expiry_emails_sent
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Store owners can view their own email history
CREATE POLICY "Store owners can view their email history"
  ON expiry_emails_sent
  FOR SELECT
  USING (
    store_id IN (
      SELECT id FROM tenants WHERE owner_id = auth.uid()
    )
  );

COMMENT ON TABLE expiry_emails_sent IS 'Tracks all expiry reminder emails sent to prevent duplicates';
COMMENT ON COLUMN expiry_emails_sent.email_type IS 'Type of email: 7_day_reminder, 3_day_reminder, expired, grace_day_1, grace_day_2, grace_day_3_final';
COMMENT ON COLUMN expiry_emails_sent.sent_to IS 'Email address the reminder was sent to';
