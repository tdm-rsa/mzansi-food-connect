-- Add profile_picture_url column to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Add owner_name column to tenants table (for storing owner's display name)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS owner_name TEXT;

-- Add comment for documentation
COMMENT ON COLUMN tenants.profile_picture_url IS 'URL to the owner profile picture stored in Supabase Storage';
COMMENT ON COLUMN tenants.owner_name IS 'Display name of the store owner (shown in dashboard header)';
