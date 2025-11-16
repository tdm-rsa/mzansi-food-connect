-- ========================================
-- CREATE TENANTS TABLE FROM SCRATCH
-- Run this in Supabase SQL Editor
-- ========================================

-- Create the tenants table
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Store/Business Info
    business_name TEXT,
    name TEXT,
    subdomain TEXT,
    slug TEXT UNIQUE,

    -- Contact Info
    owner_name TEXT,
    owner_email TEXT,
    contact_email TEXT,
    whatsapp_number TEXT,

    -- Status
    status TEXT DEFAULT 'active',
    is_open BOOLEAN DEFAULT true,

    -- Content
    banner_text TEXT,
    about_text TEXT,
    logo_url TEXT,
    template TEXT DEFAULT 'Modern Food',
    active_template TEXT DEFAULT 'Modern Food',

    -- Styling
    primary_color TEXT DEFAULT '#1e3a8a',
    secondary_color TEXT DEFAULT '#1e3a8a',

    -- Plan & Payment
    plan TEXT DEFAULT 'trial',
    plan_started_at TIMESTAMPTZ,
    plan_expires_at TIMESTAMPTZ,
    subscription_status TEXT DEFAULT 'active',
    payment_reference TEXT,

    -- Yoco Payment Keys
    yoco_public_key TEXT,
    yoco_secret_key TEXT,

    -- Banking (for future features)
    currency TEXT DEFAULT 'ZAR',
    email_notifications BOOLEAN DEFAULT true,
    bank_name TEXT,
    account_holder TEXT,
    account_number TEXT,
    account_type TEXT,
    branch_code TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own tenant
CREATE POLICY "Users can view own tenant"
ON public.tenants
FOR SELECT
USING (auth.uid() = owner_id);

-- Policy: Users can insert their own tenant
CREATE POLICY "Users can insert own tenant"
ON public.tenants
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- Policy: Users can update their own tenant
CREATE POLICY "Users can update own tenant"
ON public.tenants
FOR UPDATE
USING (auth.uid() = owner_id);

-- Policy: Allow public to read tenants (for customer stores)
CREATE POLICY "Public can view tenants"
ON public.tenants
FOR SELECT
USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tenants_owner_id ON public.tenants(owner_id);
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON public.tenants(subdomain);

-- Verify the table was created
SELECT 'tenants' AS table_name, COUNT(*) AS column_count
FROM information_schema.columns
WHERE table_name = 'tenants'
AND table_schema = 'public';

SELECT '✅ Tenants table created successfully!' AS status;
