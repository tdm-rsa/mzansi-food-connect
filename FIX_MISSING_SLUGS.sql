-- =====================================================
-- FIX MISSING SLUGS FOR EXISTING STORES
-- =====================================================
-- This script adds slugs to all stores that don't have one
-- Run this in Supabase SQL Editor
-- =====================================================

-- Update all stores without slugs
UPDATE stores
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'),
    '^-|-$', '', 'g'
  ) || '-' || substr(md5(random()::text), 1, 6)
)
WHERE slug IS NULL OR slug = '';

-- Verify all stores now have slugs
SELECT
  id,
  name,
  slug,
  CASE
    WHEN slug IS NULL OR slug = '' THEN '❌ Missing slug'
    ELSE '✅ Has slug'
  END as status
FROM stores
ORDER BY created_at DESC;

-- =====================================================
-- RESULT: All stores should now have unique slugs
-- =====================================================
