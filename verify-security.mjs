import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iuuckvthpmttrsutmvga.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dWNrdnRocG10dHJzdXRtdmdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY3NjM5MywiZXhwIjoyMDc3MjUyMzkzfQ.HWLmW3xUBo72AWOWFoAyS3xhMhMnXi5j-xAV21eYI2E';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifySecurityFixes() {
  console.log('🔍 Checking security fixes...\n');

  try {
    // Check 1: Does affiliate_audit_log table exist?
    const { data: auditTable, error: auditError } = await supabase
      .from('affiliate_audit_log')
      .select('id')
      .limit(0);

    if (auditError && auditError.code === '42P01') {
      console.log('❌ affiliate_audit_log table does NOT exist');
      console.log('   Migration has NOT been applied!\n');
      return false;
    } else {
      console.log('✅ affiliate_audit_log table exists');
    }

    // Check 2: Does auth_user_id column exist on affiliates?
    const { data: affiliates, error: affiliateError } = await supabase
      .from('affiliates')
      .select('id, email, auth_user_id, last_login_at')
      .limit(1);

    if (affiliateError) {
      if (affiliateError.message.includes('auth_user_id')) {
        console.log('❌ auth_user_id column does NOT exist on affiliates table');
        console.log('   Migration has NOT been applied!\n');
        return false;
      }
    } else {
      console.log('✅ auth_user_id column exists on affiliates table');
    }

    // Check 3: Test RLS policies (try to access without auth)
    const supabaseAnon = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dWNrdnRocG10dHJzdXRtdmdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NzYzOTMsImV4cCI6MjA3NzI1MjM5M30.hl4pWe8VRqPUSGiV4ihMPEUesUWfdm1KJL3uvUbtsM0');

    const { data: testData, error: testError } = await supabaseAnon
      .from('affiliates')
      .select('*')
      .limit(1);

    if (testData && testData.length > 0) {
      console.log('❌ CRITICAL: Unauthenticated users can still read affiliate data!');
      console.log('   RLS policies are NOT secure!');
      console.log('   Migration has NOT been applied properly!\n');
      return false;
    } else if (testError || (testData && testData.length === 0)) {
      console.log('✅ RLS policies are working - unauthenticated access blocked');
    }

    console.log('\n✅ All security fixes appear to be applied correctly!\n');
    return true;

  } catch (error) {
    console.error('❌ Error checking security:', error.message);
    return false;
  }
}

verifySecurityFixes();
