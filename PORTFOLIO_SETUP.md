# Portfolio Setup Instructions

Your portfolio website has been created and integrated into your platform! 🎉

## Access Your Portfolio

Your portfolio is now live at:
- **Primary URL**: `https://mzansifoodconnect.com/creator`
- **Alternative URL**: `https://mzansifoodconnect.com/portfolio`

It's also integrated into your affiliate dashboard under "Meet the Creator" in the Resources section.

---

## Required Images

You need to add the following images to the `public` folder to complete your portfolio:

### 1. Profile Photo
- **Filename**: `nqubeko-profile.jpg`
- **Location**: `/mzansi-food-connect/public/nqubeko-profile.jpg`
- **Image**: Your photo in the ELEVATE polo shirt (the one you provided)
- **Recommended size**: 500x500px or larger (square format)

### 2. Creator Badge
- **Filename**: `creator-badge.png`
- **Location**: `/mzansi-food-connect/public/creator-badge.png`
- **Image**: The "Creator" icon with artist palette (the one you provided)
- **Background**: Transparent PNG preferred

### 3. StemFactory Logo
- **Filename**: `stemfactory-logo.png`
- **Location**: `/mzansi-food-connect/public/stemfactory-logo.png`
- **Image**: The StemFactory logo (the one you provided)
- **Background**: Transparent PNG preferred

### 4. UrbanSaas Logo
- **Filename**: `urbansaas-logo.png`
- **Location**: `/mzansi-food-connect/public/urbansaas-logo.png`
- **Image**: The UrbanSaas logo (the one you provided)
- **Background**: Transparent PNG preferred

### 5. MzansiFoodConnect Logo
- **Filename**: `mfc-logo.png`
- **Location**: `/mzansi-food-connect/public/mfc-logo.png`
- **Image**: Your existing MFC logo
- **Note**: You might already have this in your public folder - check first!

---

## How to Add Images

1. Open Windows File Explorer
2. Navigate to: `C:\Users\thobe\OneDrive - University of Cape Town\MzanziFoodConnect\mzansi-food-connect\public`
3. Copy your images into this folder with the exact filenames listed above
4. The portfolio will automatically load these images

---

## Update Contact Information

You need to update your contact details in the portfolio:

### File to Edit
`/mzansi-food-connect/src/Portfolio.jsx`

### Lines to Update

**Line 256** - WhatsApp Number:
```jsx
// Current:
<a href="https://wa.me/27XXXXXXXXX" className="contact-btn whatsapp">

// Replace XXXXXXXXX with your actual phone number (without spaces)
// Example: https://wa.me/27812345678
```

**Line 259** - Email Address:
```jsx
// Current:
<a href="mailto:nqubeko@example.com" className="contact-btn email">

// Replace nqubeko@example.com with your actual email
// Example: mailto:nqubeko.ngcece@uct.ac.za
```

---

## What's Already Done ✅

- ✅ Portfolio page created with professional design
- ✅ Hero section with your bio and UCT student info
- ✅ StemFactory services section with pricing
- ✅ Web & App Development services section
- ✅ MzansiFoodConnect project showcase
- ✅ UrbanSaas project showcase
- ✅ Social media links added (Facebook, Instagram, LinkedIn)
- ✅ Contact section with WhatsApp and Email buttons
- ✅ Responsive design (mobile-friendly)
- ✅ Integrated into affiliate dashboard
- ✅ Routes configured (/creator and /portfolio)

---

## Portfolio Features

### Services Showcased

**StemFactory:**
- Maths and Physics: R500/month
- Maths Only/Physics Only: R300/month
- University Application: R150
- NBT Application: R150
- Bursary Application: R100

**Web & App Development:**
- Custom Websites (Quote-based)
- Ecommerce Platforms (Quote-based)
- Web Applications (Quote-based)
- Mobile Apps - Android/iOS (Quote-based)
- Lifetime Support (Included)

### Projects Showcased

**MzansiFoodConnect:**
- Multi-tenant food delivery platform
- 3-tier subscription model
- Real-time order management
- WhatsApp integration
- 5+ store templates
- Live at: https://www.mzansifoodconnect.com

**UrbanSaas:**
- Premium commerce infrastructure
- Designer-grade storefront engine
- Multi-template experiences
- Automated WhatsApp payments
- Advanced analytics
- 8 min average launch time

### Social Media Connected
- ✅ Facebook: https://www.facebook.com/nqubeko.49550/
- ✅ Instagram: https://www.instagram.com/nqubekobhutah/
- ✅ LinkedIn: https://www.linkedin.com/in/nqubeko-ngcece-3057b7265/

---

## Testing Your Portfolio

Once you've added the images and updated your contact info:

1. **Start your development server**:
   ```bash
   cd "C:\Users\thobe\OneDrive - University of Cape Town\MzanziFoodConnect\mzansi-food-connect"
   npm run dev
   ```

2. **Open your browser** and go to:
   - `http://localhost:5173/creator`
   - OR `http://localhost:5173/portfolio`

3. **Check that**:
   - All images load correctly
   - WhatsApp button works (opens WhatsApp with your number)
   - Email button works (opens email client with your email)
   - Social media links open correctly
   - Everything looks good on mobile (resize your browser)

---

## Deployment

After testing locally, deploy to production:

```bash
# Make sure all changes are saved
git add .
git commit -m "Add portfolio website for creator showcase"
git push origin main
```

Vercel will automatically deploy your changes. Your portfolio will be live at:
- `https://mzansifoodconnect.com/creator`
- `https://mzansifoodconnect.com/portfolio`

---

## Customization

If you want to customize your portfolio further:

**Colors**: Edit `Portfolio.css` - search for `#667eea` and `#764ba2` (purple gradient)

**Content**: Edit `Portfolio.jsx` - all text is in the `services` and `projects` objects

**Layout**: Edit `Portfolio.css` - modify grid layouts, spacing, fonts

---

## Support

If you need any changes or have questions about your portfolio, you know how to reach me! 😊

Built with ❤️ using React, custom CSS, and a lot of attention to detail.
