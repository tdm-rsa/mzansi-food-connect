# WhatsApp Integration Setup Guide

## ✅ What's Been Implemented

WhatsApp messages are now sent automatically when you press these buttons:

1. **Confirm Order** (Set estimated time) → Sends "Order Confirmed" message
2. **Mark Ready** → Sends "Order Ready for Pickup" message
3. **Mark as Fetched/Done** → Sends "Thank You" message

All messages go from **YOUR platform WhatsApp number** (not individual vendor numbers).

---

## 📋 Setup Steps

### Step 1: Create Ultramsg Account

1. Go to https://ultramsg.com/
2. Click **"Sign Up"** or **"Get Started"**
3. You'll get a **7-day FREE trial**
4. After trial: ~R500-800/month

### Step 2: Connect Your WhatsApp

1. Login to Ultramsg dashboard
2. Click **"Create Instance"**
3. Scan the QR code with your **WhatsApp Business** app
   - Download WhatsApp Business from Play Store/App Store if you don't have it
   - Use a dedicated phone number for your business
4. Wait for connection to complete

### Step 3: Get Your Credentials

After connecting, you'll see:
- **Instance ID**: Something like `instance12345`
- **Token**: Something like `abc123xyz...`

**COPY THESE!** You'll need them in the next step.

### Step 4: Configure Your App

1. In your project folder, create a new file called `.env.local`
2. Copy the contents from `.env.example` to `.env.local`
3. Fill in your credentials:

```env
# Your actual credentials (example)
VITE_ULTRAMSG_INSTANCE_ID=instance12345
VITE_ULTRAMSG_TOKEN=abc123xyz456def789
```

4. Save the file

### Step 5: Restart Your App

```bash
# Stop your dev server (Ctrl+C)
# Then restart it:
npm run dev
```

---

## 🎉 Testing

1. Login to your dashboard
2. Go to **Orders** tab
3. Find a test order with a valid phone number
4. Click **"Confirm Order"** and set estimated time
   - ✅ Customer should receive confirmation WhatsApp message
5. Click **"Mark Ready"**
   - ✅ Customer should receive "order ready" message
6. Click **"Mark as Fetched"**
   - ✅ Customer should receive "thank you" message

**Note:** If credentials aren't configured, orders will still update but WhatsApp won't send. You'll see a message like "Order confirmed (WhatsApp: not configured)".

---

## 📱 WhatsApp Message Templates

### 1. Order Confirmation
```
Hi John! 👋

Your order from *KFC Soweto* has been confirmed! ✅

📦 Order #1234
⏱️ Ready in: 15 minutes
💰 Total: R120

Thank you for your order! We'll notify you when it's ready for pickup.

- Mzansi Food Connect 🍽️
```

### 2. Order Ready
```
Hi John! 🎉

Great news! Your order from *KFC Soweto* is ready for pickup! ✅

📦 Order #1234
📍 Come collect at KFC Soweto

See you soon! 😊

- Mzansi Food Connect 🍽️
```

### 3. Order Fetched (Thank You)
```
Thank you for collecting your order, John! 🙏

We hope you enjoy your meal from *KFC Soweto*! 🍽️

📦 Order #1234

We'd love to see you again soon! ❤️

- Mzansi Food Connect
```

---

## 💰 Pricing

| Plan | Price | What You Get |
|------|-------|-------------|
| **Free Trial** | R0 | 7 days, unlimited messages |
| **Basic** | ~R500/month | Unlimited messages |
| **Pro** | ~R800/month | Unlimited + features |

**Note:** Prices may vary. Check https://ultramsg.com/pricing for latest.

---

## ❓ Troubleshooting

### Messages aren't sending

1. Check `.env.local` exists and has correct credentials
2. Restart dev server after adding credentials
3. Check Ultramsg dashboard - is your WhatsApp still connected?
4. Check phone number format (must be South African: 27XXXXXXXXX)

### "WhatsApp: not configured" message

- You haven't added credentials to `.env.local` yet
- Orders will still work, just no WhatsApp messages

### Phone number format errors

- Remove spaces: `072 123 4567` → `0721234567`
- System auto-converts to: `27721234567`

### Ultramsg connection lost

1. Go to Ultramsg dashboard
2. Reconnect by scanning QR code again
3. Credentials stay the same

---

## 🔒 Security

- ✅ `.env.local` is in `.gitignore` - won't be committed to git
- ✅ Never share your token publicly
- ✅ If token is compromised, regenerate it in Ultramsg dashboard

---

## 🚀 Next Steps

Want to add more features?

- Custom message templates for different stores
- WhatsApp for notifications (new orders, low stock)
- Scheduled messages (daily specials)
- Customer replies handling (requires webhook setup)

Let me know what you need!
