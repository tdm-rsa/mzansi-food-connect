# Subdomain Setup Guide

Your platform now supports TRUE SUBDOMAINS! Each vendor can have their own subdomain like `joeskfc.mzansifoodconnect.com`.

## 🎯 How It Works

### Before (Path-Based):
```
mzansifoodconnect.com/store/joeskfc
mzansifoodconnect.com/store/mykfcsoweto
```

### After (Subdomain):
```
joeskfc.mzansifoodconnect.com
mykfcsoweto.mzansifoodconnect.com
```

**Backwards Compatible**: Path-based URLs still work!

---

## 📋 Deployment Steps

### Step 1: Buy Your Domain

Purchase a custom domain for your SaaS platform:

**Recommended:**
- `.com` domain: `mzansifoodconnect.com` (International, $12/year)
- `.co.za` domain: `mzansifoodconnect.co.za` (South African, R79/year)

**Where to Buy:**
- domains.co.za (SA domains)
- Namecheap.com (International)
- GoDaddy.com
- Google Domains

---

### Step 2: Add Domain to Vercel

1. Go to https://vercel.com/dashboard
2. Select your project: `mzansi-food-connect`
3. Go to **Settings** → **Domains**
4. Add your main domain:
   ```
   mzansifoodconnect.com
   ```
5. Add `www` subdomain:
   ```
   www.mzansifoodconnect.com
   ```
6. Add **WILDCARD** subdomain (THIS IS CRITICAL):
   ```
   *.mzansifoodconnect.com
   ```

---

### Step 3: Configure DNS Records

Vercel will show you DNS records to add. Go to your domain registrar's DNS settings and add these records:

#### A Records (for main domain):
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600
```

#### CNAME Records (for www and wildcard):
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600

Type: CNAME
Name: *
Value: cname.vercel-dns.com
TTL: 3600
```

**⚠️ IMPORTANT:** The wildcard record (`*`) is essential for subdomains to work!

---

### Step 4: Wait for DNS Propagation

- DNS changes take 24-48 hours to propagate globally
- Usually works in 1-2 hours
- Test using: https://dnschecker.org

---

### Step 5: Verify SSL Certificates

Vercel automatically provisions SSL certificates for:
- Main domain: `mzansifoodconnect.com`
- www subdomain: `www.mzansifoodconnect.com`
- Wildcard subdomains: `*.mzansifoodconnect.com`

Check in Vercel dashboard under Settings → Domains - all should show "Valid Configuration".

---

## 🧪 Testing Subdomains

### Local Development (won't work with real subdomains):

Test with path-based URLs during development:
```
http://localhost:5173/store/joeskfc
```

### Production Testing:

After DNS is configured, test these URLs:

**Main Platform:**
```
https://mzansifoodconnect.com → Dashboard/Landing
https://mzansifoodconnect.com/store/joeskfc → Store (path-based)
```

**Subdomains:**
```
https://joeskfc.mzansifoodconnect.com → Store (subdomain)
https://joeskfc.mzansifoodconnect.com/checkout → Checkout
https://joeskfc.mzansifoodconnect.com/queue → Live Queue
```

---

## 🔧 How the Code Works

### Subdomain Detection (src/utils/subdomain.js)

```javascript
getSubdomain() // Extracts subdomain from URL
isSubdomainMode() // Checks if on subdomain
buildStoreUrl(slug) // Builds correct URL for store
```

### Routing Logic (src/main.jsx)

**On Subdomain (joeskfc.mzansifoodconnect.com):**
- `/` → Store home
- `/checkout` → Checkout page
- `/queue` → Live queue

**On Main Domain (mzansifoodconnect.com):**
- `/` → Owner dashboard
- `/landing` → Landing page
- `/store/:slug` → Store (path-based)
- `/store/:slug/checkout` → Checkout (path-based)

### Store Loading (CustomerStore.jsx, Checkout.jsx, LiveQueue.jsx)

All components now check for subdomain FIRST, then fall back to path param:

```javascript
const { slug: pathSlug } = useParams();
const subdomainSlug = getSubdomain();
const slug = subdomainSlug || pathSlug; // Priority: subdomain > path
```

---

## ✅ Benefits of Subdomains

1. **Professional URLs**: `joeskfc.mzansifoodconnect.com` vs `/store/joeskfc`
2. **Better Branding**: Each vendor feels like they own their domain
3. **SEO Boost**: Subdomains are indexed separately by Google
4. **Easier Sharing**: Cleaner links to share on WhatsApp/social media
5. **Pro/Premium Value**: Justifies higher pricing tiers

---

## 🎁 Pricing Strategy

### Starter Plan (FREE):
- Path-based URL only: `mzansifoodconnect.com/store/joeskfc`

### Pro Plan (R150/month):
- **Subdomain included**: `joeskfc.mzansifoodconnect.com`
- Everything in Starter
- Unlimited products
- Basic analytics

### Premium Plan (R300/month - COMING SOON):
- **Custom domain**: `joeskfc.co.za` (their own domain)
- Everything in Pro
- Advanced analytics
- Custom branding

---

## 🚨 Important Notes

1. **Wildcard DNS is Required**: Without `*.yourdomain.com`, subdomains won't work
2. **SSL Auto-Configured**: Vercel handles HTTPS for all subdomains automatically
3. **Backwards Compatible**: Path-based URLs (`/store/:slug`) still work
4. **Case Insensitive**: Slugs are lowercase (enforced in database)
5. **Reserved Subdomains**: `www`, `app`, `admin` are ignored (treated as main domain)

---

## 📊 Monitoring Subdomains

### Check Active Stores with Subdomains:

```sql
SELECT
  name,
  slug,
  plan,
  CASE
    WHEN plan IN ('pro', 'premium')
    THEN CONCAT(slug, '.mzansifoodconnect.com')
    ELSE CONCAT('mzansifoodconnect.com/store/', slug)
  END as store_url
FROM stores
WHERE plan_status = 'active'
ORDER BY created_at DESC;
```

---

## 🐛 Troubleshooting

### Issue: Subdomain shows "Page Not Found"

**Solutions:**
1. Check DNS: Verify `*` CNAME record is added
2. Check Vercel: Verify `*.yourdomain.com` is added in Domains settings
3. Wait: DNS can take up to 48 hours
4. Clear cache: Try incognito mode

### Issue: SSL Certificate Error

**Solutions:**
1. Wait 5-10 minutes after adding domain (Vercel needs to provision cert)
2. Check Vercel dashboard - cert should show "Valid"
3. Force refresh: Settings → Domains → Click domain → Refresh

### Issue: Subdomain redirects to main site

**Solutions:**
1. Check wildcard is configured in Vercel (`*.yourdomain.com`)
2. Verify DNS `*` CNAME record points to `cname.vercel-dns.com`
3. Check browser cache - clear and retry

---

## 🎉 You're Ready!

Once DNS is configured and propagated, vendors can access their stores via:
- Subdomain: `joeskfc.mzansifoodconnect.com` (Pro plan)
- Path: `mzansifoodconnect.com/store/joeskfc` (Starter plan)

Both work simultaneously!
