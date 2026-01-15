import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Connection string using session pooler (better for migrations)
const connectionString = 'postgresql://postgres.vusitlaqzlqspcrqzoxk:Thobeka100%40@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

async function deployMigration() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!');

    console.log('📖 Reading migration file...');
    const migrationPath = join(__dirname, 'supabase', 'migrations', '20260115080000_critical_security_fixes.sql');
    const sql = readFileSync(migrationPath, 'utf8');

    console.log('⚡ Executing migration...');
    console.log('This will:');
    console.log('  - Fix critical RLS policies');
    console.log('  - Require authentication for affiliate access');
    console.log('  - Add audit logging');
    console.log('  - Add security metadata');
    console.log('');

    // Execute the full migration
    await client.query(sql);

    console.log('✅ Migration deployed successfully!');
    console.log('');
    console.log('🔒 Security fixes applied:');
    console.log('  ✅ RLS policies now require authentication');
    console.log('  ✅ Audit logging enabled');
    console.log('  ✅ Encryption functions installed');
    console.log('  ✅ Security metadata tracking added');
    console.log('');
    console.log('⚠️  IMPORTANT: Old affiliate dashboard will no longer work!');
    console.log('   Affiliates must now use magic link authentication.');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.detail) console.error('Details:', error.detail);
    if (error.hint) console.error('Hint:', error.hint);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Disconnected from database');
  }
}

deployMigration();
