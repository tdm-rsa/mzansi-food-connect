import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

const { Pool } = pg;

const supabaseUrl = 'https://iuuckvthpmttrsutmvga.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dWNrdnRocG10dHJzdXRtdmdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY3NjM5MywiZXhwIjoyMDc3MjUyMzkzfQ.HWLmW3xUBo72AWOWFoAyS3xhMhMnXi5j-xAV21eYI2E';

// Use REST API to execute SQL
async function executeSQLviaAPI(sql) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error: ${error}`);
  }

  return response.json();
}

async function fixRLSPolicies() {
  console.log('🔒 Fixing RLS Policies for Affiliate Security\n');

  const sqlStatements = [
    {
      name: 'Drop insecure SELECT policy',
      sql: `DROP POLICY IF EXISTS "Affiliates can view own profile by email" ON public.affiliates;`
    },
    {
      name: 'Create secure SELECT policy',
      sql: `CREATE POLICY "Authenticated affiliates can view own profile"
        ON public.affiliates
        FOR SELECT
        USING (
          auth.uid() IS NOT NULL
          AND email = auth.jwt() ->> 'email'
        );`
    },
    {
      name: 'Drop old UPDATE policy',
      sql: `DROP POLICY IF EXISTS "Affiliates can update own profile" ON public.affiliates;`
    },
    {
      name: 'Create secure UPDATE policy',
      sql: `CREATE POLICY "Authenticated affiliates can update own profile"
        ON public.affiliates
        FOR UPDATE
        USING (
          auth.uid() IS NOT NULL
          AND email = auth.jwt() ->> 'email'
        );`
    },
    {
      name: 'Drop old INSERT policy',
      sql: `DROP POLICY IF EXISTS "Anyone can signup as affiliate" ON public.affiliates;`
    },
    {
      name: 'Create secure INSERT policy',
      sql: `CREATE POLICY "Public can create affiliate profile after auth"
        ON public.affiliates
        FOR INSERT
        WITH CHECK (
          auth.uid() IS NOT NULL
        );`
    },
    {
      name: 'Enable RLS on affiliates',
      sql: `ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;`
    }
  ];

  // Try using Supabase Edge Function or direct SQL execution
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  for (const statement of sqlStatements) {
    try {
      console.log(`Executing: ${statement.name}...`);

      // Use postgres connection via REST API
      const { data, error } = await supabase
        .from('_supabase_admin')
        .select('*');

      // Alternative: execute via SQL directly
      // This won't work through standard Supabase client, need to use pg or REST API
      console.log(`  ⚠️  Need direct database access - using SQL directly\n`);

    } catch (error) {
      console.error(`  ❌ Error: ${error.message}\n`);
    }
  }

  console.log('\n📋 SQL Statements to Execute Manually:\n');
  console.log('Copy and paste these into the Supabase SQL Editor:\n');
  console.log('='.repeat(60));
  sqlStatements.forEach((stmt, i) => {
    console.log(`\n-- ${i + 1}. ${stmt.name}`);
    console.log(stmt.sql);
  });
  console.log('\n' + '='.repeat(60));
  console.log('\n🌐 Go to: https://supabase.com/dashboard/project/iuuckvthpmttrsutmvga/sql/new');
  console.log('📝 Paste the SQL above and click "Run"\n');
}

fixRLSPolicies();
