# 🚨 EMERGENCY SECURITY DEPLOYMENT GUIDE

**CRITICAL:** Your platform has exposed API keys and security vulnerabilities. Follow this guide IMMEDIATELY.

---

## ⚡ STEP 1: ROTATE ALL EXPOSED KEYS (DO THIS NOW)

### A. Rotate Yoco Payment Keys

**EXPOSED KEYS (COMPROMISED):**
- Public Key: `pk_live_6f1fc250jV0Ln7b8f824`
- Secret Key: `sk_live_8b6c5680nmD8Ae6b21149a39eeb5`

**ACTION:**
1. Go to: https://portal.yoco.com/online/api-keys
2. Click "Regenerate" for BOTH keys
3. Copy the NEW keys immediately (they won't show again)
4. Save them in a secure password manager

**DO NOT use the old keys anymore - they are compromised.**

---

### B. Rotate Ultramsg WhatsApp Credentials

**EXPOSED CREDENTIALS (COMPROMISED):**
- Instance ID: `instance149315`
- Token: `ax6ijvrx2w0cbt53`

**ACTION:**
1. Go to: https://ultramsg.com/
2. Generate new instance or regenerate token
3. Copy NEW credentials
4. Save them securely

---

### C. Change Admin PIN

**EXPOSED PIN (COMPROMISED):**
- Username: `Bhutah`
- PIN: `271104`

**ACTION:**
1. Generate a strong 8-12 digit PIN
2. Use random numbers (not birthday, phone, etc.)
3. Save it securely
4. Update in environment variables (see Step 2)

---

## ⚡ STEP 2: SET UP ENVIRONMENT VARIABLES PROPERLY

### Supabase Edge Functions Environment Variables

Go to: Supabase Dashboard → Edge Functions → Manage Secrets

**Set these variables:**

```bash
# CRITICAL - Use your NEW keys from Step 1
VITE_YOCO_SECRET_KEY=sk_live_YOUR_NEW_SECRET_KEY_HERE
VITE_YOCO_PUBLIC_KEY=pk_live_YOUR_NEW_PUBLIC_KEY_HERE

# WhatsApp (NEW credentials from Step 1)
VITE_ULTRAMSG_INSTANCE_ID=your_new_instance_id
VITE_ULTRAMSG_TOKEN=your_new_token

# Admin (NEW PIN from Step 1)
VITE_ADMIN_USERNAME=Bhutah
VITE_ADMIN_PIN=your_new_8_digit_pin

# Admin email
ADMIN_EMAIL=nqubeko377@gmail.com

# Supabase (keep existing)
SUPABASE_URL=https://iuuckvthpmttrsutmvga.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG... (your existing service role key)
SUPABASE_ANON_KEY=eyJhbG... (your existing anon key)

# Email (keep existing)
RESEND_API_KEY=your_resend_key

# Paystack (if you have it)
PAYSTACK_SECRET_KEY=your_paystack_secret

# Encryption key for database (GENERATE NEW)
# Use: openssl rand -base64 32
APP_ENCRYPTION_KEY=generate_random_32_char_key_here

# Domains (if using custom domains)
VITE_DOMAINS_API_KEY=your_domains_api_key
VITE_CLOUDFLARE_API_TOKEN=your_cloudflare_token
VITE_CLOUDFLARE_ZONE_ID=your_zone_id
```

---

## ⚡ STEP 3: REMOVE SECRETS FROM GIT

### A. Update .gitignore

Run these commands:

```bash
cd "C:\Users\thobe\OneDrive - University of Cape Town\MzanziFoodConnect\mzansi-food-connect"

# Add .env.local to gitignore
echo .env.local >> .gitignore
echo .env >> .gitignore
```

### B. Remove Exposed Secrets from Files

**Files to update:**

1. **ULTRAMSG_SETUP.md** - Remove lines 21-23 (credentials)
2. **.env.local** - DELETE this file completely (never commit it)
3. **ADMIN_DASHBOARD.md** - Remove admin credentials if present

### C. Clean Git History (CRITICAL)

**WARNING:** This rewrites git history. Do this carefully.

```bash
# Remove .env.local from git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.local" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (if you're the only developer)
git push origin --force --all
```

**NOTE:** If others use this repo, coordinate with them first.

---

## ⚡ STEP 4: DEPLOY SECURITY FIXES TO DATABASE

### A. Apply Security Migration

Go to: Supabase Dashboard → SQL Editor

Copy and paste the ENTIRE contents of:
```
supabase/migrations/20260115090000_platform_security_lockdown.sql
```

Click "Run".

### B. Set Encryption Key

Still in SQL Editor, run:

```sql
ALTER DATABASE postgres SET app.encryption_key = 'your_32_char_encryption_key_from_step_2';
```

### C. Verify RLS Policies

Run this to check:

```sql
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('pending_orders', 'affiliates', 'pending_payments', 'analytics')
ORDER BY tablename, policyname;
```

**Ensure NO policies contain `OR true` in the `qual` column.**

---

## ⚡ STEP 5: DEPLOY EDGE FUNCTION UPDATES

### Update Edge Function Files

I've already updated:
- `supabase/functions/request-affiliate-payout/index.ts` (bank details masked)

**Deploy the updated function:**

```bash
cd "C:\Users\thobe\OneDrive - University of Cape Town\MzansiFoodConnect\mzansi-food-connect"

npx supabase functions deploy request-affiliate-payout
```

---

## ⚡ STEP 6: DEPLOY APPLICATION CODE

### A. Commit Security Fixes

```bash
git add supabase/migrations/20260115090000_platform_security_lockdown.sql
git add supabase/functions/request-affiliate-payout/index.ts
git add .gitignore

git commit -m "CRITICAL SECURITY FIX: Platform-wide security lockdown

- Fixed RLS bypass vulnerabilities (removed OR true)
- Added encryption for sensitive data
- Masked bank details in emails (POPIA compliance)
- Added platform-wide audit logging
- Added rate limiting infrastructure
- Removed exposed API keys from codebase
- Added environment variable security

BREAKING: Requires new API keys and environment variables.
See EMERGENCY_SECURITY_DEPLOYMENT.md for setup instructions.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

git push
```

### B. Update Environment Variables in Production

**Vercel (if using):**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add/Update variables from Step 2
3. Redeploy

**Local Development:**
Create new `.env.local` file (NOT committed to git):

```bash
# .env.local (LOCAL DEVELOPMENT ONLY - NEVER COMMIT)

# Use TEST keys for local development
VITE_YOCO_PUBLIC_KEY=pk_test_YOUR_TEST_KEY
VITE_YOCO_SECRET_KEY=sk_test_YOUR_TEST_KEY

VITE_ULTRAMSG_INSTANCE_ID=instance_test
VITE_ULTRAMSG_TOKEN=test_token

VITE_ADMIN_USERNAME=Bhutah
VITE_ADMIN_PIN=12345678

VITE_SUPABASE_URL=https://iuuckvthpmttrsutmvga.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# ... other variables
```

---

## ⚡ STEP 7: VERIFY SECURITY

### A. Test RLS Policies

**Open Supabase SQL Editor and run:**

```sql
-- Try to access pending_orders without auth (should fail)
SELECT * FROM pending_orders;
```

**Expected:** Error: "permission denied for table pending_orders" or "no rows returned"

**If you see data:** RLS is NOT working - contact support immediately.

### B. Test Affiliate Authentication

1. Go to: https://your-domain.com/affiliate-dashboard
2. Try logging in with just an email (no password)
3. **Expected:** Should require magic link authentication
4. **If it lets you in:** Secure dashboard not deployed - check routing

### C. Test Admin Access

1. Go to: https://your-domain.com/admin
2. Try old PIN: `271104`
3. **Expected:** Should fail
4. Try new PIN from Step 1
5. **Expected:** Should succeed

---

## ⚡ STEP 8: MONITOR & ALERT

### Set Up Monitoring

1. **Check Audit Logs Daily:**
   ```sql
   SELECT * FROM platform_audit_log
   WHERE created_at > NOW() - INTERVAL '24 hours'
   ORDER BY created_at DESC;
   ```

2. **Check Failed Logins:**
   ```sql
   SELECT email, ip_address, COUNT(*) as failed_attempts
   FROM login_attempts
   WHERE success = false
   AND created_at > NOW() - INTERVAL '1 hour'
   GROUP BY email, ip_address
   HAVING COUNT(*) > 5;
   ```

3. **Check Admin Access:**
   ```sql
   SELECT * FROM admin_access_log
   WHERE created_at > NOW() - INTERVAL '24 hours'
   ORDER BY created_at DESC;
   ```

---

## ⚡ STEP 9: NOTIFY AFFILIATES (If Any)

**Email Template:**

```
Subject: Important: Security Update for Affiliate Dashboard

Dear Affiliate,

We've implemented important security improvements to protect your data.

WHAT CHANGED:
- Your dashboard now uses secure email verification (magic link)
- Your bank details are now encrypted
- We've added audit logging for compliance

WHAT YOU NEED TO DO:
1. Go to: https://your-domain.com/affiliate-dashboard
2. Enter your email
3. Check your email for a "magic link"
4. Click the link to log in securely

You'll need to do this every time you login (for security).

If you have questions, reply to this email.

Thank you,
Mzansi Food Connect Team
```

---

## ⚡ STEP 10: FINAL CHECKLIST

- [ ] Rotated Yoco keys
- [ ] Rotated Ultramsg credentials
- [ ] Changed admin PIN
- [ ] Set up all environment variables in Supabase
- [ ] Set encryption key in database
- [ ] Removed .env.local from git
- [ ] Updated .gitignore
- [ ] Deployed security migration to database
- [ ] Deployed updated edge functions
- [ ] Committed and pushed code changes
- [ ] Verified RLS policies working
- [ ] Verified affiliate auth requires magic link
- [ ] Verified admin access with new PIN
- [ ] Set up monitoring queries
- [ ] Notified affiliates (if any exist)

---

## 🆘 IF SOMETHING GOES WRONG

### Database Migration Fails

**Symptom:** Error when running migration SQL

**Fix:**
1. Check error message
2. If "function already exists", that's OK - continue
3. If "permission denied", use Supabase service role
4. Contact Supabase support if stuck

### Edge Functions Won't Deploy

**Symptom:** `npx supabase functions deploy` fails

**Fix:**
1. Check you're logged in: `npx supabase login`
2. Check project is linked: `npx supabase projects list`
3. Try: `npx supabase link --project-ref iuuckvthpmttrsutmvga`

### Application Won't Start

**Symptom:** Build errors or runtime errors

**Fix:**
1. Check `.env.local` has all required variables
2. Check variable names match exactly (VITE_ prefix)
3. Clear cache: Delete `node_modules`, run `npm install`
4. Check console for specific error messages

---

## 📞 EMERGENCY CONTACTS

- **Supabase Support:** https://supabase.com/support
- **Yoco Support:** support@yoco.com
- **This README:** If you're stuck, the security migration is safe to run multiple times

---

## ✅ YOU'RE SECURE WHEN:

1. ✅ Old API keys are rotated
2. ✅ .env.local is not in git
3. ✅ Database migration is applied
4. ✅ RLS test shows "permission denied"
5. ✅ Affiliates can't login with email-only
6. ✅ Bank details show ****1234 in emails

---

**REMEMBER:** Security is ongoing. Review these checklist steps monthly.

---

*Last Updated: 2026-01-15*
*Version: 1.0 - Emergency Security Lockdown*
