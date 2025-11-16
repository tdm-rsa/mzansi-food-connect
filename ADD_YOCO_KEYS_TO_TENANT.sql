-- Add Yoco TEST keys to your tenant/store in Supabase
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/iuuckvthpmttrsutmvga/sql

-- First, let's see what's in the tenants table
SELECT * FROM tenants LIMIT 5;

-- Update the tenant "My New Store" with Yoco test keys
-- (Adjust the WHERE clause based on what you see above)
UPDATE tenants
SET
  yoco_public_key = 'pk_test_ed3c54a6gOol69qa7f45',
  yoco_secret_key = 'sk_test_960bfde0VBrLlpK098e4ffeb53e1'
WHERE slug = 'my-new-store-tr9j75';

-- If that doesn't work, try updating by name:
-- UPDATE tenants
-- SET
--   yoco_public_key = 'pk_test_ed3c54a6gOol69qa7f45',
--   yoco_secret_key = 'sk_test_960bfde0VBrLlpK098e4ffeb53e1'
-- WHERE name = 'My New Store';

-- Verify the update
SELECT
  id,
  name,
  slug,
  plan,
  yoco_public_key,
  yoco_secret_key
FROM tenants;

SELECT '✅ Yoco keys added to tenant!' AS status;
