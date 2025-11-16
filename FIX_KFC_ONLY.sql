-- =====================================================
-- FIX ONLY YOUR KFC STORE
-- =====================================================

-- Step 1: Find your actual KFC store ID
SELECT id, name, slug, owner_id, created_at
FROM stores
ORDER BY created_at ASC;

-- Step 2: Update ONLY the KFC store with slug 'kfc'
-- (Looking at your screenshot, KFC has instructions already but NULL text)
UPDATE stores
SET
  instructions = '1. Ask for availability before placing order
2. Pay with card
3. Use the Order Id sent on WhatsApp at the till to fetch your order',
  notes = '🔥 Black Friday Sale starts next week!
⏰ Closing at 8pm tonight'
WHERE slug = 'kfc';

-- Step 3: Check menu items are linked to correct store
SELECT
  s.id as store_id,
  s.name as store_name,
  s.slug,
  COUNT(mi.id) as menu_items_count
FROM stores s
LEFT JOIN menu_items mi ON mi.store_id = s.id
GROUP BY s.id, s.name, s.slug
ORDER BY s.created_at ASC;

-- Step 4: Verify KFC
SELECT
  id,
  name,
  slug,
  show_instructions,
  instructions,
  show_notes,
  notes
FROM stores
WHERE slug = 'kfc';
