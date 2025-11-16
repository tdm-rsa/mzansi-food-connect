-- Comprehensive diagnosis of store settings issues
-- Run this to check current state of your store

-- 1. Check if show_logo column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'tenants'
AND column_name = 'show_logo';

-- 2. Check current store data (replace 'ZakhonaFastFood' with your business_name)
SELECT
    id,
    business_name,
    name,
    slug,
    show_logo,
    logo_url IS NOT NULL as has_logo,
    banner_font_size,
    show_instructions,
    instructions,
    socials,
    profile_picture_url IS NOT NULL as has_profile_pic
FROM tenants
WHERE business_name ILIKE '%zakhona%' OR name ILIKE '%zakhona%';

-- 3. Check all column names in tenants table
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'tenants'
ORDER BY ordinal_position;
