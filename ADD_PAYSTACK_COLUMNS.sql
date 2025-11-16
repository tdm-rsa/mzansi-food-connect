-- Add Paystack integration columns to stores table
-- Run this in your Supabase SQL Editor

-- Add columns for vendor payment integration
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS paystack_public_key TEXT,
ADD COLUMN IF NOT EXISTS paystack_secret_key TEXT;

-- Add comments
COMMENT ON COLUMN stores.paystack_public_key IS 'Vendor Paystack public key for customer payments';
COMMENT ON COLUMN stores.paystack_secret_key IS 'Vendor Paystack secret key (encrypted)';

-- Success message
SELECT 'Paystack columns added successfully! ✅' AS status;
