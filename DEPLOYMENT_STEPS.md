# Quick Deployment Steps

## Your app is running locally at: http://localhost:5174

---

## To Deploy to Production:

### 1. Update Supabase Database (2 minutes)
```sql
-- Go to: https://supabase.com/dashboard/project/iuuckvthpmttrsutmvga/sql
-- Run this SQL:

ALTER TABLE stores
RENAME COLUMN paystack_public_key TO yoco_public_key;

ALTER TABLE stores
RENAME COLUMN paystack_secret_key TO yoco_secret_key;
```

### 2. Deploy Webhook (3 minutes)
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref iuuckvthpmttrsutmvga

# Deploy webhook
supabase functions deploy yoco-webhook

# Set secret key
supabase secrets set YOCO_SECRET_KEY=sk_live_8b6c5680nmD8Ae6b21149a39eeb5
```

### 3. Configure Yoco Webhook (2 minutes)
- Go to: https://portal.yoco.com/
- Settings → Developers → Webhooks
- Add webhook URL: `https://iuuckvthpmttrsutmvga.supabase.co/functions/v1/yoco-webhook`
- Select events: payment.succeeded, subscription.created, subscription.cancelled

### 4. Update Vercel (2 minutes)
- Go to: https://vercel.com/dashboard
- Your project → Settings → Environment Variables
- Add:
  - `VITE_YOCO_PUBLIC_KEY` = `pk_live_6f1fc250jV0Ln7b8f824`
  - `VITE_YOCO_SECRET_KEY` = `sk_live_8b6c5680nmD8Ae6b21149a39eeb5`

### 5. Deploy Code (1 minute)
```bash
git add .
git commit -m "Migrate to Yoco payment integration"
git push origin main
```

---

## That's it! 🎉

Your app will automatically deploy to Vercel and be live with Yoco payments!

**See [YOCO_MIGRATION_GUIDE.md](YOCO_MIGRATION_GUIDE.md) for detailed docs.**
