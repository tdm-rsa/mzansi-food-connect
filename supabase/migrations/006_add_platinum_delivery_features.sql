-- =====================================================
-- ADD PLATINUM PLAN DELIVERY FEATURES
-- Migration for Uber Direct delivery integration
-- =====================================================

-- =====================================================
-- 1. ADD DELIVERY COLUMNS TO TENANTS TABLE
-- =====================================================

-- Enable delivery service (Platinum only)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS delivery_enabled BOOLEAN DEFAULT false;

-- Delivery fee (can be overridden by real-time Uber quote)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS delivery_base_fee DECIMAL(10,2) DEFAULT 25.00;

-- Delivery radius in kilometers (for eligibility check)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS delivery_radius_km INTEGER DEFAULT 10;

-- Store physical address for pickup (required for delivery)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS store_address TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS store_lat DECIMAL(10,8);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS store_lng DECIMAL(11,8);

-- Pickup enabled (can disable pickup and only offer delivery)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS pickup_enabled BOOLEAN DEFAULT true;

-- Estimated preparation time (helps calculate total delivery time)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS preparation_time_minutes INTEGER DEFAULT 30;

-- =====================================================
-- 2. ADD DELIVERY COLUMNS TO ORDERS TABLE
-- =====================================================

-- Order fulfillment type: 'pickup' or 'delivery'
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'pickup';

-- Delivery address details
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_suburb TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_city TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_postal_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_lat DECIMAL(10,8);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_lng DECIMAL(11,8);

-- Delivery fee charged to customer
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2);

-- Uber Direct delivery tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS uber_delivery_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_tracking_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_status TEXT; -- 'pending', 'assigned', 'picked_up', 'delivered'
ALTER TABLE orders ADD COLUMN IF NOT EXISTS driver_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS driver_phone TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS actual_delivery_time TIMESTAMP WITH TIME ZONE;

-- =====================================================
-- 3. ADD INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for finding delivery-enabled stores
CREATE INDEX IF NOT EXISTS idx_tenants_delivery_enabled
  ON tenants(delivery_enabled)
  WHERE delivery_enabled = true;

-- Index for finding delivery orders
CREATE INDEX IF NOT EXISTS idx_orders_order_type
  ON orders(order_type);

-- Index for Uber delivery ID lookups (for webhooks)
CREATE INDEX IF NOT EXISTS idx_orders_uber_delivery_id
  ON orders(uber_delivery_id)
  WHERE uber_delivery_id IS NOT NULL;

-- Index for delivery status tracking
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status
  ON orders(delivery_status)
  WHERE delivery_status IS NOT NULL;

-- =====================================================
-- 4. ADD CONSTRAINTS
-- =====================================================

-- Ensure order_type is valid
ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS check_order_type;

ALTER TABLE orders
  ADD CONSTRAINT check_order_type
  CHECK (order_type IN ('pickup', 'delivery'));

-- Ensure delivery_status is valid
ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS check_delivery_status;

ALTER TABLE orders
  ADD CONSTRAINT check_delivery_status
  CHECK (delivery_status IS NULL OR delivery_status IN ('pending', 'assigned', 'picked_up', 'delivered', 'failed'));

-- Delivery orders must have address
ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS check_delivery_address;

ALTER TABLE orders
  ADD CONSTRAINT check_delivery_address
  CHECK (
    (order_type = 'pickup') OR
    (order_type = 'delivery' AND delivery_address IS NOT NULL)
  );

-- =====================================================
-- 5. CREATE DELIVERY ANALYTICS VIEW
-- =====================================================

-- View for Platinum users to see delivery performance
CREATE OR REPLACE VIEW delivery_analytics AS
SELECT
  o.store_id,
  COUNT(*) as total_deliveries,
  COUNT(*) FILTER (WHERE delivery_status = 'delivered') as successful_deliveries,
  COUNT(*) FILTER (WHERE delivery_status = 'failed') as failed_deliveries,
  AVG(delivery_fee) as avg_delivery_fee,
  AVG(EXTRACT(EPOCH FROM (actual_delivery_time - created_at))/60) as avg_delivery_time_minutes,
  SUM(delivery_fee) as total_delivery_revenue,
  DATE_TRUNC('day', created_at) as date
FROM orders
WHERE order_type = 'delivery'
GROUP BY store_id, DATE_TRUNC('day', created_at);

-- Grant access to view
GRANT SELECT ON delivery_analytics TO authenticated;

-- =====================================================
-- 6. ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN tenants.delivery_enabled IS 'Platinum only: Enable Uber Direct delivery service';
COMMENT ON COLUMN tenants.delivery_base_fee IS 'Base delivery fee (may be overridden by Uber quote)';
COMMENT ON COLUMN tenants.delivery_radius_km IS 'Maximum delivery radius from store';
COMMENT ON COLUMN tenants.store_address IS 'Physical store address for driver pickup';
COMMENT ON COLUMN tenants.preparation_time_minutes IS 'Average food preparation time';

COMMENT ON COLUMN orders.order_type IS 'Fulfillment method: pickup or delivery';
COMMENT ON COLUMN orders.uber_delivery_id IS 'Uber Direct delivery tracking ID';
COMMENT ON COLUMN orders.delivery_tracking_url IS 'Customer tracking URL from Uber';
COMMENT ON COLUMN orders.delivery_status IS 'Current delivery status from Uber webhook';

COMMENT ON VIEW delivery_analytics IS 'Platinum feature: Delivery performance metrics';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check new columns exist
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'tenants'
  AND column_name IN ('delivery_enabled', 'delivery_base_fee', 'store_address', 'store_lat', 'store_lng')
ORDER BY column_name;

SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name IN ('order_type', 'delivery_address', 'uber_delivery_id', 'delivery_tracking_url')
ORDER BY column_name;

-- Check indexes created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('tenants', 'orders')
  AND indexname LIKE '%delivery%';
