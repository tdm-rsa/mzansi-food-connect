# Debug Pro Account Payment Recording Issue

## Problem
Pro account store payments appear in Yoco dashboard but don't record in the Mzansi Food Connect dashboard.

## How Product Payments Should Work

### Flow:
1. Customer places order on Pro store
2. `create-yoco-checkout` Edge Function creates:
   - Pending order in `pending_orders` table
   - Yoco checkout session
3. Customer pays on Yoco hosted page
4. Yoco sends webhook to `yoco-webhook` Edge Function
5. Webhook handles `checkout.payment.succeeded` event:
   - Finds pending order by order number
   - Creates actual order in `orders` table
   - Marks pending order as completed
6. Order appears in Pro store dashboard

### Potential Issues:

#### Issue 1: Yoco Webhook Not Configured for Store Keys
- **Problem**: Pro stores use their own Yoco keys (`yoco_secret_key` in tenants table)
- **Solution**: Each store needs their own webhook endpoint configured in their Yoco dashboard
- **Current Setup**: We have ONE platform webhook for platform-level payments
- **What's Needed**: Pro stores need webhooks configured for THEIR Yoco account

#### Issue 2: Webhook Secret Mismatch
- **Problem**: Webhook uses `YOCO_WEBHOOK_SECRET` from env
- **Issue**: This is for platform Yoco account, not store-specific accounts
- **Solution**: Store-specific webhooks need store-specific secrets

##  Root Cause Analysis

### Current Webhook Handler (yoco-webhook/index.ts)
```typescript
// Line 116-179: Handles product_order checkouts
case "checkout.payment.succeeded": {
  const { metadata } = event.payload;

  if (metadata?.checkoutType === "product_order" && metadata?.orderNumber) {
    // Find pending order
    const { data: pendingOrder } = await supabase
      .from("pending_orders")
      .select("*")
      .eq("order_number", metadata.orderNumber)
      .single();

    // Create actual order
    await supabase.from("orders").insert([...]);

    // Mark pending order as completed
    await supabase.from("pending_orders")
      .update({ status: "completed" })
      .eq("id", pendingOrder.id);
  }
}
```

### The Problem:
**Pro stores use their OWN Yoco keys** (stored in `tenants.yoco_secret_key`), NOT the platform Yoco keys.

When they create a checkout:
```typescript
// Line 50: Uses store's own keys
const yocoSecretKey = store?.yoco_secret_key || Deno.env.get("VITE_YOCO_SECRET_KEY");
```

But the **webhook** is only configured in the **PLATFORM** Yoco dashboard, not the **STORE** Yoco dashboards.

## Solutions

### Option 1: Use Platform Keys for All Pro Stores (RECOMMENDED)
Pro stores should NOT use their own Yoco keys. They should use platform keys.

**Why?**
- Simpler setup (no need for each store to configure webhooks)
- Centralized payment tracking
- One webhook endpoint handles all stores

**Implementation:**
1. Remove `yoco_secret_key` column from Pro store tenants
2. Pro stores always use platform keys from `VITE_YOCO_SECRET_KEY`
3. Platform webhook handles ALL Pro store payments

### Option 2: Store-Specific Webhooks (COMPLEX)
Each Pro store needs:
1. Their own Yoco account
2. Their own webhook configured
3. Store-specific webhook secrets
4. Multiple webhook endpoints or dynamic routing

**Why Avoid?**
- Too complex for R2.50/month plan
- Each store owner needs to set up Yoco account
- More points of failure

## Recommended Fix

### Change Pro Stores to Use Platform Keys

**Rationale:**
- Premium stores (R3.00/month) can use custom domains, so custom Yoco keys make sense
- Pro stores (R2.50/month) should use simpler platform integration
- All Pro payments go through platform Yoco → platform webhook works

**Steps:**
1. Update `create-yoco-checkout` to NOT use store keys for Pro plans
2. Only Premium plans use custom Yoco keys
3. Update Pro plan features to clarify "Payments via platform Yoco account"

### Code Changes Needed:

#### 1. Update create-yoco-checkout Edge Function
```typescript
// Get store's plan
const { data: store } = await supabase
  .from("tenants")
  .select("yoco_secret_key, plan")
  .eq("id", storeId)
  .single();

// Pro plans use platform keys, Premium plans use their own keys
const yocoSecretKey = (store?.plan === 'premium' && store?.yoco_secret_key)
  ? store.yoco_secret_key
  : Deno.env.get("VITE_YOCO_SECRET_KEY");
```

#### 2. Update Pro Plan Features
- Remove "Real payments with your own Yoco keys" from Pro features
- Add "Payments processed through platform (no Yoco setup required)"
- Keep "Custom Yoco keys" as Premium-only feature

## Testing Steps

After implementing fix:
1. Clear any existing `yoco_secret_key` from Pro stores
2. Make test order on Pro store
3. Check webhook receives `checkout.payment.succeeded`
4. Verify order appears in Pro store dashboard
5. Verify payment shows in platform Yoco dashboard

## Current Status
- ❌ Pro payments not recording in dashboard
- ✅ Payments showing in Yoco dashboard
- ✅ Webhook handler code correct
- ❌ Webhook not receiving events for Pro store payments

## Next Action
Implement Option 1: Force Pro stores to use platform Yoco keys only.
