-- Fix the swapped keys - set correct public key
UPDATE tenants
SET yoco_public_key = 'pk_test_b5c80307jV0Ln7b816c4'
WHERE business_name = 'KFC';

-- Verify
SELECT
    business_name,
    substring(yoco_public_key, 1, 20) as public_prefix,
    substring(yoco_secret_key, 1, 20) as secret_prefix
FROM tenants
WHERE business_name = 'KFC';

SELECT '✅ Fixed! Public key now starts with pk_test' AS status;
