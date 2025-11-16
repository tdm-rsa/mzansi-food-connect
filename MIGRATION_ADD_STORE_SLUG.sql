-- Migration: Add slug column to stores table for customer URLs
-- Run this in your Supabase SQL Editor

-- Add slug column (unique, lowercase, URL-friendly)
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS stores_slug_idx ON stores(slug);

-- Generate slugs for existing stores (if any)
-- This creates simple slugs from store names (you can customize later)
UPDATE stores
SET slug = LOWER(REGEXP_REPLACE(
  REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'), -- Remove special chars
  '\s+', '-', 'g' -- Replace spaces with hyphens
))
WHERE slug IS NULL;

-- Add constraint: slug must be at least 3 characters
ALTER TABLE stores
ADD CONSTRAINT stores_slug_length CHECK (LENGTH(slug) >= 3);

-- Verify the changes
SELECT id, name, slug, owner_id
FROM stores
ORDER BY created_at DESC;

-- Example: If you want to set a specific slug for your test store
-- UPDATE stores SET slug = 'joes-shisanyama' WHERE id = 'your-store-id';
