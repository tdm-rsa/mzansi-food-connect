-- ================================================
-- ⚠️ COMPLETE DATABASE RESET - DELETE EVERYTHING
-- ⚠️ WARNING: This will DELETE ALL DATA permanently
-- ⚠️ Use this to start completely fresh
-- ================================================

-- This script will:
-- 1. Delete all users from auth.users
-- 2. Drop and recreate all tables
-- 3. Set up fresh RLS policies
-- 4. Leave you with a clean slate

-- ================================================
-- STEP 1: DELETE ALL USERS
-- ================================================

-- Delete all users (this will cascade delete stores, orders, etc.)
DELETE FROM auth.users;

SELECT '✅ All users deleted' as status;

-- ================================================
-- STEP 2: DROP ALL TABLES
-- ================================================

DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS stores CASCADE;

SELECT '✅ All tables dropped' as status;

-- ================================================
-- STEP 3: RECREATE STORES TABLE
-- ================================================

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
);

CREATE INDEX idx_stores_owner_id ON stores(owner_id);
CREATE INDEX idx_stores_slug ON stores(slug);
CREATE INDEX idx_stores_plan ON stores(plan);

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_insert_own_stores" ON stores FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "users_can_select_own_stores" ON stores FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "users_can_update_own_stores" ON stores FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "users_can_delete_own_stores" ON stores FOR DELETE USING (auth.uid() = owner_id);
CREATE POLICY "public_can_view_stores_by_slug" ON stores FOR SELECT USING (slug IS NOT NULL);

SELECT '✅ Stores table created' as status;

-- ================================================
-- STEP 4: RECREATE MENU_ITEMS TABLE
-- ================================================

CREATE TABLE menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  image_url TEXT,
  category TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_menu_items_store_id ON menu_items(store_id);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_insert_own_menu_items" ON menu_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = menu_items.store_id
    AND stores.owner_id = auth.uid()
  )
);

CREATE POLICY "users_can_select_own_menu_items" ON menu_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = menu_items.store_id
    AND stores.owner_id = auth.uid()
  )
);

CREATE POLICY "users_can_update_own_menu_items" ON menu_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = menu_items.store_id
    AND stores.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = menu_items.store_id
    AND stores.owner_id = auth.uid()
  )
);

CREATE POLICY "users_can_delete_own_menu_items" ON menu_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = menu_items.store_id
    AND stores.owner_id = auth.uid()
  )
);

CREATE POLICY "public_can_view_menu_items" ON menu_items FOR SELECT USING (true);

SELECT '✅ Menu items table created' as status;

-- ================================================
-- STEP 5: RECREATE ORDERS TABLE
-- ================================================

CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  items JSONB NOT NULL,
  total NUMERIC(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'paid',
  estimated_time INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "store_owners_can_view_orders" ON orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = orders.store_id
    AND stores.owner_id = auth.uid()
  )
);

CREATE POLICY "store_owners_can_update_orders" ON orders FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = orders.store_id
    AND stores.owner_id = auth.uid()
  )
);

CREATE POLICY "anyone_can_create_orders" ON orders FOR INSERT WITH CHECK (true);

SELECT '✅ Orders table created' as status;

-- ================================================
-- STEP 6: RECREATE NOTIFICATIONS TABLE
-- ================================================

CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_store_id ON notifications(store_id);
CREATE INDEX idx_notifications_read ON notifications(read);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "store_owners_can_view_notifications" ON notifications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = notifications.store_id
    AND stores.owner_id = auth.uid()
  )
);

CREATE POLICY "store_owners_can_update_notifications" ON notifications FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = notifications.store_id
    AND stores.owner_id = auth.uid()
  )
);

CREATE POLICY "anyone_can_create_notifications" ON notifications FOR INSERT WITH CHECK (true);

SELECT '✅ Notifications table created' as status;

-- ================================================
-- STEP 7: CREATE TRIGGERS
-- ================================================

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

CREATE TRIGGER update_menu_items_updated_at
BEFORE UPDATE ON menu_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

SELECT '✅ Triggers created' as status;

-- ================================================
-- FINAL VERIFICATION
-- ================================================

SELECT '🎉 COMPLETE RESET SUCCESSFUL!' as status;

-- Show all tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Show all RLS policies
SELECT
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ================================================
-- NEXT STEPS
-- ================================================

-- 1. Refresh your app (hard refresh: Ctrl+Shift+R)
-- 2. Create a new account via signup
-- 3. Test the tiered pricing system
-- 4. All new accounts will start with 'trial' plan

SELECT '✅ Database is ready for new signups!' as status;
