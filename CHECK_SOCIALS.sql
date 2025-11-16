-- Check social media links data for your store

SELECT
    id,
    business_name,
    name,
    socials,
    socials::text as socials_raw,
    show_about,
    about_text
FROM tenants
WHERE business_name ILIKE '%zakhona%' OR name ILIKE '%zakhona%';

-- Check if socials column exists and its type
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'tenants'
AND column_name = 'socials';
