-- Add webhook columns to tenants table for per-vendor webhook management
-- This allows each vendor to have their own Yoco webhook registered

-- Add webhook secret column (stores the whsec_ value from Yoco)
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS yoco_webhook_secret TEXT;

-- Add webhook ID column (stores the webhook subscription ID from Yoco)
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS yoco_webhook_id TEXT;

-- Add index for faster webhook lookups
CREATE INDEX IF NOT EXISTS idx_tenants_webhook_id
ON public.tenants(yoco_webhook_id);

COMMENT ON COLUMN public.tenants.yoco_webhook_secret IS 'Yoco webhook secret (whsec_xxx) for signature verification';
COMMENT ON COLUMN public.tenants.yoco_webhook_id IS 'Yoco webhook subscription ID for management';
