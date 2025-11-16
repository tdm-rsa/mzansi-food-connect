-- Add all missing Store Designer columns to tenants table
-- Run this to fix all Store Designer functionality

-- 1. Add show_logo column (for logo upload)
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS show_logo BOOLEAN DEFAULT true;

-- 2. Add font size columns
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS header_font_size INTEGER DEFAULT 20;

ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS banner_font_size INTEGER DEFAULT 28;

ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS about_font_size INTEGER DEFAULT 16;

-- 3. Add other missing designer columns
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS header_layout TEXT DEFAULT 'center';

ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS banner_type TEXT DEFAULT 'text-queue';

ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS banner_animation TEXT DEFAULT 'fade';

ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS banner_theme TEXT DEFAULT 'warm';

ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS product_layout TEXT DEFAULT 'grid3';

ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS product_animation TEXT DEFAULT 'fade';

ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS about_animation TEXT DEFAULT 'fade';

ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS about_look TEXT DEFAULT 'with-image';

-- 4. Add socials column (JSONB for social media links)
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS socials JSONB DEFAULT '{}'::jsonb;

-- 5. Add announcements and instructions columns
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS specials_text TEXT;

ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS show_instructions BOOLEAN DEFAULT false;

ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS instructions TEXT;

-- Verify all columns were added
SELECT
    '✅ All Store Designer columns added successfully!' AS status,
    COUNT(*) AS total_columns_in_tenants
FROM information_schema.columns
WHERE table_name = 'tenants';

-- Show the new columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'tenants'
AND column_name IN (
    'show_logo',
    'header_font_size',
    'banner_font_size',
    'about_font_size',
    'header_layout',
    'banner_type',
    'banner_animation',
    'banner_theme',
    'product_layout',
    'product_animation',
    'about_animation',
    'about_look',
    'socials',
    'specials_text',
    'show_instructions',
    'instructions'
)
ORDER BY column_name;
