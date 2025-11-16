-- Add Yoco payment columns to stores table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/iuuckvthpmttrsutmvga/sql

-- Add yoco_public_key column
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS yoco_public_key TEXT;

-- Add yoco_secret_key column
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS yoco_secret_key TEXT;

-- Verify the columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'stores'
AND column_name IN ('yoco_public_key', 'yoco_secret_key');

SELECT '✅ Yoco columns added to stores table!' AS status;
