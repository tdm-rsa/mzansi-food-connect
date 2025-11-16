-- =====================================================
-- CHECK ALL STORES AND VERIFY DATABASE
-- =====================================================

-- Step 1: Show all stores with full details
SELECT
  id,
  name,
  slug,
  owner_id,
  plan,
  is_open,
  active_template,
  banner_text,
  created_at
FROM stores
ORDER BY created_at DESC;

-- Step 2: Check if those problematic columns still exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'stores'
  AND column_name IN ('show_instructions', 'instructions', 'show_notes', 'notes');

-- Step 3: Count menu items per store
SELECT
  s.name as store_name,
  s.slug,
  s.owner_id,
  COUNT(mi.id) as menu_items_count
FROM stores s
LEFT JOIN menu_items mi ON mi.store_id = s.id
GROUP BY s.id, s.name, s.slug, s.owner_id
ORDER BY s.created_at DESC;

-- Step 4: Check for duplicate store names
SELECT
  name,
  COUNT(*) as count
FROM stores
GROUP BY name
HAVING COUNT(*) > 1;

SELECT '✅ Database check complete!' as status;
