import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iuuckvthpmttrsutmvga.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dWNrdnRocG10dHJzdXRtdmdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY3NjM5MywiZXhwIjoyMDc3MjUyMzkzfQ.HWLmW3xUBo72AWOWFoAyS3xhMhMnXi5j-xAV21eYI2E';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function invokeRLSFix() {
  console.log('🚀 Invoking RLS fix edge function...\n');

  try {
    const { data, error } = await supabase.functions.invoke('apply-rls-fix', {
      body: {}
    });

    if (error) {
      console.error('❌ Error invoking function:', error);
      process.exit(1);
    }

    console.log('✅ Response:', data);

    if (data.success) {
      console.log('\n🎉 RLS SECURITY FIXES APPLIED SUCCESSFULLY!\n');
      console.log('Your affiliate data is now secure.');
    } else {
      console.log('\n❌ Function returned error:', data.error);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

invokeRLSFix();
