-- ========================================
-- ADD YOCO COLUMNS TO TENANTS TABLE
-- Run this ONCE, then delete all accounts and start fresh
-- ========================================

-- Add yoco columns to tenants table
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS yoco_public_key TEXT;

ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS yoco_secret_key TEXT;

-- Verify the columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'tenants'
AND column_name LIKE '%yoco%'
ORDER BY column_name;

SELECT '✅ Yoco columns added to tenants table! You can now delete all accounts and start fresh.' AS status;
