# MzansiFoodConnect - Gap Analysis

**Date:** October 31, 2025  
**Project:** SaaS platform for informal SA food businesses  
**Tech Stack:** React 19 + Vite + Supabase + PayStack

---

## ✅ WHAT YOU'VE ALREADY BUILT

### 1. **Database Schema (Supabase)**
- ✅ `stores` table with store designer columns (banner, layout, animations, socials)
- ✅ `menu_items` table with image_url and description
- ✅ `orders` table
- ✅ `analytics` table/view
- ✅ `notifications` table for customer messages
- ✅ Realtime subscriptions working (orders + notifications)

### 2. **Dashboard (Owner Portal)**
- ✅ Authentication with Supabase Auth
- ✅ Dashboard home with nav cards
- ✅ Dark mode toggle (persisted to localStorage)
- ✅ Realtime order notifications with sound
- ✅ Realtime customer message notifications
- ✅ Badge counters for new orders/messages
- ✅ Store open/closed toggle (likely in StoreDesigner)

### 3. **Store Designer**
- ✅ `StoreDesigner.jsx` component exists
- ✅ Preview store with `PreviewStore.jsx`
- ✅ Store customization system (banner_type, product_layout, animations, etc.)

### 4. **Menu Management**
- ✅ `MenuManagement.jsx` component
- ✅ Add/delete menu items
- ✅ Image URLs and descriptions supported
- ✅ Realtime refresh after changes

### 5. **Analytics**
- ✅ `AnalyticsView.jsx` component
- ✅ Recharts integration for graphs
- ✅ Analytics data fetching from Supabase

### 6. **Orders Management**
- ✅ Orders table view
- ✅ "Mark Ready" functionality
- ✅ WhatsApp "Fetch Order" message (pre-filled link)
- ✅ Order status updates (pending → ready)
- ✅ Live queue tracking

### 7. **Customer Notifications**
- ✅ View customer messages
- ✅ Reply via WhatsApp (pre-filled link)
- ✅ Realtime message alerts

### 8. **QR Code Generation**
- ✅ `StyledQRCode.jsx` component
- ✅ QR code styling with qr-code-styling library

### 9. **Website Templates**
- ✅ Three templates created:
  - `ModernFoodTemplate.jsx`
  - `TraditionalSATemplate.jsx`
  - `FastMobileTemplate.jsx`
- ✅ Template switching system
- ✅ Active template stored in database

### 10. **Hooks**
- ✅ `useCart.js` - Shopping cart logic
- ✅ `useStoreData.js` - Fetch store data

---

## 🚨 WHAT'S MISSING (Critical)

### 1. **PayFast Integration** ❌
**Status:** react-paystack installed BUT not connected to anything  
**Missing:**
- [ ] PayFast credentials storage in stores table
- [ ] Checkout flow on customer website
- [ ] Payment webhook handler
- [ ] Order creation upon successful payment
- [ ] Payment verification

**Required:**
```sql
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS payfast_merchant_id TEXT,
ADD COLUMN IF NOT EXISTS payfast_merchant_key TEXT;
```

### 2. **Customer Website (Public Storefront)** ❌
**Status:** Templates exist BUT no routing for customers to access them  
**Missing:**
- [ ] `/store` or `/:subdomain` route for customers
- [ ] Store fetching by subdomain/slug
- [ ] Product catalog display
- [ ] Shopping cart UI
- [ ] Checkout page
- [ ] Order submission
- [ ] Customer messaging form ("Is product available?")

### 3. **Subdomain/Domain Routing** ❌
**Missing:**
- [ ] Subdomain generation (joesshisanyama.mzansifood.co.za)
- [ ] Subdomain → store_id mapping
- [ ] Custom domain support (+R50/month feature)
- [ ] DNS configuration guide

### 4. **WhatsApp API Integration** ❌
**Status:** Currently using `wa.me` pre-filled links (manual send)  
**Missing:**
- [ ] Actual WhatsApp Business API integration (Wassenger/Meta Cloud API)
- [ ] Automated message sending (no manual click)
- [ ] Message templates
- [ ] API key storage

### 5. **Store Designer - Live Preview** ⚠️
**Status:** PreviewStore.jsx exists but unclear if it's fully integrated  
**Needs Verification:**
- [ ] Real-time preview as owner changes settings
- [ ] All customization options wired up
- [ ] Image upload for banner/logo/about section

### 6. **Image Upload System** ❌
**Status:** image_url fields exist BUT no upload mechanism  
**Missing:**
- [ ] Supabase Storage bucket setup
- [ ] File upload component
- [ ] Image compression/optimization
- [ ] Logo upload
- [ ] Banner upload
- [ ] Product image upload
- [ ] About section image upload

### 7. **Live Queue Display (Customer Side)** ❌
**Status:** `LiveQueueButton.jsx` exists but not used on customer website  
**Missing:**
- [ ] Public live queue page
- [ ] Realtime updates for customers
- [ ] Order number display
- [ ] Estimated wait time

### 8. **Settings Page** ⚠️
**Status:** Settings nav card exists but view not implemented  
**Missing:**
- [ ] PayFast credentials input form
- [ ] QR code download functionality
- [ ] Custom domain setup
- [ ] Subscription management (upgrade/cancel)
- [ ] Password change
- [ ] Notification sound upload

### 9. **Business Onboarding Flow** ❌
**Missing:**
- [ ] Welcome wizard for new businesses
- [ ] Store name setup
- [ ] Logo upload
- [ ] First menu items
- [ ] PayFast account connection
- [ ] Subdomain selection

### 10. **Subscription & Billing** ❌
**Missing:**
- [ ] Subscription plans table
- [ ] Payment for R200/month subscription
- [ ] Trial period logic
- [ ] Billing dashboard
- [ ] Invoice generation
- [ ] Subscription expiry handling

### 11. **Analytics - Complete Implementation** ⚠️
**Needs:**
- [ ] Daily/weekly/monthly calculations
- [ ] Revenue graphs (Recharts already installed)
- [ ] Order count trends
- [ ] % increase/decrease calculations
- [ ] Export reports

### 12. **Product Availability Messaging** ❌
**Status:** Customer can ask "Is this available?" but no UI  
**Missing:**
- [ ] "Ask about this product" button on website
- [ ] Quick reply buttons for owner ("Yes", "No, sold out", "Available at 5pm")
- [ ] Pre-set responses system

### 13. **Manual Order Entry (Card Machine)** ⚠️
**Status:** Mentioned in requirements but not fully built  
**Missing:**
- [ ] "Add Manual Order" button
- [ ] Quick product selection
- [ ] Customer phone number optional input
- [ ] Payment type: "card machine"

---

## 🔧 WHAT NEEDS COMPLETION/REFINEMENT

### 1. **Store Designer Polish**
- [ ] Ensure all banner types work (text-queue, image-queue, text-only)
- [ ] Animation previews
- [ ] Product layout switcher (grid3, swipe, list, horizontal-categories)
- [ ] Social links editor (WhatsApp, Facebook, Instagram, TikTok, YouTube)
- [ ] Header layout options

### 2. **Responsive Design**
- [ ] Test all templates on 375px-400px (phone)
- [ ] Tablet optimization
- [ ] Laptop/desktop optimization
- [ ] Hamburger menu for mobile

### 3. **Error Handling**
- [ ] Better error messages for failed payments
- [ ] Network error recovery
- [ ] Supabase connection error UI
- [ ] Form validation

### 4. **Security**
- [ ] Row Level Security (RLS) policies for all Supabase tables
- [ ] Input sanitization
- [ ] Rate limiting for orders
- [ ] Prevent SQL injection

### 5. **Performance**
- [ ] Image lazy loading
- [ ] Code splitting
- [ ] Caching strategy
- [ ] Supabase query optimization

---

## 📊 COMPLETION ESTIMATE

| Component | Status | Completion |
|-----------|--------|------------|
| **Database** | ✅ | 95% |
| **Dashboard** | ✅ | 90% |
| **Store Designer** | ⚠️ | 70% |
| **Menu Management** | ✅ | 85% |
| **Analytics** | ⚠️ | 60% |
| **Orders** | ✅ | 85% |
| **Notifications** | ✅ | 80% |
| **QR Codes** | ✅ | 90% |
| **Templates** | ⚠️ | 70% |
| **Customer Website** | ❌ | 20% |
| **PayFast** | ❌ | 0% |
| **WhatsApp API** | ❌ | 0% |
| **Subdomain Routing** | ❌ | 0% |
| **Image Uploads** | ❌ | 0% |
| **Live Queue (Public)** | ❌ | 10% |
| **Settings Page** | ❌ | 30% |
| **Onboarding** | ❌ | 0% |
| **Billing/Subscriptions** | ❌ | 0% |

**Overall Project Completion: ~45%**

---

## 🎯 PRIORITY ROADMAP

### **Phase 1: MVP - Core Functionality** (Most Critical)
1. ✅ Complete customer website routing (`/store/:slug`)
2. ✅ PayFast checkout integration
3. ✅ Image upload system (Supabase Storage)
4. ✅ Settings page (PayFast credentials, QR download)
5. ✅ Live queue public page

### **Phase 2: Polish & Features**
6. ⚠️ Complete Store Designer UI
7. ⚠️ WhatsApp API integration (replace wa.me links)
8. ⚠️ Analytics completion
9. ⚠️ Manual order entry flow
10. ⚠️ Product availability quick responses

### **Phase 3: Production Ready**
11. 🔒 RLS policies + security
12. 🚀 Subdomain routing
13. 💳 Subscription billing
14. 📋 Onboarding wizard
15. 🎨 Responsive design polish

### **Phase 4: Advanced**
16. Custom domains
17. Email notifications (backup for WhatsApp)
18. Multi-location support
19. Staff accounts
20. Mobile app (React Native)

---

## 🚀 RECOMMENDED NEXT STEPS

**Let's start with Phase 1, Item 1:**

### **Task: Build Customer Website Routing**

**Sub-tasks:**
1. Create `/store/:slug` route in React Router
2. Fetch store by slug from Supabase
3. Display active template with store data
4. Add product catalog with useCart hook
5. Create checkout page
6. Wire up PayFast payment

**Want me to start building this?** Say "yes" and I'll begin! 🎉
