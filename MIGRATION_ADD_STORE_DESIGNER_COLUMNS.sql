-- Migration: Add Store Designer Columns to stores table
-- Run this in your Supabase SQL Editor

-- First, add updated_at column if it doesn't exist (required by trigger)
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Add columns for Store Designer features
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS show_logo BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS banner_type TEXT DEFAULT 'text-queue',
ADD COLUMN IF NOT EXISTS specials_text TEXT,
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS banner_theme TEXT DEFAULT 'warm',
ADD COLUMN IF NOT EXISTS banner_animation TEXT DEFAULT 'fade',
ADD COLUMN IF NOT EXISTS show_queue BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS product_layout TEXT DEFAULT 'grid3',
ADD COLUMN IF NOT EXISTS product_animation TEXT DEFAULT 'fade',
ADD COLUMN IF NOT EXISTS show_about BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS about_look TEXT DEFAULT 'with-image',
ADD COLUMN IF NOT EXISTS about_image_url TEXT,
ADD COLUMN IF NOT EXISTS about_animation TEXT DEFAULT 'fade',
ADD COLUMN IF NOT EXISTS header_layout TEXT DEFAULT 'center',
ADD COLUMN IF NOT EXISTS socials JSONB DEFAULT '{}'::jsonb;

-- Update existing stores to have default values if NULL
UPDATE stores 
SET 
  show_logo = COALESCE(show_logo, true),
  banner_type = COALESCE(banner_type, 'text-queue'),
  banner_theme = COALESCE(banner_theme, 'warm'),
  banner_animation = COALESCE(banner_animation, 'fade'),
  show_queue = COALESCE(show_queue, true),
  product_layout = COALESCE(product_layout, 'grid3'),
  product_animation = COALESCE(product_animation, 'fade'),
  show_about = COALESCE(show_about, true),
  about_look = COALESCE(about_look, 'with-image'),
  about_animation = COALESCE(about_animation, 'fade'),
  header_layout = COALESCE(header_layout, 'center'),
  socials = COALESCE(socials, '{}'::jsonb)
WHERE id IS NOT NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'stores'
ORDER BY ordinal_position;
