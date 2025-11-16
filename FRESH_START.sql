-- ===================================================================
-- COMPLETE FRESH START - GUARANTEED TO WORK
-- This will delete EVERYTHING and start completely fresh
-- ===================================================================

-- Step 1: Delete all users (this cascades to delete all data)
DELETE FROM auth.users;

-- Step 2: Drop all tables (CASCADE removes foreign key dependencies)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS stores CASCADE;

-- Step 3: Create stores table with ALL columns
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- CRITICAL: Plan management columns
  plan TEXT NOT NULL DEFAULT 'trial',
  plan_started_at TIMESTAMPTZ DEFAULT NOW(),
  plan_expires_at TIMESTAMPTZ,
  payment_reference TEXT,

  -- Store settings
  is_open BOOLEAN DEFAULT true,

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

  -- Premium features
  custom_domain TEXT UNIQUE,
  domain_status TEXT DEFAULT 'none'
);

-- Step 4: Create indexes
CREATE INDEX idx_stores_owner_id ON stores(owner_id);
CREATE INDEX idx_stores_slug ON stores(slug);
CREATE INDEX idx_stores_plan ON stores(plan);

-- Step 5: Enable RLS and create policies
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_can_insert_own_stores" ON stores;
CREATE POLICY "users_can_insert_own_stores" ON stores
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "users_can_select_own_stores" ON stores;
CREATE POLICY "users_can_select_own_stores" ON stores
  FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "users_can_update_own_stores" ON stores;
CREATE POLICY "users_can_update_own_stores" ON stores
  FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "users_can_delete_own_stores" ON stores;
CREATE POLICY "users_can_delete_own_stores" ON stores
  FOR DELETE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "public_can_view_stores_by_slug" ON stores;
CREATE POLICY "public_can_view_stores_by_slug" ON stores
  FOR SELECT USING (slug IS NOT NULL);

-- Step 6: Create menu_items table
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

DROP POLICY IF EXISTS "users_can_insert_own_menu_items" ON menu_items;
CREATE POLICY "users_can_insert_own_menu_items" ON menu_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = menu_items.store_id
      AND stores.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "users_can_select_own_menu_items" ON menu_items;
CREATE POLICY "users_can_select_own_menu_items" ON menu_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = menu_items.store_id
      AND stores.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "users_can_update_own_menu_items" ON menu_items;
CREATE POLICY "users_can_update_own_menu_items" ON menu_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = menu_items.store_id
      AND stores.owner_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = menu_items.store_id
      AND stores.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "users_can_delete_own_menu_items" ON menu_items;
CREATE POLICY "users_can_delete_own_menu_items" ON menu_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = menu_items.store_id
      AND stores.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "public_can_view_menu_items" ON menu_items;
CREATE POLICY "public_can_view_menu_items" ON menu_items
  FOR SELECT USING (true);

-- Step 7: Create orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_owners_can_view_orders" ON orders;
CREATE POLICY "store_owners_can_view_orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = orders.store_id
      AND stores.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "store_owners_can_update_orders" ON orders;
CREATE POLICY "store_owners_can_update_orders" ON orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = orders.store_id
      AND stores.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "anyone_can_create_orders" ON orders;
CREATE POLICY "anyone_can_create_orders" ON orders
  FOR INSERT WITH CHECK (true);

-- Step 8: Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_store_id ON notifications(store_id);
CREATE INDEX idx_notifications_read ON notifications(read);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_owners_can_view_notifications" ON notifications;
CREATE POLICY "store_owners_can_view_notifications" ON notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = notifications.store_id
      AND stores.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "store_owners_can_update_notifications" ON notifications;
CREATE POLICY "store_owners_can_update_notifications" ON notifications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = notifications.store_id
      AND stores.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "anyone_can_create_notifications" ON notifications;
CREATE POLICY "anyone_can_create_notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Step 9: Create triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_stores_updated_at ON stores;
CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON stores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_menu_items_updated_at ON menu_items;
CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 10: Verify everything
SELECT 'SUCCESS: Database reset complete!' as message;

SELECT
  'stores' as table_name,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'stores' AND column_name IN ('plan', 'plan_started_at', 'plan_expires_at')
ORDER BY column_name;
