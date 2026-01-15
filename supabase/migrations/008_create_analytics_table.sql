-- Create analytics table for tracking store metrics
CREATE TABLE IF NOT EXISTS public.analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('order', 'revenue', 'product_view', 'cart_add', 'checkout_start', 'payment_success', 'payment_failed')),
  metric_value DECIMAL(10, 2) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_store_id ON public.analytics(store_id);
CREATE INDEX IF NOT EXISTS idx_analytics_metric_type ON public.analytics(metric_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_store_created ON public.analytics(store_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Store owners can view their own analytics" ON public.analytics;
DROP POLICY IF EXISTS "Service role has full access to analytics" ON public.analytics;
DROP POLICY IF EXISTS "Store owners can insert their own analytics" ON public.analytics;

-- Allow store owners to view their own analytics
CREATE POLICY "Store owners can view their own analytics"
  ON public.analytics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tenants
      WHERE tenants.id = analytics.store_id
      AND tenants.owner_id = auth.uid()
    )
  );

-- Allow service role full access (for edge functions)
CREATE POLICY "Service role has full access to analytics"
  ON public.analytics
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Allow store owners to insert their own analytics
CREATE POLICY "Store owners can insert their own analytics"
  ON public.analytics
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenants
      WHERE tenants.id = analytics.store_id
      AND tenants.owner_id = auth.uid()
    )
  );
