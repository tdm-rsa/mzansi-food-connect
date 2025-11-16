-- =====================================================
-- COMPLETE FIX FOR ALL MISSING COLUMNS
-- Run this ENTIRE script in Supabase SQL Editor
-- =====================================================

-- 1. Add updated_at column
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Add font size columns
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS header_font_size INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS banner_font_size INTEGER DEFAULT 28,
ADD COLUMN IF NOT EXISTS about_font_size INTEGER DEFAULT 16;

-- 3. Create auto-update function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Drop existing trigger if any
DROP TRIGGER IF EXISTS update_stores_updated_at ON stores;

-- 5. Create trigger to auto-update updated_at
CREATE TRIGGER update_stores_updated_at
    BEFORE UPDATE ON stores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Set updated_at for existing records
UPDATE stores 
SET updated_at = COALESCE(created_at, NOW())
WHERE updated_at IS NULL;

-- 7. Verify the columns exist (you should see them in the output)
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'stores'
  AND column_name IN ('updated_at', 'header_font_size', 'banner_font_size', 'about_font_size')
ORDER BY column_name;
