-- =====================================================
-- KEEP ONLY KFC, KAFOUTHOU, AND MC DONALDS
-- DELETE ALL OTHER STORES
-- =====================================================

-- Step 1: First, let's see ALL stores
SELECT
  id,
  name,
  slug,
  owner_id,
  banner_text,
  created_at
FROM stores
ORDER BY created_at ASC;

-- Step 2: Delete ALL stores EXCEPT KFC, KaFourthou, and McDonald's
DELETE FROM stores
WHERE name NOT IN ('KFC', 'KaFourthou', 'Mc donalds', 'McDonalds', 'McDonald''s')
  AND slug NOT IN ('kfc', 'kafouthou', 'mc-donalds', 'mcdonalds');

-- Step 3: Drop the problematic columns
ALTER TABLE stores DROP COLUMN IF EXISTS show_instructions;
ALTER TABLE stores DROP COLUMN IF EXISTS instructions;
ALTER TABLE stores DROP COLUMN IF EXISTS show_notes;
ALTER TABLE stores DROP COLUMN IF EXISTS notes;

-- Step 4: Verify only your 3 stores remain
SELECT
  id,
  name,
  slug,
  owner_id,
  banner_text,
  is_open,
  created_at
FROM stores
ORDER BY created_at ASC;

-- Step 5: Check menu items for each store
SELECT
  s.name as store_name,
  s.slug,
  COUNT(mi.id) as menu_items_count
FROM stores s
LEFT JOIN menu_items mi ON mi.store_id = s.id
GROUP BY s.id, s.name, s.slug
ORDER BY s.created_at ASC;

-- Step 6: Check for orphaned menu items (items with no store)
SELECT COUNT(*) as orphaned_items
FROM menu_items mi
WHERE NOT EXISTS (
  SELECT 1 FROM stores s WHERE s.id = mi.store_id
);

SELECT '✅ Cleaned! Only KFC, KaFourthou, and McDonald''s remain!' as status;
