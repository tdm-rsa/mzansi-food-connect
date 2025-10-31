-- Migration: Add image_url and description columns to menu_items table
-- Run this in your Supabase SQL Editor

ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'menu_items'
ORDER BY ordinal_position;
