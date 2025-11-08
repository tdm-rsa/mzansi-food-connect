# Domains.co.za DNS Configuration Guide

Complete guide for configuring your domains.co.za domain with Vercel and wildcard subdomains.

---

## 🎯 Overview

**What you'll configure:**
- Main domain: `yourdomain.co.za`
- WWW subdomain: `www.yourdomain.co.za`
- Wildcard subdomains: `*.yourdomain.co.za` (for vendor stores)

**Time required:** 15-20 minutes (+ DNS propagation time)

---

## STEP 1: Login to Domains.co.za

1. Go to https://secure.domains.co.za
2. Click **Login** (top right)
3. Enter your credentials:
   - Username: `nqubeko377@gmail.com` (or your username)
   - Password: Your password
4. Click **Login**

---

## STEP 2: Access DNS Management

1. After login, click **My Domains** (left sidebar)
2. Find your domain in the list
3. Click **Manage** next to your domain
4. Click **DNS Management** tab

You should see a page with DNS records.

---

## STEP 3: Delete Existing Records (Important!)

Before adding new records, delete these if they exist:
- Any A record for `@` or blank hostname
- Any CNAME record for `www`
- Any existing wildcard records `*`

**How to delete:**
1. Find the record in the list
2. Click the **Delete** or **X** icon
3. Confirm deletion

---

## STEP 4: Add New DNS Records

### Record 1: Main Domain A Record

Click **Add Record** and fill in:

```
Record Type: A
Hostname: @ (or leave blank - both work)
Points to / IP Address: 76.76.21.21
TTL: 3600 (or 1 hour)
```

Click **Add** or **Save**

---

### Record 2: WWW Subdomain CNAME

Click **Add Record** and fill in:

```
Record Type: CNAME
Hostname: www
Points to / Alias: cname.vercel-dns.com
TTL: 3600 (or 1 hour)
```

**Important:** Do NOT add `.` at the end of `cname.vercel-dns.com`

Click **Add** or **Save**

---

### Record 3: Wildcard Subdomain CNAME ⚠️ CRITICAL

This is the most important record for vendor subdomains!

Click **Add Record** and fill in:

```
Record Type: CNAME
Hostname: *
Points to / Alias: cname.vercel-dns.com
TTL: 3600 (or 1 hour)
```

**Important Notes:**
- Hostname is just the asterisk symbol: `*`
- Do NOT use `*.yourdomain.co.za` - just `*`
- Do NOT add `.` at the end of `cname.vercel-dns.com`

Click **Add** or **Save**

---

## STEP 5: Verify DNS Records

After adding all records, your DNS table should look like this:

```
Type    Hostname    Points To / Value        TTL
────────────────────────────────────────────────────
A       @           76.76.21.21              3600
CNAME   www         cname.vercel-dns.com     3600
CNAME   *           cname.vercel-dns.com     3600
```

**If you see different values, delete and re-add the records.**

---

## STEP 6: Add Domain to Vercel

Now configure Vercel to use your domain:

1. Go to https://vercel.com/dashboard
2. Select your project: `mzansi-food-connect`
3. Click **Settings** (top menu)
4. Click **Domains** (left sidebar)
5. Click **Add** button

### Add Main Domain:
- Enter: `yourdomain.co.za`
- Click **Add**

### Add WWW Subdomain:
- Enter: `www.yourdomain.co.za`
- Click **Add**

### Add Wildcard Subdomain:
- Enter: `*.yourdomain.co.za`
- Click **Add**

---

## STEP 7: Wait for Verification

Vercel will verify your DNS configuration:

**Status indicators:**
- ⏳ **Pending Verification** - Wait 5-10 minutes
- ⚠️ **Invalid Configuration** - Check DNS records or wait longer
- ✅ **Valid Configuration** - Success! SSL issued

**If showing "Invalid Configuration":**
1. Wait 10 minutes
2. Click **Refresh** button next to the domain
3. Verify DNS records in domains.co.za are correct
4. Check for typos in `cname.vercel-dns.com`
5. DNS can take up to 24-48 hours (usually 1-2 hours)

---

## STEP 8: SSL Certificate Verification

Once verified, Vercel automatically issues SSL certificates for:
- `yourdomain.co.za`
- `www.yourdomain.co.za`
- `*.yourdomain.co.za` (all subdomains)

Check SSL status in Vercel:
- Go to Settings → Domains
- Each domain should show: 🔒 "Valid Configuration"

---

## STEP 9: Test Your Configuration

### Test DNS Propagation:

Go to https://dnschecker.org and check:
```
Domain: yourdomain.co.za
Type: A Record
Should show: 76.76.21.21
```

```
Domain: www.yourdomain.co.za
Type: CNAME
Should show: cname.vercel-dns.com
```

### Test Live URLs:

**Main domain:**
```bash
curl -I https://yourdomain.co.za
# Should return: HTTP/2 200
```

**WWW redirect:**
```bash
curl -I https://www.yourdomain.co.za
# Should redirect to https://yourdomain.co.za
```

**Subdomain (if you have a store with slug "test"):**
```bash
curl -I https://test.yourdomain.co.za
# Should return: HTTP/2 200
```

---

## STEP 10: Update Your App Configuration

Update your code to use the new domain:

### Option 1: Environment Variable (Recommended)

Create `.env.production`:
```env
VITE_BASE_DOMAIN=yourdomain.co.za
```

### Option 2: Hardcode (Quick)

Update references in your code:
- `src/utils/subdomain.js`
- Any `mzansifoodconnect.co.za` → `yourdomain.co.za`

---

## 🐛 Troubleshooting

### Issue: "Invalid Configuration" in Vercel

**Solutions:**
1. Check DNS records in domains.co.za:
   - A record: `@` → `76.76.21.21`
   - CNAME: `www` → `cname.vercel-dns.com`
   - CNAME: `*` → `cname.vercel-dns.com`
2. Wait 10-30 minutes for DNS propagation
3. Clear your browser cache
4. Try in incognito mode
5. Use https://dnschecker.org to verify DNS is propagated globally

### Issue: Wildcard subdomain not working

**Check these:**
1. In domains.co.za DNS:
   - Record type is CNAME (not A)
   - Hostname is just `*` (not `*.yourdomain.co.za`)
   - Points to `cname.vercel-dns.com` (no trailing dot)
2. In Vercel Domains:
   - `*.yourdomain.co.za` is added and verified
   - Shows "Valid Configuration"
3. Wait for DNS propagation (can take 24-48 hours)

### Issue: SSL certificate error

**Solutions:**
1. Wait 5-10 minutes after adding domain (Vercel needs time to issue cert)
2. Refresh the domain in Vercel: Settings → Domains → Click domain → Refresh
3. Check Vercel status page: https://www.vercel-status.com
4. SSL is automatic - you don't need to do anything manual

### Issue: Site loads on main domain but not subdomain

**Check:**
1. Wildcard domain `*.yourdomain.co.za` is added in Vercel
2. Wildcard DNS `*` CNAME is configured in domains.co.za
3. Code is deployed with subdomain support (push latest changes)
4. Test with different subdomain: `test.yourdomain.co.za`, `demo.yourdomain.co.za`

### Issue: "This site can't be reached"

**Possible causes:**
1. DNS not propagated yet - wait longer
2. Wrong IP address in A record - should be `76.76.21.21`
3. Typo in DNS records - double check spelling
4. Domain not added to Vercel - add in Settings → Domains

---

## ✅ Success Checklist

Before going live, verify:

- [ ] Domains.co.za DNS configured:
  - [ ] A record: `@` → `76.76.21.21`
  - [ ] CNAME: `www` → `cname.vercel-dns.com`
  - [ ] CNAME: `*` → `cname.vercel-dns.com`
- [ ] Vercel domains added:
  - [ ] `yourdomain.co.za` → Valid Configuration ✅
  - [ ] `www.yourdomain.co.za` → Valid Configuration ✅
  - [ ] `*.yourdomain.co.za` → Valid Configuration ✅
- [ ] SSL certificates issued (all show 🔒)
- [ ] Main domain loads: `https://yourdomain.co.za`
- [ ] WWW redirects: `https://www.yourdomain.co.za` → `https://yourdomain.co.za`
- [ ] Subdomain works: `https://test.yourdomain.co.za` (if store exists)
- [ ] DNS propagated globally (check dnschecker.org)

---

## 📞 Support

**If you get stuck:**

1. **Vercel Support:**
   - Discord: https://vercel.com/discord
   - Docs: https://vercel.com/docs/concepts/projects/domains

2. **Domains.co.za Support:**
   - Email: support@domains.co.za
   - Phone: +27 11 640 9700
   - Hours: Mon-Fri 8am-5pm SAST

3. **DNS Checking Tools:**
   - https://dnschecker.org
   - https://www.whatsmydns.net
   - https://mxtoolbox.com/DNSLookup.aspx

---

## 🎉 You're Done!

Once all checks pass, your platform is live with subdomains!

**Vendor URLs will be:**
- `vendorslug.yourdomain.co.za`

**Platform URLs:**
- `yourdomain.co.za` → Dashboard
- `yourdomain.co.za/landing` → Landing page
