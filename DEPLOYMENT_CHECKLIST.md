# Deployment Checklist

## ✅ Pre-Deployment (Do This First)

### 1. Database Setup
- [ ] Run `ADD_PAYSTACK_COLUMNS.sql` in Supabase SQL Editor
- [ ] Verify `stores` table has columns:
  - `paystack_public_key`
  - `paystack_secret_key`
  - `custom_domain`
  - `domain_status`
  - `domain_registered_at`

### 2. Paystack Setup
- [ ] Create Paystack account at https://dashboard.paystack.com/
- [ ] Create payment page for **Pro** plan (R150/month recurring)
- [ ] Create payment page for **Premium** plan (R300/month recurring)
- [ ] Copy payment page URLs
- [ ] Update URLs in `src/App.jsx` (lines ~1980-2010)

### 3. Environment Variables
- [ ] `.env.local` has all required variables:
  ```env
  VITE_ULTRAMSG_INSTANCE_ID=instance149315
  VITE_ULTRAMSG_TOKEN=ax6ijvrx2w0cbt53
  VITE_DOMAINS_USERNAME=nqubeko377@gmail.com
  VITE_DOMAINS_PASSWORD=f905d34c97a90fe5e8aee3050edb2cdb
  ```

### 4. Supabase Functions
- [ ] Install Supabase CLI: `npm install -g supabase`
- [ ] Login: `supabase login`
- [ ] Link project: `supabase link --project-ref YOUR_PROJECT_REF`
- [ ] Deploy webhook: `supabase functions deploy paystack-webhook`
- [ ] Set secret: `supabase secrets set PAYSTACK_SECRET_KEY=sk_live_xxx`

### 5. Paystack Webhook Configuration
- [ ] Go to Paystack Dashboard → Settings → Webhooks
- [ ] Add URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/paystack-webhook`
- [ ] Select events:
  - charge.success
  - subscription.create
  - subscription.disable

---

## 🚀 Deployment Options

### Option A: Vercel (Recommended)

1. **Push to GitHub:**
```bash
git add .
git commit -m "Ready for deployment"
git push origin master
```

2. **Deploy to Vercel:**
   - Go to https://vercel.com/
   - Click "Import Project"
   - Connect GitHub repo
   - Framework: **Vite**
   - Root directory: `./`
   - Build command: `npm run build`
   - Output directory: `dist`

3. **Add Environment Variables in Vercel:**
   - Settings → Environment Variables
   - Add all variables from `.env.local`
   - **DO NOT** add VITE_DOMAINS credentials (domain feature not production-ready)

4. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Get production URL (e.g., `mzansi-food-connect.vercel.app`)

### Option B: Netlify

1. **Push to GitHub** (same as above)

2. **Deploy to Netlify:**
   - Go to https://netlify.com/
   - Click "Add new site" → "Import an existing project"
   - Connect GitHub repo
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Add Environment Variables:**
   - Site settings → Environment variables
   - Add all from `.env.local` (except VITE_DOMAINS_*)

4. **Deploy:**
   - Click "Deploy"
   - Get production URL

---

## 📝 Post-Deployment

### 1. Test Subscription Flow
- [ ] Go to your deployed site
- [ ] Create test account
- [ ] Click "Upgrade to Pro"
- [ ] Complete payment with test card:
  - Card: 5060 6666 6666 6666
  - CVV: 123
  - Expiry: 12/34
- [ ] Verify plan upgraded in Supabase
- [ ] Check webhook logs: `supabase functions logs paystack-webhook`

### 2. Test Customer Payment Flow
- [ ] Login to vendor dashboard
- [ ] Go to Settings → Paystack Integration
- [ ] Enter test keys:
  - Public: pk_test_xxx (from Paystack dashboard)
  - Secret: sk_test_xxx (from Paystack dashboard)
- [ ] Save keys
- [ ] Visit storefront
- [ ] Add items to cart
- [ ] Checkout with test card
- [ ] Verify order created
- [ ] Check WhatsApp notification sent

### 3. Switch to Live Mode (When Ready)
- [ ] Change Paystack payment pages to live mode
- [ ] Update Supabase secret to live key: `sk_live_xxx`
- [ ] Vendors update their keys to live keys (pk_live_xxx, sk_live_xxx)
- [ ] Test with real card (small amount)

---

## 🔧 Configuration Files

### vite.config.js (Already configured)
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/domains': {
        target: 'https://api.domains.co.za',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/domains/, '/api'),
      }
    }
  }
})
```

### package.json (Verify scripts)
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

---

## 🐛 Common Issues & Solutions

### Build fails with "module not found"
```bash
npm install
npm run build
```

### Environment variables not working in production
- Ensure all variables start with `VITE_`
- Re-add in Vercel/Netlify dashboard
- Redeploy

### Payments not working
- Check Paystack dashboard for test vs live mode
- Verify webhook URL is correct
- Check Supabase function logs

### WhatsApp not sending
- Verify Ultramsg credentials in environment variables
- Check Ultramsg dashboard - is instance still connected?
- Verify phone number format (27XXXXXXXXX)

---

## 📊 Monitoring

### Check Supabase Logs
```bash
supabase functions logs paystack-webhook
```

### Check Paystack Dashboard
- Dashboard → Transactions
- Check successful payments
- Verify webhook deliveries

### Check Ultramsg Dashboard
- Login to https://ultramsg.com/
- Check message history
- Verify instance is connected

---

## 🎯 Success Criteria

Your app is ready when:
- [ ] Landing page loads correctly
- [ ] Users can sign up and create stores
- [ ] Vendors can upgrade to Pro/Premium
- [ ] Plan upgrades work automatically via webhook
- [ ] Vendors can add menu items
- [ ] Customers can browse stores and add to cart
- [ ] Checkout works with Paystack
- [ ] Orders appear in vendor dashboard
- [ ] WhatsApp notifications send automatically
- [ ] Order status updates work (confirm → ready → fetched)

---

## 🚀 You're Ready!

Once all checkboxes are ticked, your app is production-ready!

**Next steps:**
1. Deploy to Vercel/Netlify
2. Get first vendor to test
3. Collect feedback
4. Iterate and improve

Good luck! 🎉
