-- Add updated_at column to stores table if it doesn't exist
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop the trigger if it exists (in case we're re-running)
DROP TRIGGER IF EXISTS update_stores_updated_at ON stores;

-- Create trigger to automatically update updated_at on any UPDATE
CREATE TRIGGER update_stores_updated_at
    BEFORE UPDATE ON stores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Set updated_at for all existing records (use created_at if available, otherwise NOW())
UPDATE stores 
SET updated_at = COALESCE(created_at, NOW())
WHERE updated_at IS NULL;
