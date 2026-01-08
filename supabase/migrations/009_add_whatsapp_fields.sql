-- Add WhatsApp group URL and vendor WhatsApp number to tenants table

-- Add vendor_whatsapp_number column (for receiving order notifications)
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS vendor_whatsapp_number TEXT;

-- Add whatsapp_group_url column (for inviting customers to group)
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS whatsapp_group_url TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tenants_vendor_whatsapp ON public.tenants(vendor_whatsapp_number);

-- Add comment
COMMENT ON COLUMN public.tenants.vendor_whatsapp_number IS 'Vendor WhatsApp number for receiving order notifications (format: 27XXXXXXXXX)';
COMMENT ON COLUMN public.tenants.whatsapp_group_url IS 'WhatsApp group invite link for customers';
