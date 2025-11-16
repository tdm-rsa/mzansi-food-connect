-- =====================================================
-- SIMPLE FIX FOR INSTRUCTIONS AND NOTES
-- Copy and paste this ENTIRE script into Supabase SQL Editor
-- Click RUN
-- =====================================================

-- Step 1: Add columns to stores table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS show_instructions BOOLEAN DEFAULT false;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS instructions TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS show_notes BOOLEAN DEFAULT false;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS notes TEXT;

-- Step 2: Verify columns were added
SELECT 'Columns added successfully!' as message;

-- Step 3: Check your stores
SELECT id, name, show_instructions, instructions, show_notes, notes FROM stores LIMIT 5;
