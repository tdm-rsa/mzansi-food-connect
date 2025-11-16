-- ========================================
-- ADD YOCO COLUMNS TO TENANTS TABLE
-- Run this in Supabase SQL Editor
-- ========================================

-- Step 1: Add yoco columns to tenants table
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS yoco_public_key TEXT;

ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS yoco_secret_key TEXT;

-- Step 2: Add the Yoco test keys to your tenant (using business_name to identify it)
UPDATE tenants
SET
  yoco_public_key = 'pk_test_ed3c54a6gOol69qa7f45',
  yoco_secret_key = 'sk_test_960bfde0VBrLlpK098e4ffeb53e1'
WHERE business_name = 'flashback';

-- Step 3: Verify the columns were added and keys were set
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'tenants'
AND column_name LIKE '%yoco%'
ORDER BY column_name;

-- Step 4: Verify the data was updated
SELECT
  id,
  business_name,
  subdomain,
  plan,
  yoco_public_key,
  yoco_secret_key
FROM tenants
WHERE business_name = 'flashback';

SELECT '✅ Yoco columns added and keys saved to tenants table!' AS status;
