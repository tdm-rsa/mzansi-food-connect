-- ========================================
-- COMPLETE YOCO MIGRATION FOR SUPABASE
-- Run this in Supabase SQL Editor
-- ========================================

-- Step 1: Add yoco columns if they don't exist
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS yoco_public_key TEXT;

ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS yoco_secret_key TEXT;

-- Step 2: Copy any existing paystack data to yoco columns (if you want to preserve keys)
-- SKIP THIS STEP if you don't want to preserve old keys
-- UPDATE tenants
-- SET yoco_public_key = paystack_public_key,
--     yoco_secret_key = paystack_secret_key
-- WHERE paystack_public_key IS NOT NULL OR paystack_secret_key IS NOT NULL;

-- Step 3: Drop paystack columns if they exist (CASCADE removes dependencies)
ALTER TABLE tenants
DROP COLUMN IF EXISTS paystack_public_key CASCADE;

ALTER TABLE tenants
DROP COLUMN IF EXISTS paystack_secret_key CASCADE;

-- Step 5: Rename payment_reference to be generic (if needed)
-- ALTER TABLE tenants
-- RENAME COLUMN paystack_payment_reference TO payment_reference;

-- Step 6: Verify the changes
SELECT
    id,
    business_name,
    plan,
    yoco_public_key,
    yoco_secret_key,
    payment_reference
FROM tenants
LIMIT 10;

-- Step 7: Check column structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tenants'
AND column_name LIKE '%yoco%' OR column_name LIKE '%paystack%'
ORDER BY column_name;

SELECT '✅ Yoco migration completed! All Paystack columns removed.' AS status;
