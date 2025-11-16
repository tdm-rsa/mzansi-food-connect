-- Check current keys in database
SELECT
    id,
    business_name,
    yoco_public_key,
    yoco_secret_key,
    updated_at
FROM tenants
WHERE business_name = 'KFC';
