-- Check announcements and instructions settings

SELECT
    id,
    business_name,
    name,
    specials_text,
    show_instructions,
    instructions,
    CASE
        WHEN specials_text IS NOT NULL AND specials_text != ''
        THEN '✅ Announcements will show'
        ELSE '❌ No announcements text'
    END as announcements_status,
    CASE
        WHEN show_instructions = true AND instructions IS NOT NULL AND instructions != ''
        THEN '✅ Instructions will show'
        ELSE '❌ Instructions not enabled or no text'
    END as instructions_status
FROM tenants
WHERE business_name ILIKE '%zakhona%' OR name ILIKE '%zakhona%';

-- Check if columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tenants'
AND column_name IN ('specials_text', 'show_instructions', 'instructions')
ORDER BY column_name;
