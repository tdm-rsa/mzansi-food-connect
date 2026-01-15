# 🚨 CRITICAL SECURITY AUDIT - MZANSI FOOD CONNECT

**Audit Date:** January 15, 2026
**Status:** 15 CRITICAL VULNERABILITIES FOUND
**Platform Risk Level:** CRITICAL - IMMEDIATE ACTION REQUIRED

---

## ⚠️ IMMEDIATE EMERGENCY ACTIONS REQUIRED

### 1. **EXPOSED PAYMENT KEYS** (CRITICAL)
**Your Yoco LIVE secret key is exposed in .env.local:**
- Secret Key: `sk_live_8b6c5680nmD8Ae6b21149a39eeb5`
- Public Key: `pk_live_6f1fc250jV0Ln7b8f824`

**IMMEDIATE ACTION:**
1. Go to Yoco dashboard RIGHT NOW
2. Rotate/regenerate these keys
3. Update keys in Supabase Edge Functions environment
4. Never commit .env.local to git

**Risk:** Anyone with these keys can process payments, refund money, access transaction history

---

### 2. **EXPOSED WHATSAPP CREDENTIALS** (CRITICAL)
**Your Ultramsg credentials are exposed:**
- Instance ID: `instance149315`
- Token: `ax6ijvrx2w0cbt53`
- Found in: `.env.local`, `ULTRAMSG_SETUP.md`

**IMMEDIATE ACTION:**
1. Regenerate credentials in Ultramsg dashboard
2. Remove from ULTRAMSG_SETUP.md
3. Update in Supabase Edge Functions

**Risk:** Anyone can send WhatsApp messages from your number, access message history

---

### 3. **WEAK ADMIN AUTHENTICATION** (CRITICAL)
**Admin credentials are exposed:**
- Username: `Bhutah`
- PIN: `271104` (only 6 digits)
- Found in: `.env.local`, code files

**Issues:**
- Simple 6-digit PIN (1 million combinations)
- No rate limiting - can brute force
- No audit logging
- Stored in plaintext

**Risk:** Admin impersonation, access to all vendor data, financial records

---

### 4. **BANK ACCOUNT NUMBERS IN EMAILS** (CRITICAL - POPIA VIOLATION)
**File:** `supabase/functions/request-affiliate-payout/index.ts`

Affiliate bank account numbers are sent in plaintext HTML emails:
```typescript
Bank: ${affiliate.bank_name}<br />
Account: ${affiliate.account_number}<br />
```

**Risk:** Email interception, POPIA violation, identity theft

---

### 5. **DATABASE RLS BYPASS** (CRITICAL)
**File:** `supabase/migrations/004_create_pending_orders_table.sql`

RLS policies contain `OR true` allowing anyone to access data:
```sql
USING (auth.uid() = user_id OR true)
```

**Risk:** Complete database exposure without authentication

---

## 📊 ALL 15 VULNERABILITIES

| # | Vulnerability | Severity | Files Affected |
|---|---|---|---|
| 1 | Exposed Yoco Live Keys | CRITICAL | .env.local |
| 2 | Exposed Ultramsg Credentials | CRITICAL | .env.local, ULTRAMSG_SETUP.md |
| 3 | Weak Admin Authentication | CRITICAL | AdminLogin.jsx, .env.local |
| 4 | Bank Details in Emails | CRITICAL | request-affiliate-payout function |
| 5 | RLS Policy Bypass (OR true) | CRITICAL | 004 migration |
| 6 | Webhook Secrets Plaintext | HIGH | tenants table, register-vendor-webhook |
| 7 | Console Logging Sensitive Data | HIGH | All edge functions |
| 8 | Client-Side Rate Limiting | HIGH | Login.jsx |
| 9 | Hardcoded Admin Email | MEDIUM | Multiple edge functions |
| 10 | Driver Phone Numbers Exposed | MEDIUM | orders table |
| 11 | Customer GPS Coordinates Stored | MEDIUM | orders table |
| 12 | Payment References in Logs | MEDIUM | Console logs |
| 13 | No Encryption for Bank Details | HIGH | affiliates table |
| 14 | Predictable Admin Pattern | MEDIUM | RLS policies |
| 15 | No Audit Logging (except affiliates) | HIGH | Platform-wide |

---

## 🔧 WHAT I'M FIXING NOW

I will fix all critical vulnerabilities in this order:

1. ✅ Fix RLS policies (remove OR true, add proper auth)
2. ✅ Encrypt bank account numbers
3. ✅ Remove bank details from payout emails
4. ✅ Fix admin authentication (stronger PIN, rate limiting, audit logging)
5. ✅ Encrypt webhook secrets
6. ✅ Remove all console.log() from edge functions
7. ✅ Add server-side rate limiting
8. ✅ Add audit logging for all sensitive operations
9. ✅ Fix hardcoded values (use environment variables)
10. ✅ Deploy all fixes to production

---

**CONTINUING WITH FIXES...**
