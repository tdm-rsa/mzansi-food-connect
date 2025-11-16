-- =====================================================
-- DELETE PREMIUM STORE AND RESTORE TO WORKING STATE
-- =====================================================

-- Step 1: First, let's see ALL stores to identify what to delete
SELECT
  id,
  name,
  slug,
  owner_id,
  banner_text,
  created_at
FROM stores
ORDER BY created_at ASC;

-- Step 2: Delete the Premium store (if it exists)
DELETE FROM stores
WHERE name = 'Premium' OR slug = 'premium';

-- Step 3: Drop the problematic columns
ALTER TABLE stores DROP COLUMN IF EXISTS show_instructions;
ALTER TABLE stores DROP COLUMN IF EXISTS instructions;
ALTER TABLE stores DROP COLUMN IF EXISTS show_notes;
ALTER TABLE stores DROP COLUMN IF EXISTS notes;

-- Step 4: Verify only your real stores remain
SELECT
  id,
  name,
  slug,
  owner_id,
  banner_text,
  created_at
FROM stores
ORDER BY created_at ASC;

-- Step 5: Check menu items are linked to correct stores
SELECT
  s.name as store_name,
  s.slug,
  COUNT(mi.id) as menu_items_count
FROM stores s
LEFT JOIN menu_items mi ON mi.store_id = s.id
GROUP BY s.id, s.name, s.slug
ORDER BY s.created_at ASC;

-- Step 6: Check for any orphaned menu items
SELECT COUNT(*) as orphaned_items
FROM menu_items mi
WHERE NOT EXISTS (
  SELECT 1 FROM stores s WHERE s.id = mi.store_id
);

SELECT '✅ Premium store deleted and database cleaned!' as status;
