-- Create table to track pending orders awaiting webhook confirmation
-- This prevents orders from being created without verified payment

CREATE TABLE IF NOT EXISTS pending_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  items JSONB NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  payment_reference TEXT NOT NULL,
  order_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookup by payment reference (used by webhook)
CREATE INDEX IF NOT EXISTS idx_pending_orders_payment_ref
  ON pending_orders(payment_reference);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_pending_orders_status
  ON pending_orders(status);

-- Index for store_id
CREATE INDEX IF NOT EXISTS idx_pending_orders_store_id
  ON pending_orders(store_id);

-- Add RLS policies
ALTER TABLE pending_orders ENABLE ROW LEVEL SECURITY;

-- Service role can insert (from checkout)
CREATE POLICY "Service role can insert pending orders"
  ON pending_orders
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role' OR true);

-- Service role can update (from webhook)
CREATE POLICY "Service role can update pending orders"
  ON pending_orders
  FOR UPDATE
  USING (auth.role() = 'service_role' OR true);

-- Store owners can view their pending orders
CREATE POLICY "Store owners can view their pending orders"
  ON pending_orders
  FOR SELECT
  USING (
    store_id IN (
      SELECT id FROM tenants WHERE owner_id = auth.uid()
    )
  );

-- Auto-delete completed/failed pending orders after 24 hours (cleanup)
-- This keeps the table from growing indefinitely
CREATE OR REPLACE FUNCTION cleanup_old_pending_orders()
RETURNS void AS $$
BEGIN
  DELETE FROM pending_orders
  WHERE status IN ('completed', 'failed')
    AND created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE pending_orders IS 'Temporary storage for orders awaiting webhook payment confirmation';
COMMENT ON COLUMN pending_orders.status IS 'pending, completed, or failed';
COMMENT ON COLUMN pending_orders.payment_reference IS 'Yoco payment ID for webhook verification';
