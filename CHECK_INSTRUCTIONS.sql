-- =====================================================
-- CHECK IF INSTRUCTIONS AND NOTES COLUMNS EXIST
-- AND VIEW CURRENT DATA
-- =====================================================

-- 1. Check if the columns exist in stores table
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'stores'
  AND column_name IN ('show_instructions', 'instructions', 'show_notes', 'notes')
ORDER BY ordinal_position;

-- 2. Check current values in your store
SELECT
  id,
  name,
  show_instructions,
  instructions,
  show_notes,
  notes
FROM stores
ORDER BY created_at DESC
LIMIT 5;

-- 3. If columns don't exist, you'll see empty results above
-- In that case, run ADD_INSTRUCTIONS_AND_NOTES.sql first
