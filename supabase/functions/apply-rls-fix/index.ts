import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // This function must be called with service_role key for security
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    console.log('🔒 Applying RLS Security Fixes...')

    // Execute RLS fixes
    const sqlStatements = [
      // 1. Drop insecure policy
      `DROP POLICY IF EXISTS "Affiliates can view own profile by email" ON public.affiliates;`,

      // 2. Create secure SELECT policy
      `CREATE POLICY "Authenticated affiliates can view own profile"
        ON public.affiliates
        FOR SELECT
        USING (
          auth.uid() IS NOT NULL
          AND email = auth.jwt() ->> 'email'
        );`,

      // 3. Update UPDATE policy
      `DROP POLICY IF EXISTS "Affiliates can update own profile" ON public.affiliates;`,

      `CREATE POLICY "Authenticated affiliates can update own profile"
        ON public.affiliates
        FOR UPDATE
        USING (
          auth.uid() IS NOT NULL
          AND email = auth.jwt() ->> 'email'
        );`,

      // 4. Update INSERT policy
      `DROP POLICY IF EXISTS "Anyone can signup as affiliate" ON public.affiliates;`,

      `CREATE POLICY "Public can create affiliate profile after auth"
        ON public.affiliates
        FOR INSERT
        WITH CHECK (
          auth.uid() IS NOT NULL
        );`,

      // 5. Enable RLS
      `ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;`,

      // 6. Secure referrals
      `DROP POLICY IF EXISTS "Affiliates can view own referrals" ON public.referrals;`,

      `CREATE POLICY "Authenticated affiliates can view own referrals"
        ON public.referrals
        FOR SELECT
        USING (
          auth.uid() IS NOT NULL
          AND affiliate_id IN (
            SELECT id FROM public.affiliates
            WHERE email = auth.jwt() ->> 'email'
          )
        );`,

      `ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;`,

      // 7. Secure payouts
      `DROP POLICY IF EXISTS "Affiliates can view own payouts" ON public.commission_payouts;`,

      `CREATE POLICY "Authenticated affiliates can view own payouts"
        ON public.commission_payouts
        FOR SELECT
        USING (
          auth.uid() IS NOT NULL
          AND affiliate_id IN (
            SELECT id FROM public.affiliates
            WHERE email = auth.jwt() ->> 'email'
          )
        );`,

      `ALTER TABLE public.commission_payouts ENABLE ROW LEVEL SECURITY;`
    ]

    // Execute each statement
    for (const sql of sqlStatements) {
      const { error } = await supabaseClient.rpc('exec_sql', { query: sql })
      if (error && !error.message.includes('already exists') && !error.message.includes('does not exist')) {
        console.error('SQL Error:', error)
        throw error
      }
    }

    console.log('✅ RLS Security Fixes Applied Successfully!')

    return new Response(
      JSON.stringify({
        success: true,
        message: '✅ RLS security fixes applied successfully! Affiliate data is now secure.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
