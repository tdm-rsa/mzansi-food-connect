# Custom Domain Reselling Setup Guide

## ✅ What's Been Implemented

Premium customers can now claim their own custom .co.za domains directly from Settings:

1. **Check Availability** → Customer enters desired domain name
2. **Claim Domain** → System auto-registers via Domains.co.za API
3. **Auto-configure DNS** → Cloudflare sets up DNS automatically
4. **Live in 24 hours** → Domain points to customer's store

---

## 📋 Setup Steps

### Step 1: Run Database Migration

1. Go to your Supabase dashboard
2. Click **SQL Editor**
3. Open the file `ADD_CUSTOM_DOMAIN_COLUMNS.sql`
4. Copy and paste the SQL into the editor
5. Click **Run**

This adds these columns to your `stores` table:
- `custom_domain` - Stores the domain (e.g., "mykfcsoweto.co.za")
- `domain_status` - Status: pending, active, failed
- `domain_registered_at` - Registration timestamp

---

### Step 2: Sign Up for Domains.co.za Reseller

1. Go to https://www.domains.co.za/domain-reseller
2. Click **"Become a Reseller"**
3. Complete registration (FREE to sign up)
4. Login to your reseller panel at https://cp.resellerpanel.co.za/

---

### Step 3: Add Credits to Reseller Account

1. In the reseller panel, go to **Billing**
2. Add funds to your account
3. Each .co.za domain costs **R79/year**
4. Start with R500 (enough for 6 domains)

**Pricing Strategy:**
- Your cost: R79/year per domain
- Premium plan: R300/month (domain included FREE)
- You absorb R79/year cost (R6.58/month)
- Makes Premium plan more attractive

---

### Step 4: Get API Credentials

1. In reseller panel, go to **Settings** → **API Access**
2. Generate API credentials
3. Copy your:
   - Username (or API key)
   - Password (or API token)

---

### Step 5: Sign Up for Cloudflare (FREE)

1. Go to https://cloudflare.com/
2. Sign up for a free account
3. Add your main domain (e.g., `mzansifoodconnect.co.za`)
4. Follow Cloudflare's nameserver setup instructions
5. Wait for domain to become active (5 minutes - 24 hours)

---

### Step 6: Get Cloudflare API Credentials

1. Login to Cloudflare dashboard
2. Go to **My Profile** → **API Tokens**
3. Click **Create Token**
4. Use template: **Edit Zone DNS**
5. Set permissions:
   - Zone → DNS → Edit
   - Zone → Zone → Read
6. Set zone resources: **Include → Specific zone → Your domain**
7. Create token and **copy it** (you won't see it again!)

---

### Step 7: Get Cloudflare Zone ID

1. In Cloudflare dashboard, click on your domain
2. Scroll down on the **Overview** page (right sidebar)
3. Copy the **Zone ID**

---

### Step 8: Configure Your App

1. Open `.env.local` file in your project
2. Add your credentials:

```env
# Domains.co.za Reseller API
VITE_DOMAINS_USERNAME=your_username_here
VITE_DOMAINS_PASSWORD=your_password_here

# Cloudflare DNS API
VITE_CLOUDFLARE_API_TOKEN=your_cloudflare_token_here
VITE_CLOUDFLARE_ZONE_ID=your_zone_id_here
```

3. Save the file

---

### Step 9: Restart Your App

```bash
# Stop dev server (Ctrl+C)
# Restart:
npm run dev
```

---

## 🎉 Testing

### Test the Complete Flow

1. **Upgrade test account to Premium**
   - Login to your dashboard
   - Go to Settings
   - Click "Upgrade to Premium" and complete payment

2. **Access Custom Domain section**
   - Go to Settings
   - Scroll to "🌍 Custom Domain" section (only visible for Premium)

3. **Check domain availability**
   - Enter a test domain (e.g., "myteststore")
   - Click "Check Availability"
   - Should show "✅ myteststore.co.za is available!"

4. **Claim domain**
   - Click "Claim Domain (FREE)"
   - Wait for confirmation
   - Should see: "🎉 myteststore.co.za claimed! Live within 24 hours"

5. **Verify in database**
   - Go to Supabase → Table Editor → stores
   - Find your store record
   - Check that `custom_domain`, `domain_status`, and `domain_registered_at` are populated

6. **Verify in Domains.co.za**
   - Login to reseller panel
   - Go to **Domains** → **My Domains**
   - Your test domain should appear there

7. **Verify in Cloudflare**
   - Go to Cloudflare dashboard → DNS
   - Should see a new CNAME record for the domain

8. **Test domain access (after 24 hours)**
   - Visit `myteststore.co.za` in browser
   - Should redirect to customer's store

---

## 💰 Costs & Revenue

### Your Costs
| Item | Cost | Frequency |
|------|------|-----------|
| Domains.co.za reseller | R0 | One-time (FREE) |
| .co.za domain | R79 | Per domain/year |
| Cloudflare | R0 | Forever (FREE) |

### Revenue Model

**Option A: Included in Premium (Current)**
- Premium: R300/month
- Domain included FREE
- You absorb R79/year (R6.58/month)
- **Net revenue:** R293.42/month per Premium customer

**Option B: Add-on Fee**
- Premium: R300/month
- Custom domain: +R15/month
- Customer pays R315/month total
- **Net revenue:** R308.42/month per Premium customer

---

## 🔒 Security

✅ All credentials stored in `.env.local` (not committed to git)
✅ Cloudflare provides FREE SSL certificates
✅ Domain API uses JWT authentication
✅ Supabase RLS policies protect domain data

---

## 📊 Monitoring

### Check Domain Status

Premium customers can see their domain status in Settings:
- 🟢 **Live** - Domain is active and working
- 🟡 **Pending** - Waiting for DNS propagation (up to 24 hours)
- 🔴 **Failed** - Registration or DNS configuration failed

### Admin Monitoring

Query domains in Supabase:

```sql
-- All claimed domains
SELECT
  name AS store_name,
  custom_domain,
  domain_status,
  domain_registered_at
FROM stores
WHERE custom_domain IS NOT NULL
ORDER BY domain_registered_at DESC;

-- Pending domains (registered >24 hours ago)
SELECT *
FROM stores
WHERE domain_status = 'pending'
  AND domain_registered_at < NOW() - INTERVAL '24 hours';
```

---

## ❓ Troubleshooting

### "Domain API credentials not configured"

- Check `.env.local` has correct credentials
- Restart dev server after adding credentials

### "Insufficient credits in domain reseller account"

- Login to Domains.co.za reseller panel
- Add more funds (R79 per domain)

### "Cloudflare credentials not configured"

- Check `.env.local` has Cloudflare token and zone ID
- Verify token has DNS Edit permissions
- Restart dev server

### Domain shows "pending" for more than 24 hours

- Check Cloudflare DNS records
- Verify domain was registered in Domains.co.za panel
- Check domain registrar nameservers point to Cloudflare

### Customer can't access domain

- Wait full 24 hours for DNS propagation
- Clear DNS cache: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)
- Check domain points to correct CNAME in Cloudflare

---

## 🚀 Next Steps

### Future Enhancements

1. **Email notifications**
   - Email customer when domain is claimed
   - Email when domain goes live

2. **Domain management**
   - Allow customers to change domain
   - Auto-renew domains annually
   - Domain transfer functionality

3. **Analytics**
   - Track domain performance
   - Monitor traffic by domain
   - Domain-specific analytics

4. **Automated renewals**
   - Auto-renew domains before expiry
   - Email reminders 30 days before expiry
   - Handle renewal payments

---

## 📞 Support

### Domains.co.za Support
- Email: support@domains.co.za
- Reseller portal: https://cp.resellerpanel.co.za/
- API docs: https://docs.domains.co.za/

### Cloudflare Support
- Community: https://community.cloudflare.com/
- Docs: https://developers.cloudflare.com/dns/

---

**Ready to launch!** 🎉

Once you complete all setup steps, Premium customers can claim their custom domains instantly from the Settings page.
