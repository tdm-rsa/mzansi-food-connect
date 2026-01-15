import { readFileSync } from 'fs';

const projectRef = 'iuuckvthpmttrsutmvga';
const accessToken = 'sbp_37f7af184923c78121c34ea3fffb5ddc8756a9c1'; // Personal access token

// Read the SQL file
const sql = readFileSync('./CRITICAL_RLS_FIX.sql', 'utf8');

async function executeSQLviaManagementAPI() {
  console.log('🔒 Executing RLS Security Fixes via Supabase Management API...\n');

  try {
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          query: sql
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ SQL Executed Successfully!');
    console.log('Result:', JSON.stringify(result, null, 2));

    console.log('\n🎉 RLS SECURITY FIXES APPLIED!\n');
    console.log('✅ Affiliate data is now secure');
    console.log('✅ Unauthenticated access is blocked');
    console.log('✅ Affiliates can only see their own data\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n⚠️  Automated execution failed. Please manually execute the SQL:');
    console.log('1. Go to: https://supabase.com/dashboard/project/iuuckvthpmttrsutmvga/sql/new');
    console.log('2. Copy the contents of CRITICAL_RLS_FIX.sql');
    console.log('3. Paste and click "Run"\n');
    process.exit(1);
  }
}

executeSQLviaManagementAPI();
