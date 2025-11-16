-- Check if tenants table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name = 'tenants'
) AS tenants_table_exists;

-- If it exists, show all columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tenants'
AND table_schema = 'public'
ORDER BY ordinal_position;
