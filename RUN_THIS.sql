-- ================================================
-- COMPLETE DATABASE RESET AND SETUP
-- Copy this entire file and paste into Supabase SQL Editor
-- Then click RUN
-- ================================================

-- Delete all users (cascades to all other data)
DELETE FROM auth.users;

-- Drop all tables
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS stores CASCADE;

-- Create stores table
CREATE TABLE stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_open BOOLEAN DEFAULT true,
  plan TEXT DEFAULT 'trial',
  plan_started_at TIMESTAMPTZ DEFAULT NOW(),
  plan_expires_at TIMESTAMPTZ,
  payment_reference TEXT,
  logo_url TEXT,
  show_logo BOOLEAN DEFAULT false,
  profile_picture_url TEXT,
  banner_url TEXT,
  banner_text TEXT DEFAULT 'Welcome to our store!',
  specials_text TEXT,
  about_text TEXT,
  about_look TEXT DEFAULT 'with-image',
  about_image_url TEXT,
  about_font_size INTEGER DEFAULT 16,
  about_animation TEXT DEFAULT 'fade',
  show_about BOOLEAN DEFAULT true,
  socials JSONB DEFAULT '{}',
  show_instructions BOOLEAN DEFAULT false,
  instructions TEXT,
  show_notes BOOLEAN DEFAULT false,
  notes TEXT,
  active_template TEXT DEFAULT 'Modern Food',
  product_layout TEXT DEFAULT 'grid3',
  product_animation TEXT DEFAULT 'fade',
  show_queue BOOLEAN DEFAULT true,
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

-- Create menu_items table
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
WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = menu_items.store_id AND stores.owner_id = auth.uid()));

CREATE POLICY "users_can_select_own_menu_items" ON menu_items FOR SELECT
USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = menu_items.store_id AND stores.owner_id = auth.uid()));

CREATE POLICY "users_can_update_own_menu_items" ON menu_items FOR UPDATE
USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = menu_items.store_id AND stores.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = menu_items.store_id AND stores.owner_id = auth.uid()));

CREATE POLICY "users_can_delete_own_menu_items" ON menu_items FOR DELETE
USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = menu_items.store_id AND stores.owner_id = auth.uid()));

CREATE POLICY "public_can_view_menu_items" ON menu_items FOR SELECT USING (true);

-- Create orders table
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
USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = orders.store_id AND stores.owner_id = auth.uid()));

CREATE POLICY "store_owners_can_update_orders" ON orders FOR UPDATE
USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = orders.store_id AND stores.owner_id = auth.uid()));

CREATE POLICY "anyone_can_create_orders" ON orders FOR INSERT WITH CHECK (true);

-- Create notifications table
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
USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = notifications.store_id AND stores.owner_id = auth.uid()));

CREATE POLICY "store_owners_can_update_notifications" ON notifications FOR UPDATE
USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = notifications.store_id AND stores.owner_id = auth.uid()));

CREATE POLICY "anyone_can_create_notifications" ON notifications FOR INSERT WITH CHECK (true);

-- Create triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verification
SELECT 'SUCCESS: Database reset complete!' as status;
SELECT 'All users deleted, all tables recreated with plan support' as message;
SELECT 'Next step: Refresh your app and create a new account' as next_step;
