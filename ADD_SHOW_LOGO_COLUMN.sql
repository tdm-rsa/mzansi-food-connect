-- Add show_logo column to tenants table
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS show_logo BOOLEAN DEFAULT true;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tenants'
AND column_name = 'show_logo';

SELECT '✅ show_logo column added successfully!' AS status;
