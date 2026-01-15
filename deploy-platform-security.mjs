import { readFileSync } from 'fs';

const projectRef = 'iuuckvthpmttrsutmvga';
const accessToken = 'sbp_37f7af184923c78121c34ea3fffb5ddc8756a9c1';

// Read the SQL file
const sql = readFileSync('./supabase/migrations/20260115090000_platform_security_lockdown.sql', 'utf8');

async function deploySecurityMigration() {
  console.log('🔒 Deploying Platform-Wide Security Lockdown...\n');

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
      throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Platform Security Migration Deployed Successfully!\n');

    console.log('🔐 SECURITY FEATURES ENABLED:\n');
    console.log('  ✅ Fixed RLS bypass (removed OR true vulnerabilities)');
    console.log('  ✅ Encryption functions for sensitive data (AES-256)');
    console.log('  ✅ Platform-wide audit logging enabled');
    console.log('  ✅ Rate limiting infrastructure added');
    console.log('  ✅ Admin access logging enabled');
    console.log('  ✅ Secure views for encrypted data access');
    console.log('  ✅ RLS enabled on all sensitive tables\n');

    console.log('⚠️  IMPORTANT NEXT STEPS:\n');
    console.log('  1. Set encryption key in database:');
    console.log('     ALTER DATABASE postgres SET app.encryption_key = \'your-secret-key\';');
    console.log('  2. Rotate all API keys (Yoco, Ultramsg) - see EMERGENCY_SECURITY_DEPLOYMENT.md');
    console.log('  3. Update environment variables in Supabase Edge Functions');
    console.log('  4. Remove .env.local from git repository');
    console.log('  5. Test RLS policies are working\n');

    console.log('📋 Full deployment guide: EMERGENCY_SECURITY_DEPLOYMENT.md\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n⚠️  Manual deployment required:');
    console.log('1. Go to: https://supabase.com/dashboard/project/iuuckvthpmttrsutmvga/sql/new');
    console.log('2. Copy the contents of: supabase/migrations/20260115090000_platform_security_lockdown.sql');
    console.log('3. Paste and click "Run"\n');
    process.exit(1);
  }
}

deploySecurityMigration();
