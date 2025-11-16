-- =====================================================
-- MZANSI FOOD CONNECT - RESET & COMPLETE DATABASE SETUP
-- =====================================================
-- This script DROPS everything first, then recreates from scratch
-- WARNING: This will delete ALL data!
-- =====================================================

-- =====================================================
-- STEP 1: DROP EVERYTHING (in correct order)
-- =====================================================

-- Drop views first (they depend on tables)
DROP VIEW IF EXISTS store_best_sellers CASCADE;
DROP VIEW IF EXISTS store_analytics_monthly CASCADE;
DROP VIEW IF EXISTS store_analytics_daily CASCADE;

-- Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS stores CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- =====================================================
-- STEP 2: CREATE EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- STEP 3: CREATE TABLES
-- =====================================================

-- =====================================================
-- STORES TABLE
-- =====================================================
CREATE TABLE stores (
    -- Primary identification
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Plan management
    plan TEXT NOT NULL DEFAULT 'trial' CHECK (plan IN ('trial', 'pro', 'premium')),
    plan_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    plan_expires_at TIMESTAMPTZ NULL, -- NULL for paid plans, set for trial
    payment_reference TEXT NULL,

    -- Operational settings
    is_open BOOLEAN NOT NULL DEFAULT true,

    -- Branding & customization
    logo_url TEXT NULL,
    show_logo BOOLEAN NOT NULL DEFAULT false,
    profile_picture_url TEXT NULL,
    banner_url TEXT NULL,
    banner_text TEXT DEFAULT 'Welcome to our store!',
    banner_type TEXT NULL,
    banner_animation TEXT NULL,
    banner_theme TEXT NULL,
    banner_font_size INTEGER NULL,
    specials_text TEXT NULL,

    -- About section
    about_text TEXT NULL,
    about_look TEXT DEFAULT 'with-image',
    about_image_url TEXT NULL,
    about_font_size INTEGER DEFAULT 16,
    about_animation TEXT DEFAULT 'fade',
    show_about BOOLEAN NOT NULL DEFAULT true,
    socials JSONB DEFAULT '{}'::jsonb,

    -- Instructions & notes
    show_instructions BOOLEAN NOT NULL DEFAULT false,
    instructions TEXT NULL,
    show_notes BOOLEAN NOT NULL DEFAULT false,
    notes TEXT NULL,

    -- Template settings
    active_template TEXT NOT NULL DEFAULT 'Modern Food',
    product_layout TEXT DEFAULT 'grid3',
    product_animation TEXT DEFAULT 'fade',
    show_queue BOOLEAN NOT NULL DEFAULT true,
    header_layout TEXT NULL,
    header_font_size INTEGER NULL,

    -- Premium features
    custom_domain TEXT UNIQUE,
    domain_status TEXT NOT NULL DEFAULT 'none' CHECK (domain_status IN ('none', 'pending', 'active', 'failed'))
);

-- Indexes for stores
CREATE INDEX idx_stores_owner_id ON stores(owner_id);
CREATE INDEX idx_stores_slug ON stores(slug);
CREATE INDEX idx_stores_plan ON stores(plan);
CREATE INDEX idx_stores_plan_expires_at ON stores(plan_expires_at) WHERE plan_expires_at IS NOT NULL;
CREATE INDEX idx_stores_custom_domain ON stores(custom_domain) WHERE custom_domain IS NOT NULL;

-- =====================================================
-- MENU_ITEMS TABLE
-- =====================================================
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    image_url TEXT NULL,
    category TEXT NULL,
    available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for menu_items
CREATE INDEX idx_menu_items_store_id ON menu_items(store_id);
CREATE INDEX idx_menu_items_available ON menu_items(available);
CREATE INDEX idx_menu_items_category ON menu_items(category) WHERE category IS NOT NULL;
CREATE INDEX idx_menu_items_store_available ON menu_items(store_id, available);

-- =====================================================
-- ORDERS TABLE
-- =====================================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    items JSONB NOT NULL, -- Array of {item, qty, price}
    total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'ready', 'completed', 'cancelled')),
    payment_status TEXT NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'failed')),
    payment_reference TEXT NULL,
    estimated_time INTEGER DEFAULT 0 CHECK (estimated_time >= 0),
    order_number TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for orders
CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_store_status ON orders(store_id, status);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);

-- =====================================================
-- NOTIFICATIONS TABLE (Customer inquiries)
-- =====================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NULL,
    message TEXT NOT NULL,
    response TEXT NULL,
    status TEXT DEFAULT 'pending',
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX idx_notifications_store_id ON notifications(store_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_store_unread ON notifications(store_id, read) WHERE read = false;
CREATE INDEX idx_notifications_status ON notifications(status);

-- =====================================================
-- STEP 4: TRIGGERS & FUNCTIONS
-- =====================================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating updated_at
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

-- =====================================================
-- STEP 5: VIEWS (Analytics)
-- =====================================================

-- Daily analytics view
CREATE OR REPLACE VIEW store_analytics_daily AS
SELECT
    store_id,
    DATE(created_at) as day,
    COUNT(*) as orders_count,
    SUM(total) as total_revenue
FROM orders
WHERE payment_status = 'paid'
GROUP BY store_id, DATE(created_at)
ORDER BY day DESC;

-- Monthly analytics view
CREATE OR REPLACE VIEW store_analytics_monthly AS
SELECT
    store_id,
    TO_CHAR(created_at, 'YYYY-MM') as month,
    COUNT(*) as orders_count,
    SUM(total) as total_revenue
FROM orders
WHERE payment_status = 'paid'
GROUP BY store_id, TO_CHAR(created_at, 'YYYY-MM')
ORDER BY month DESC;

-- Best sellers view
CREATE OR REPLACE VIEW store_best_sellers AS
SELECT
    o.store_id,
    item->>'item' as item_name,
    SUM((item->>'qty')::int) as times_sold,
    SUM(((item->>'qty')::int * (item->>'price')::numeric)) as total_earned
FROM orders o,
    jsonb_array_elements(o.items) as item
WHERE o.payment_status = 'paid'
GROUP BY o.store_id, item->>'item'
ORDER BY times_sold DESC;

-- =====================================================
-- STEP 6: ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- =====================================================
-- STORES RLS POLICIES
-- =====================================================
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Users can insert their own stores
CREATE POLICY "users_can_insert_own_stores" ON stores
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Users can select their own stores
CREATE POLICY "users_can_select_own_stores" ON stores
  FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

-- Users can update their own stores
CREATE POLICY "users_can_update_own_stores" ON stores
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Users can delete their own stores
CREATE POLICY "users_can_delete_own_stores" ON stores
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Public can view stores (for customer storefronts)
CREATE POLICY "public_can_view_stores" ON stores
  FOR SELECT
  TO anon
  USING (slug IS NOT NULL);

-- =====================================================
-- MENU_ITEMS RLS POLICIES
-- =====================================================
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Users can insert menu items for their stores
CREATE POLICY "users_can_insert_own_menu_items" ON menu_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = menu_items.store_id
      AND stores.owner_id = auth.uid()
    )
  );

-- Users can select menu items for their stores
CREATE POLICY "users_can_select_own_menu_items" ON menu_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = menu_items.store_id
      AND stores.owner_id = auth.uid()
    )
  );

-- Users can update menu items for their stores
CREATE POLICY "users_can_update_own_menu_items" ON menu_items
  FOR UPDATE
  TO authenticated
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

-- Users can delete menu items for their stores
CREATE POLICY "users_can_delete_own_menu_items" ON menu_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = menu_items.store_id
      AND stores.owner_id = auth.uid()
    )
  );

-- Public can view all menu items (for customer viewing)
CREATE POLICY "public_can_view_menu_items" ON menu_items
  FOR SELECT
  TO anon
  USING (true);

-- =====================================================
-- ORDERS RLS POLICIES
-- =====================================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Store owners can view their orders
CREATE POLICY "store_owners_can_view_orders" ON orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = orders.store_id
      AND stores.owner_id = auth.uid()
    )
  );

-- Store owners can update their orders
CREATE POLICY "store_owners_can_update_orders" ON orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = orders.store_id
      AND stores.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = orders.store_id
      AND stores.owner_id = auth.uid()
    )
  );

-- Store owners can delete their orders
CREATE POLICY "store_owners_can_delete_orders" ON orders
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = orders.store_id
      AND stores.owner_id = auth.uid()
    )
  );

-- Anyone can create orders (customers placing orders)
CREATE POLICY "anyone_can_create_orders" ON orders
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Authenticated users can also create orders
CREATE POLICY "authenticated_can_create_orders" ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =====================================================
-- NOTIFICATIONS RLS POLICIES
-- =====================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Store owners can view their notifications
CREATE POLICY "store_owners_can_view_notifications" ON notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = notifications.store_id
      AND stores.owner_id = auth.uid()
    )
  );

-- Store owners can update their notifications
CREATE POLICY "store_owners_can_update_notifications" ON notifications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = notifications.store_id
      AND stores.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = notifications.store_id
      AND stores.owner_id = auth.uid()
    )
  );

-- Store owners can delete their notifications
CREATE POLICY "store_owners_can_delete_notifications" ON notifications
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = notifications.store_id
      AND stores.owner_id = auth.uid()
    )
  );

-- Anyone can create notifications (customers sending messages)
CREATE POLICY "anyone_can_create_notifications" ON notifications
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Authenticated users can also create notifications
CREATE POLICY "authenticated_can_create_notifications" ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =====================================================
-- STEP 7: GRANT PERMISSIONS ON VIEWS
-- =====================================================
GRANT SELECT ON store_analytics_daily TO authenticated;
GRANT SELECT ON store_analytics_monthly TO authenticated;
GRANT SELECT ON store_best_sellers TO authenticated;

-- =====================================================
-- STEP 8: ENABLE REALTIME
-- =====================================================
-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE stores;
ALTER PUBLICATION supabase_realtime ADD TABLE menu_items;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- Next steps:
-- 1. Create 'store-assets' storage bucket in Supabase Dashboard
-- 2. Set bucket to PUBLIC
-- 3. Apply storage RLS policies
-- 4. Test authentication flow
-- 5. Verify realtime subscriptions work
-- =====================================================
