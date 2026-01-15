# Portfolio Launch Checklist ✓

## Pre-Launch Tasks (12 minutes)

### ☐ 1. Add Images to `/public/` folder (5 min)
Navigate to: `C:\Users\thobe\OneDrive - University of Cape Town\MzanziFoodConnect\mzansi-food-connect\public`

Copy these files:
- [ ] `nqubeko-profile.jpg` - Your ELEVATE polo photo
- [ ] `creator-badge.png` - Creator icon with palette
- [ ] `stemfactory-logo.png` - StemFactory logo
- [ ] `urbansaas-logo.png` - UrbanSaas logo
- [ ] `mfc-logo.png` - MFC logo (check if already exists first)

---

### ☐ 2. Update Contact Information (2 min)
Open: `mzansi-food-connect\src\Portfolio.jsx`

**Line 256** - Update WhatsApp:
```jsx
https://wa.me/27XXXXXXXXX
        ↓ Replace with your number (no spaces)
https://wa.me/2781234XXXX
```

**Line 259** - Update Email:
```jsx
mailto:nqubeko@example.com
        ↓ Replace with your email
mailto:your.email@uct.ac.za
```

---

### ☐ 3. Test Locally (3 min)
```bash
cd "C:\Users\thobe\OneDrive - University of Cape Town\MzanziFoodConnect\mzansi-food-connect"
npm run dev
```

Open browser: `http://localhost:5173/creator`

**Check:**
- [ ] All 5 images load correctly
- [ ] WhatsApp button works
- [ ] Email button works
- [ ] All social links work (Facebook, Instagram, LinkedIn)
- [ ] Services tabs switch correctly
- [ ] Projects display properly
- [ ] Mobile view looks good (resize browser)
- [ ] "Back to Platform" button works

---

### ☐ 4. Deploy to Production (2 min)
```bash
git add .
git commit -m "Add professional portfolio website for creator showcase"
git push origin main
```

Wait 2-3 minutes for Vercel to deploy.

---

## Post-Launch Verification (5 min)

### ☐ 5. Test Live Site
Visit: `https://mzansifoodconnect.com/creator`

**Verify:**
- [ ] Portfolio loads correctly
- [ ] All images appear
- [ ] All links work
- [ ] Mobile responsive
- [ ] No console errors (F12)

---

### ☐ 6. Test Affiliate Dashboard Integration
1. [ ] Go to: `https://mzansifoodconnect.com/affiliate-dashboard`
2. [ ] Login with magic link
3. [ ] Scroll to "Resources & Guides" section
4. [ ] Click "View Portfolio" button on "Meet the Creator" card
5. [ ] Verify portfolio opens in new tab

---

## Optional Enhancements

### Future Updates (Do Later)
- [ ] Add testimonials section
- [ ] Add case studies for projects
- [ ] Add blog/articles section
- [ ] Add more projects as you build them
- [ ] Add video introduction
- [ ] Add downloadable CV/resume
- [ ] Add project screenshots/galleries

---

## Quick Reference

**Portfolio URLs:**
- https://mzansifoodconnect.com/creator
- https://mzansifoodconnect.com/portfolio

**Affiliate Dashboard:**
- https://mzansifoodconnect.com/affiliate-dashboard

**Files to Know:**
- Content: `/src/Portfolio.jsx`
- Styling: `/src/Portfolio.css`
- Images: `/public/`

**Your Social Media:**
- Facebook: https://www.facebook.com/nqubeko.49550/
- Instagram: https://www.instagram.com/nqubekobhutah/
- LinkedIn: https://www.linkedin.com/in/nqubeko-ngcece-3057b7265/

---

## Need Help?

Read the detailed guides:
1. `PORTFOLIO_SETUP.md` - Complete setup instructions
2. `PORTFOLIO_COMPLETE.md` - Full feature documentation

---

**Estimated Total Time: ~17 minutes**
(12 min setup + 5 min verification)

🚀 Let's launch your portfolio!
