# 🚀 MzansiFoodConnect - Phase 1 MVP Setup Instructions

**Congratulations!** We've just built the **customer-facing features** of your platform. Here's what we accomplished and how to get it running.

---

## ✅ WHAT WE JUST BUILT (Phase 1)

### 1. **Database Migration** ✅
- Added `slug` column to `stores` table for customer URLs

### 2. **Customer Website Routing** ✅
- Route: `/store/:slug` - Public storefront
- Fetches store data by slug
- Displays active template (Modern Food, Traditional SA, or Fast & Mobile)
- Realtime store updates (open/closed status)

### 3. **Shopping Cart System** ✅
- Floating cart button with badge counter
- Cart sidebar with add/remove items
- Cart total calculation
- Persistent cart (via useCart hook)

### 4. **Checkout Flow** ✅
- Customer details form (name, phone)
- Order summary
- Paystack payment integration
- Order creation in database after payment
- Redirect back to store after success

### 5. **Customer Messaging** ✅
- "Ask About Product" modal
- Creates notifications for store owner
- Owner receives alert in dashboard
- Stores customer phone for WhatsApp reply

### 6. **Live Queue Page** ✅
- Route: `/store/:slug/queue`
- Shows all "ready" orders
- Realtime updates when orders are marked ready
- Time-since-ready display

---

## 🔧 SETUP STEPS

### Step 1: Run Database Migrations

Go to your **Supabase SQL Editor** and run these migrations in order:

1. **Add Slug Column:**
   ```sql
   -- File: MIGRATION_ADD_STORE_SLUG.sql
   ```
   Run the entire file in Supabase SQL Editor

2. **Verify Stores Table:**
   After running, check that your stores table has:
   - `slug` column (TEXT, UNIQUE)
   - All existing stores have auto-generated slugs

3. **(Optional) Set Custom Slug:**
   ```sql
   UPDATE stores 
   SET slug = 'your-custom-slug'
   WHERE id = 'your-store-id';
   ```

### Step 2: Install Dependencies

Your `package.json` already has all dependencies. Just ensure they're installed:

```powershell
npm install
```

**Key Dependencies:**
- `react-paystack` - Payment processing
- `@supabase/supabase-js` - Database & realtime
- `react-router-dom` - Routing
- `recharts` - Analytics graphs
- `qr-code-styling` - QR code generation

### Step 3: Configure Paystack

1. **Sign up for Paystack:**
   - Go to https://paystack.com
   - Create account (or use test account)
   - Get your **Public Key** from Settings

2. **Update Checkout.jsx:**
   Open `src/Checkout.jsx` and replace:
   ```javascript
   publicKey: "pk_test_xxxxxxxxxxxxxxxxxxxxxx"
   ```
   With your actual Paystack public key:
   ```javascript
   publicKey: "pk_test_YOUR_ACTUAL_KEY_HERE"
   ```

3. **For Production:**
   - Use live key: `pk_live_...`
   - Update in same location

### Step 4: Test Your Setup

1. **Start Dev Server:**
   ```powershell
   npm run dev
   ```

2. **Access Owner Dashboard:**
   ```
   http://localhost:5173/
   ```
   - Login with your Supabase account
   - Set your store slug in Supabase if not auto-generated

3. **Access Customer Store:**
   ```
   http://localhost:5173/store/your-slug
   ```
   Replace `your-slug` with your actual store slug

4. **Test Features:**
   - ✅ View products
   - ✅ Add to cart
   - ✅ Go to checkout
   - ✅ Enter details
   - ✅ Test payment (use Paystack test cards)
   - ✅ View live queue: `/store/your-slug/queue`

---

## 📝 PAYSTACK TEST CARDS

For testing payments:

**Successful Payment:**
```
Card Number: 4084 0840 8408 4081
CVV: 408
Expiry: Any future date
PIN: 0000
OTP: 123456
```

**Failed Payment:**
```
Card Number: 5060 6666 6666 6666 6666
CVV: Any
Expiry: Any future date
```

---

## 🔗 KEY ROUTES

| Route | Purpose | Who Sees It |
|-------|---------|-------------|
| `/` | Owner dashboard | Business owners |
| `/store/:slug` | Customer storefront | Customers |
| `/store/:slug/checkout` | Checkout page | Customers |
| `/store/:slug/queue` | Live queue | Customers |

---

## 🎨 HOW IT WORKS

### Customer Journey:
1. Customer visits `/store/joesshisanyama`
2. Sees menu items with Add to Cart buttons
3. Cart floating button shows item count
4. Clicks cart → sidebar opens with items
5. Clicks "Proceed to Checkout"
6. Enters name & phone
7. Pays via Paystack
8. Order created in database (status: "pending")
9. Owner gets realtime notification
10. Owner marks order "ready"
11. Customer sees order in live queue
12. Owner clicks "Fetch Order" → WhatsApp message sent

### Owner Journey:
1. Login to dashboard
2. New order notification (sound + badge)
3. View order details in Orders tab
4. Mark order as "Ready"
5. Send "Fetch Order" WhatsApp message
6. Customer can track in live queue

---

## 🚨 IMPORTANT NOTES

### 1. **WhatsApp Integration**
Currently using **pre-filled WhatsApp links** (`wa.me/...`).

**What this means:**
- Owner clicks "Fetch Order" button
- WhatsApp opens with message pre-filled
- Owner must click "Send" manually

**To upgrade to full automation:**
- Integrate WhatsApp Business API (Wassenger or Meta Cloud API)
- See `GAP_ANALYSIS.md` Phase 2

### 2. **Paystack Public Key**
⚠️ **MUST UPDATE** in `src/Checkout.jsx` before testing payments!

### 3. **Store Slug**
- Must be unique per store
- URL-friendly (lowercase, no spaces)
- Examples: `joes-shisanyama`, `mamas-kitchen`, `township-eats`

### 4. **Notifications Table**
Ensure your Supabase `notifications` table has these columns:
- `store_id` (UUID, foreign key to stores)
- `customer_name` (TEXT)
- `customer_phone` (TEXT)
- `message` (TEXT)
- `product_id` (UUID, nullable)
- `product_name` (TEXT, nullable)
- `status` (TEXT, default: 'pending')
- `type` (TEXT, e.g., 'product_inquiry')
- `response` (TEXT, nullable)
- `created_at` (TIMESTAMPTZ)

---

## 🎯 NEXT STEPS (Phase 2)

After testing Phase 1, we can build:

1. **Image Upload System** - Upload logos, banners, product images
2. **Complete Store Designer** - Live preview, all customization options
3. **Settings Page** - Paystack credentials, QR download, password change
4. **WhatsApp API Integration** - Full automation (no manual sending)
5. **Manual Order Entry** - For card machine payments at the till
6. **Analytics Completion** - Revenue graphs, trends, reports
7. **Onboarding Flow** - Welcome wizard for new stores
8. **Subscription Billing** - R200/month payment system

---

## 📞 TESTING CHECKLIST

- [ ] Database migrations run successfully
- [ ] Store has a slug in Supabase
- [ ] Paystack public key updated in Checkout.jsx
- [ ] Dev server running (`npm run dev`)
- [ ] Owner dashboard accessible at `/`
- [ ] Customer store accessible at `/store/:slug`
- [ ] Can add products to cart
- [ ] Cart sidebar opens and closes
- [ ] Cart quantity controls work
- [ ] Checkout page loads
- [ ] Payment form validates inputs
- [ ] Test payment completes (using test card)
- [ ] Order appears in owner dashboard
- [ ] Owner can mark order ready
- [ ] Live queue shows ready orders
- [ ] Realtime updates work (open second browser)

---

## 🎉 YOU'RE READY!

Your Phase 1 MVP is complete. Customers can now:
- Browse your menu
- Add items to cart
- Pay online via Paystack
- Track their orders in the live queue

Owners can:
- Receive orders in realtime
- Manage orders
- Send WhatsApp notifications

**Need help?** Check `GAP_ANALYSIS.md` for what's coming next!
