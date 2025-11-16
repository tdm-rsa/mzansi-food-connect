-- Get KFC store slug
SELECT
    id,
    business_name,
    name,
    slug,
    subdomain
FROM tenants
WHERE business_name ILIKE '%kfc%' OR name ILIKE '%kfc%';
