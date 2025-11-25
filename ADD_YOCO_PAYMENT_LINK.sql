-- Add yoco_payment_link column to tenants table
-- This stores the vendor's Yoco payment page link for QR code generation

ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS yoco_payment_link TEXT;

-- Verify the column was added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'tenants'
AND column_name = 'yoco_payment_link';
