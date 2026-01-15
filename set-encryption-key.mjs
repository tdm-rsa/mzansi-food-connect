import { readFileSync } from 'fs';

const projectRef = 'iuuckvthpmttrsutmvga';
const accessToken = 'sbp_37f7af184923c78121c34ea3fffb5ddc8756a9c1';

// Secure encryption key (generated with: openssl rand -base64 32)
const encryptionKey = '2Pqr72tZ/eVcXdKCUKrboxk0opIIk7zlvU+SH5ZnZPQ=';

async function setEncryptionKey() {
  console.log('🔐 Setting database encryption key...\n');

  const sql = `ALTER DATABASE postgres SET app.encryption_key = '${encryptionKey}';`;

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
      throw new Error(`Failed to set encryption key: ${response.status}`);
    }

    console.log('✅ Encryption key set successfully!\n');
    console.log('🔑 Encryption Key (SAVE THIS SECURELY):');
    console.log(`   ${encryptionKey}\n`);
    console.log('⚠️  IMPORTANT: Save this key in your password manager!');
    console.log('   You need it to decrypt data later.\n');
    console.log('📝 Add to Supabase Edge Functions environment variables:');
    console.log('   APP_ENCRYPTION_KEY=' + encryptionKey);

  } catch (error) {
    console.error('❌ Failed to set encryption key:', error.message);
    console.log('\n⚠️  Manual setup required:');
    console.log('1. Go to: https://supabase.com/dashboard/project/iuuckvthpmttrsutmvga/sql/new');
    console.log(`2. Run: ALTER DATABASE postgres SET app.encryption_key = '${encryptionKey}';`);
    process.exit(1);
  }
}

setEncryptionKey();
