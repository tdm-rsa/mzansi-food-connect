-- =====================================================
-- RESTORE EVERYTHING TO WORKING STATE
-- This will undo all the instructions/announcements changes
-- =====================================================

-- Step 1: Remove the problematic columns
ALTER TABLE stores DROP COLUMN IF EXISTS show_instructions;
ALTER TABLE stores DROP COLUMN IF EXISTS instructions;
ALTER TABLE stores DROP COLUMN IF EXISTS show_notes;
ALTER TABLE stores DROP COLUMN IF EXISTS notes;

-- Step 2: Check all your stores
SELECT
  id,
  name,
  slug,
  owner_id,
  banner_text,
  created_at
FROM stores
ORDER BY created_at ASC;

-- Step 3: Verify menu items are still there
SELECT
  COUNT(*) as total_menu_items,
  store_id,
  (SELECT name FROM stores WHERE id = menu_items.store_id) as store_name
FROM menu_items
GROUP BY store_id;

-- Step 4: Check if there are duplicate stores
SELECT
  name,
  COUNT(*) as count
FROM stores
GROUP BY name
HAVING COUNT(*) > 1;

SELECT '✅ Database cleaned! Check the results above.' as status;
