# On-Demand Affiliate Payout System

## 🎉 What Changed

Your affiliate program now has **on-demand payouts**! Affiliates can request withdrawals anytime instead of waiting for monthly batch payouts. The system sends you an email (nqubeko377@gmail.com) with all the details to process the payment.

---

## 🚀 Key Features

### ✅ For Affiliates:
1. **Beautiful Dashboard** - Modern, clean UI showing all stats
2. **Available Balance** - Big green card showing withdrawable amount
3. **Request Payout Anytime** - Click button to request withdrawal (min R50)
4. **Real-time Client Status** - See if clients are active, churned, or cancelled
5. **Commission Progress** - Visual progress bars showing X/12 months
6. **Payout History** - Track all requests and their status

### ✅ For You (Admin):
1. **Email Notifications** - Get email at nqubeko377@gmail.com when payout requested
2. **All Bank Details** - Email includes affiliate's full bank info
3. **Affiliate Stats** - Total referrals, earnings, everything in one email
4. **Manual Control** - You approve and process EFTs manually
5. **Track Everything** - See all pending payouts in admin dashboard

---

## 💰 How It Works

### Step 1: Affiliate Earns Commission
- Vendor signs up via affiliate link with Pro/Premium plan
- Vendor pays subscription → Commission starts accruing
- Affiliates earn 30% monthly for 12 months
- Balance shows in dashboard as "Available Balance"

### Step 2: Affiliate Requests Payout
1. Goes to `/affiliate-dashboard`
2. Sees big green card with available balance
3. Clicks "💸 Request Payout" button
4. Enters amount (min R50, max = available balance)
5. Confirms request

### Step 3: You Receive Email
Email contains:
- Affiliate name, email, phone
- Bank details (bank name, account number, account type)
- Requested amount in big bold text
- Affiliate stats (total referrals, active referrals, total earned)
- Available balance after this payout

### Step 4: You Process Payment
1. Do manual EFT to affiliate's bank account
2. Go to admin dashboard (or update via database)
3. Mark payout as "paid" with transaction reference

### Step 5: Affiliate Sees Update
- Payout status changes from "Requested" → "Paid"
- Shows in payout history with reference number
- Balance updates automatically

---

## 📊 Dashboard Features

### **Main Balance Card** (Green, Prominent)
- Shows available balance in HUGE text (R4,000 font size)
- Request Payout button (disabled if < R50)
- Shows total earned, total paid, pending requests
- Beautiful gradient background with floating circles

### **Client Status**
Each client shows:
- ✅ **Active** - Still paying, earning you money
- ⏳ **Pending** - Signed up but hasn't paid yet
- ⚠️ **Churned** - Stopped paying (no more commission)
- ❌ **Cancelled** - Account deleted

### **Progress Tracking**
- Visual progress bar: 4/12 months
- Shows exactly how much earned per client
- Tracks commission lifecycle automatically

### **Stats Cards**
- Total referrals with active/churned breakdown
- Earnings from active clients only
- Referral code prominently displayed

---

## 🗄️ Database Changes

### New Migration: `015_on_demand_payout_requests.sql`

**New Columns on `affiliates` table:**
- `available_balance` - Amount ready to withdraw
- `requested_payout` - Amount currently being processed

**New Columns on `commission_payouts` table:**
- `requested_by_affiliate` - True if affiliate initiated (vs admin batch)
- `admin_email` - Email address for notifications

**New Status in `commission_payouts`:**
- `pending` → Not used anymore
- `requested` → Affiliate requested, awaiting admin
- `processing` → Admin is processing
- `paid` → Completed
- `failed` → Payment failed
- `cancelled` → Request cancelled

**New Functions:**
- `calculate_available_balance(affiliate_uuid)` - Calculates withdrawable amount
- `update_affiliate_balance()` - Auto-updates balance when commission earned
- `request_payout()` - Processes payout request (legacy, not used by frontend)

---

## 📧 Email Notification

Sent to: **nqubeko377@gmail.com**

Subject: `💰 Affiliate Payout Request - R[amount]`

Content includes:
- Orange gradient header
- Affiliate details (name, email, phone, referral code)
- **Requested amount in HUGE bold text**
- Bank details in highlight box
- Affiliate stats (referrals, earnings, balance after payout)
- Action reminder to process EFT
- Link to admin dashboard

---

## 🔧 Setup Instructions

### 1. Run New Migration

```bash
cd supabase
npx supabase db push
```

This adds the new columns and functions.

### 2. Deploy Edge Function

```bash
cd supabase
npx supabase functions deploy request-affiliate-payout
```

This deploys the email notification system.

### 3. Test It!

1. Go to `/affiliate-dashboard` and sign in as an affiliate
2. Check your available balance
3. Click "Request Payout"
4. Enter amount (try R100)
5. Check your email (nqubeko377@gmail.com)
6. You should receive the payout request email!

---

## 🎨 UI Highlights

### Login Screen
- Centered card with gradient background
- Clean, minimal form
- "Sign Up Here" link at bottom

### Main Dashboard
- **Purple gradient header** with welcome message
- **Giant green balance card** with floating shapes
- **White stat cards** in grid layout
- **Referral link with copy button**
- **Client list table** with status badges and progress bars
- **Payout history table** with status indicators

### Status Colors
- **Active**: Green (#10b981)
- **Pending**: Yellow (#fbbf24)
- **Churned**: Red (#ef4444)
- **Cancelled**: Gray (#6b7280)

### Button States
- **Enabled**: White background, green text, hover effect
- **Disabled**: Faded opacity, not-allowed cursor
- **Processing**: Shows "Processing..." text

---

## 💡 Smart Features

### 1. Balance Calculation
Available balance = Total earned - Total paid - Requested (pending)

Example:
- Total earned: R2,000
- Total paid: R500
- Requested (pending): R300
- **Available = R1,200**

### 2. Minimum Payout
- Set to R50 to avoid processing small amounts
- Button disabled if balance < R50
- Shows "Minimum payout: R50" message

### 3. Automatic Updates
- Balance updates when vendor pays subscription
- Commission accrues automatically each month
- Status changes when vendor cancels/churns

### 4. Security
- Affiliates can only see their own data
- Email-based login (no password needed)
- RLS policies enforce data isolation

---

## 🆚 Old vs New System

| Feature | OLD (Batch) | NEW (On-Demand) |
|---------|-------------|-----------------|
| **Payout Timing** | Monthly batches | Anytime affiliate wants |
| **Initiation** | Admin generates | Affiliate requests |
| **Notification** | None | Email to admin |
| **Minimum** | None | R50 |
| **UI** | Basic table | Beautiful dashboard |
| **Client Status** | Not shown | Real-time status |
| **Progress** | Not visible | Visual progress bars |
| **Balance** | Not calculated | Live available balance |

---

## 🎯 Affiliate Experience

1. **Sign up** at `/become-affiliate`
2. Get referral link: `yoursite.com/signup?ref=CODE`
3. Share with food vendors
4. Watch dashboard as vendors sign up
5. See balance grow as vendors pay monthly
6. **Request payout anytime** (min R50)
7. Get paid within 1-3 business days

---

## 💵 Your Process

1. **Receive email** when payout requested
2. **Review details** (amount, bank info, affiliate stats)
3. **Process EFT** via your business banking
4. **Mark as paid** in admin dashboard with reference
5. Done! Affiliate sees "Paid" status

---

## 🌟 Landing Page Update

Added **💰 Affiliate button** next to Admin button (👑):
- Green gradient background
- Money bag emoji
- Links to `/affiliate-dashboard`
- Same style as admin button

Location: Top navigation bar
CSS class: `.btn-affiliate`

---

## 📱 Mobile Responsive

All dashboard elements are fully responsive:
- Balance card stacks on mobile
- Tables scroll horizontally
- Buttons full-width on small screens
- Navigation collapses to hamburger menu

---

## 🐛 Error Handling

**If balance insufficient:**
- Shows alert: "❌ No balance available to withdraw"
- Button stays disabled

**If amount too high:**
- Shows alert: "❌ Amount exceeds available balance"
- Request rejected

**If amount < R50:**
- Shows alert: "❌ Minimum payout amount is R50"
- Request rejected

**If email fails:**
- Payout still recorded in database
- Admin can see it in dashboard
- Error logged in console

---

## 🚀 Next Steps (Optional)

1. **Automatic Payouts** - Integrate PayFast API for auto-EFT
2. **SMS Notifications** - Text affiliate when payout paid
3. **Invoice Generation** - PDF invoice for each payout
4. **Tax Documents** - Annual tax statement for affiliates
5. **Tiered Rates** - Higher commission for top performers

---

## 📧 Support

Questions? Email: nqubeko377@gmail.com (you!)

---

## ✅ Summary

You now have a **professional, on-demand affiliate payout system** that:
- ✅ Looks amazing (modern UI)
- ✅ Works automatically (email notifications)
- ✅ Shows real-time data (client status, progress)
- ✅ Gives affiliates control (request anytime)
- ✅ Keeps you in control (manual approval)
- ✅ Tracks everything (full history)

**Your affiliates will LOVE this!** 🎉
