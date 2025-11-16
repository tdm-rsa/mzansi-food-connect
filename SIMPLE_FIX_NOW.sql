-- =====================================================
-- SIMPLE FIX - Just update KFC and verify
-- =====================================================

-- Step 1: Update KFC store with instructions data
UPDATE stores
SET
  show_instructions = true,
  instructions = '1. Ask for availability before placing order
2. Pay with card
3. Use the Order Id sent on WhatsApp at the till to fetch your order',
  show_notes = true,
  notes = '🔥 Black Friday Sale starts next week!
⏰ Closing at 8pm tonight'
WHERE name = 'KFC';

-- Step 2: Verify it worked
SELECT
  id,
  name,
  slug,
  show_instructions,
  instructions,
  show_notes,
  notes
FROM stores
WHERE name = 'KFC';

-- Done!
SELECT '✅ KFC updated!' as status;
