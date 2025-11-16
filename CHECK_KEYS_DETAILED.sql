-- Check keys in detail
SELECT
    business_name,
    substring(yoco_public_key, 1, 25) as public_key_prefix,
    substring(yoco_secret_key, 1, 25) as secret_key_prefix,
    length(yoco_public_key) as public_len,
    length(yoco_secret_key) as secret_len
FROM tenants
WHERE business_name = 'KFC';
