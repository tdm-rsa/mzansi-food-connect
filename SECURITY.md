# Security Configuration

## 🔐 Required Environment Variables

### Production Deployment (Vercel)

Add these environment variables in **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**:

```bash
# Admin Access (REQUIRED - Set these to your own values!)
VITE_ADMIN_USERNAME=your_admin_username
VITE_ADMIN_PIN=your_secure_6digit_pin

# Supabase (Already configured)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Optional: Production URL
VITE_PRODUCTION_URL=https://mzansifoodconnect.com
```

### Local Development

Create `.env.local` file:

```bash
VITE_ADMIN_USERNAME=Bhutah
VITE_ADMIN_PIN=271104
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_PRODUCTION_URL=http://localhost:5173
```

## ⚠️ Security Checklist

### ✅ Already Protected:
- [x] Environment variables for sensitive data
- [x] `.env` files in `.gitignore`
- [x] Row Level Security (RLS) on Supabase tables
- [x] Admin credentials moved to environment variables
- [x] Debug console.log statements removed
- [x] Server-side filtering for realtime subscriptions
- [x] Supabase anon key (safe for client-side)

### 🔒 Additional Security Measures:

1. **Admin Credentials**
   - Change default admin username/PIN immediately
   - Use strong, unique values
   - Never commit credentials to Git

2. **Supabase Security**
   - Anon key is safe for client-side (RLS protects data)
   - Service role key should NEVER be in client code
   - Keep in Supabase Edge Functions only

3. **Payment Keys (Yoco)**
   - Vendors enter their own Yoco keys
   - Stored encrypted in Supabase
   - Never exposed in client code

4. **WhatsApp (Ultramsg)**
   - Credentials stored in Supabase Edge Function env vars
   - Not accessible from client-side
   - Calls go through secure edge function

## 🚨 What NOT to Do:

❌ Never commit `.env` or `.env.local` files
❌ Never hardcode secrets in source code
❌ Never expose service role keys client-side
❌ Never log sensitive data (passwords, tokens, keys)
❌ Never disable RLS without good reason

## ✅ What TO Do:

✅ Use environment variables for all secrets
✅ Keep Supabase RLS policies enabled
✅ Validate user inputs
✅ Use HTTPS in production
✅ Rotate admin credentials regularly
✅ Monitor Supabase logs for suspicious activity

## 📝 Supabase Environment Variables (Edge Functions)

In **Supabase Dashboard** → **Project Settings** → **Edge Functions** → **Environment Variables**:

```bash
VITE_ULTRAMSG_INSTANCE_ID=instance149315
VITE_ULTRAMSG_TOKEN=your_token_here
```

## 🔍 Security Audit

Last updated: January 2026

- Admin credentials: ✅ Secured via environment variables
- Database: ✅ RLS enabled on all tables
- API keys: ✅ Properly configured
- Console logs: ✅ Sensitive data removed
- Git history: ⚠️ May contain old secrets (consider rotating)
