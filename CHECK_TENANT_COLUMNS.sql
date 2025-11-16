-- Check what columns exist in the tenants table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tenants'
ORDER BY ordinal_position;

-- Also show a sample row to see the actual data
SELECT * FROM tenants LIMIT 1;
