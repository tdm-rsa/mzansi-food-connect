-- Add custom domain tracking columns to stores table
-- Run this in your Supabase SQL Editor

-- Add columns for custom domain feature (Premium plan)
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS custom_domain TEXT,
ADD COLUMN IF NOT EXISTS domain_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS domain_registered_at TIMESTAMPTZ;

-- Add comments for documentation
COMMENT ON COLUMN stores.custom_domain IS 'Customer custom domain (e.g., mykfcsoweto.co.za)';
COMMENT ON COLUMN stores.domain_status IS 'Domain status: pending, active, failed';
COMMENT ON COLUMN stores.domain_registered_at IS 'Timestamp when domain was registered';

-- Create index for faster domain lookups
CREATE INDEX IF NOT EXISTS idx_stores_custom_domain ON stores(custom_domain);

-- Success message
SELECT 'Custom domain columns added successfully! ✅' AS status;
