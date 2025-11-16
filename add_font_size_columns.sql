-- Add font size columns to stores table
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS header_font_size INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS banner_font_size INTEGER DEFAULT 28,
ADD COLUMN IF NOT EXISTS about_font_size INTEGER DEFAULT 16;

-- Add comments for documentation
COMMENT ON COLUMN stores.header_font_size IS 'Font size for store name in header (12-32px)';
COMMENT ON COLUMN stores.banner_font_size IS 'Font size for banner text (16-40px)';
COMMENT ON COLUMN stores.about_font_size IS 'Font size for about section text (12-24px)';
