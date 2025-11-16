-- Add Yoco TEST keys to your store in Supabase
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/iuuckvthpmttrsutmvga/sql

-- Update the store "My New Store" (my-new-store-tr9j75) with Yoco test keys
UPDATE stores
SET
  yoco_public_key = 'pk_test_ed3c54a6gOol69qa7f45',
  yoco_secret_key = 'sk_test_960bfde0VBrLlpK098e4ffeb53e1'
WHERE slug = 'my-new-store-tr9j75';

-- Verify the update
SELECT
  id,
  name,
  slug,
  plan,
  yoco_public_key,
  yoco_secret_key
FROM stores
WHERE slug = 'my-new-store-tr9j75';

SELECT '✅ Yoco keys added to store!' AS status;
