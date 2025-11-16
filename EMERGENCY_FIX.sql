-- =====================================================
-- EMERGENCY FIX - Restore your KFC store properly
-- =====================================================

-- Step 1: First, let's see what we have
SELECT id, name, owner_id, slug, show_instructions, instructions, show_notes, notes
FROM stores
ORDER BY created_at DESC;

-- Step 2: Update KFC with proper data
UPDATE stores
SET
  show_instructions = true,
  instructions = '1. Ask for availability before placing order
2. Pay with card
3. Use the Order Id sent on WhatsApp at the till to fetch your order',
  show_notes = true,
  notes = '🔥 Black Friday Sale starts next week!
⏰ Closing at 8pm tonight'
WHERE name = 'KFC'
  AND slug = 'kfc';

-- Step 3: Verify the fix
SELECT
  id,
  name,
  slug,
  banner_text,
  show_instructions,
  LEFT(instructions, 50) as instructions_preview,
  show_notes,
  LEFT(notes, 50) as notes_preview
FROM stores
WHERE name = 'KFC';

-- Step 4: Check menu items are still linked
SELECT
  mi.id,
  mi.name,
  mi.price,
  mi.store_id,
  s.name as store_name
FROM menu_items mi
JOIN stores s ON mi.store_id = s.id
WHERE s.name = 'KFC'
LIMIT 5;

SELECT '✅ KFC store fixed!' as status;
