-- ================================================
-- FINAL COMPLETE STORES TABLE SETUP
-- Run this in Supabase SQL Editor
-- WARNING: This will DROP and recreate the stores table
-- ================================================

-- Step 1: Drop stores table completely if it exists
DROP TABLE IF EXISTS stores CASCADE;

-- Step 2: Recreate stores table with ALL columns including plan management
CREATE TABLE stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Store settings
  is_open BOOLEAN DEFAULT true,
  plan TEXT DEFAULT 'trial',
  plan_started_at TIMESTAMPTZ DEFAULT NOW(),
  plan_expires_at TIMESTAMPTZ,
  payment_reference TEXT,

  -- Branding
  logo_url TEXT,
  show_logo BOOLEAN DEFAULT false,
  profile_picture_url TEXT,
  banner_url TEXT,
  banner_text TEXT DEFAULT 'Welcome to our store!',
  specials_text TEXT,

  -- About section
  about_text TEXT,
  about_look TEXT DEFAULT 'with-image',
  about_image_url TEXT,
  about_font_size INTEGER DEFAULT 16,
  about_animation TEXT DEFAULT 'fade',
  show_about BOOLEAN DEFAULT true,
  socials JSONB DEFAULT '{}',

  -- Instructions and Notes
  show_instructions BOOLEAN DEFAULT false,
  instructions TEXT,
  show_notes BOOLEAN DEFAULT false,
  notes TEXT,

  -- Template settings
  active_template TEXT DEFAULT 'Modern Food',
  product_layout TEXT DEFAULT 'grid3',
  product_animation TEXT DEFAULT 'fade',
  show_queue BOOLEAN DEFAULT true,

  -- Domain settings (for Premium plan)
  custom_domain TEXT UNIQUE,
  domain_status TEXT DEFAULT 'none'
  -- domain_status: 'none', 'pending', 'active', 'failed'
);

-- Step 3: Create indexes for performance
CREATE INDEX idx_stores_owner_id ON stores(owner_id);
CREATE INDEX idx_stores_slug ON stores(slug);
CREATE INDEX idx_stores_plan ON stores(plan);

-- Step 4: Enable Row Level Security
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies (auth.uid() works without email verification)
CREATE POLICY "users_can_insert_own_stores"
ON stores FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "users_can_select_own_stores"
ON stores FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "users_can_update_own_stores"
ON stores FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "users_can_delete_own_stores"
ON stores FOR DELETE
USING (auth.uid() = owner_id);

-- Allow public read access to stores by slug (for storefronts)
CREATE POLICY "public_can_view_stores_by_slug"
ON stores FOR SELECT
USING (slug IS NOT NULL);

-- Step 6: Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stores_updated_at
BEFORE UPDATE ON stores
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Verify the setup
SELECT 'Stores table created successfully!' as status;

SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'stores';

