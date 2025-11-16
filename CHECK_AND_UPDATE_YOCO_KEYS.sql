-- Check current Yoco keys
SELECT
    id,
    business_name,
    yoco_public_key,
    yoco_secret_key
FROM tenants
WHERE business_name = 'KFC';

-- Update to correct test keys
UPDATE tenants
SET yoco_public_key = 'pk_test_b5c80307jV0Ln7b816c4',
    yoco_secret_key = 'sk_test_47108f1anmD8Ae64844427aa74a8'
WHERE business_name = 'KFC';

-- Verify update
SELECT
    id,
    business_name,
    yoco_public_key,
    yoco_secret_key
FROM tenants
WHERE business_name = 'KFC';

SELECT '✅ Yoco keys updated for KFC store!' AS status;
