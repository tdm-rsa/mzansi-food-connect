import pg from 'pg';

const { Client } = pg;

// Try direct connection instead of pooler
const connectionString = 'postgresql://postgres:Thobeka100%40@db.iuuckvthpmttrsutmvga.supabase.co:5432/postgres';

async function applyRLSFix() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('🔒 Applying RLS security fixes...\n');

    // 1. Drop insecure policy
    console.log('1️⃣  Dropping insecure policy...');
    await client.query(`
      DROP POLICY IF EXISTS "Affiliates can view own profile by email" ON public.affiliates;
    `);
    console.log('   ✅ Insecure policy dropped\n');

    // 2. Create secure SELECT policy
    console.log('2️⃣  Creating secure SELECT policy...');
    await client.query(`
      CREATE POLICY "Authenticated affiliates can view own profile"
        ON public.affiliates
        FOR SELECT
        USING (
          auth.uid() IS NOT NULL
          AND email = auth.jwt() ->> 'email'
        );
    `);
    console.log('   ✅ Secure SELECT policy created\n');

    // 3. Update UPDATE policy
    console.log('3️⃣  Updating UPDATE policy...');
    await client.query(`
      DROP POLICY IF EXISTS "Affiliates can update own profile" ON public.affiliates;
    `);
    await client.query(`
      CREATE POLICY "Authenticated affiliates can update own profile"
        ON public.affiliates
        FOR UPDATE
        USING (
          auth.uid() IS NOT NULL
          AND email = auth.jwt() ->> 'email'
        );
    `);
    console.log('   ✅ Secure UPDATE policy created\n');

    // 4. Update INSERT policy
    console.log('4️⃣  Updating INSERT policy...');
    await client.query(`
      DROP POLICY IF EXISTS "Anyone can signup as affiliate" ON public.affiliates;
    `);
    await client.query(`
      CREATE POLICY "Public can create affiliate profile after auth"
        ON public.affiliates
        FOR INSERT
        WITH CHECK (
          auth.uid() IS NOT NULL
        );
    `);
    console.log('   ✅ Secure INSERT policy created\n');

    // 5. Ensure RLS is enabled
    console.log('5️⃣  Ensuring RLS is enabled...');
    await client.query(`
      ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
    `);
    console.log('   ✅ RLS enabled\n');

    // 6. Fix referrals table
    console.log('6️⃣  Securing referrals table...');
    await client.query(`
      DROP POLICY IF EXISTS "Affiliates can view own referrals" ON public.referrals;
    `);
    await client.query(`
      CREATE POLICY "Authenticated affiliates can view own referrals"
        ON public.referrals
        FOR SELECT
        USING (
          auth.uid() IS NOT NULL
          AND affiliate_id IN (
            SELECT id FROM public.affiliates
            WHERE email = auth.jwt() ->> 'email'
          )
        );
    `);
    console.log('   ✅ Referrals table secured\n');

    // 7. Fix commission_payouts table
    console.log('7️⃣  Securing commission_payouts table...');
    await client.query(`
      DROP POLICY IF EXISTS "Affiliates can view own payouts" ON public.commission_payouts;
    `);
    await client.query(`
      CREATE POLICY "Authenticated affiliates can view own payouts"
        ON public.commission_payouts
        FOR SELECT
        USING (
          auth.uid() IS NOT NULL
          AND affiliate_id IN (
            SELECT id FROM public.affiliates
            WHERE email = auth.jwt() ->> 'email'
          )
        );
    `);
    console.log('   ✅ Commission payouts table secured\n');

    console.log('✅ RLS SECURITY FIXES APPLIED SUCCESSFULLY!\n');
    console.log('🔒 The database is now secure:');
    console.log('   - Unauthenticated users CANNOT read affiliate data');
    console.log('   - Affiliates can only see their own data');
    console.log('   - Authentication is REQUIRED for all access\n');

  } catch (error) {
    console.error('❌ Error applying RLS fixes:', error.message);
    if (error.detail) console.error('   Details:', error.detail);
    if (error.hint) console.error('   Hint:', error.hint);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Disconnected');
  }
}

applyRLSFix();
