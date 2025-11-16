-- =====================================================
-- ADD INSTRUCTIONS AND NOTES COLUMNS TO STORES TABLE
-- Run this in Supabase SQL Editor
-- Date: 2025-11-02
-- =====================================================

-- Add show_instructions column
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS show_instructions BOOLEAN DEFAULT false;

-- Add instructions column
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS instructions TEXT;

-- Add show_notes column
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS show_notes BOOLEAN DEFAULT false;

-- Add notes column
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Verify the columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'stores'
  AND column_name IN ('show_instructions', 'instructions', 'show_notes', 'notes')
ORDER BY ordinal_position;

-- Success message
SELECT '✅ Instructions and Notes columns added successfully!' as status;
