-- Migrate from Paystack to Yoco
-- Run this in your Supabase SQL Editor

-- Rename columns from paystack to yoco
ALTER TABLE stores
RENAME COLUMN paystack_public_key TO yoco_public_key;

ALTER TABLE stores
RENAME COLUMN paystack_secret_key TO yoco_secret_key;

-- Update comments
COMMENT ON COLUMN stores.yoco_public_key IS 'Vendor Yoco public key for customer payments';
COMMENT ON COLUMN stores.yoco_secret_key IS 'Vendor Yoco secret key (encrypted)';

-- Success message
SELECT 'Database migrated to Yoco successfully! ✅' AS status;
