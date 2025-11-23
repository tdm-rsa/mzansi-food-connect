-- Remove all Yoco keys from stores so they use platform keys from environment variables
-- This ensures all stores use the LIVE keys set in Vercel environment variables

-- First, let's see which stores have Yoco keys
SELECT
  id,
  name,
  slug,
  yoco_public_key,
  LEFT(yoco_secret_key, 20) as secret_preview
FROM tenants
WHERE yoco_public_key IS NOT NULL OR yoco_secret_key IS NOT NULL;

-- Now remove all store-specific Yoco keys (they'll fall back to platform keys)
UPDATE tenants
SET
  yoco_public_key = NULL,
  yoco_secret_key = NULL
WHERE yoco_public_key IS NOT NULL OR yoco_secret_key IS NOT NULL;

-- Verify they're removed
SELECT
  id,
  name,
  slug,
  yoco_public_key,
  yoco_secret_key,
  CASE
    WHEN yoco_public_key IS NULL THEN '✅ Will use platform LIVE keys'
    ELSE '❌ Still has store keys'
  END as status
FROM tenants
ORDER BY created_at DESC;

SELECT '✅ All store-specific Yoco keys removed! Stores will now use LIVE keys from Vercel environment variables.' AS result;
