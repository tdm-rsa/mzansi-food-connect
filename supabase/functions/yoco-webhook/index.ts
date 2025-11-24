// Yoco Webhook Handler for Product Orders and Subscriptions
// Handles: checkout.payment.succeeded, payment.succeeded, subscription events

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const body = await req.text();
    const event = JSON.parse(body);
    
    console.log("🔔 Webhook received:", event.type);
    console.log("📦 Event payload:", JSON.stringify(event, null, 2));

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle different event types
    switch (event.type) {
      case "checkout.payment.succeeded": {
        // Checkout API payment succeeded (hosted checkout page)
        const { metadata } = event.payload;
        const checkoutId = event.payload.id;

        console.log("💳 Checkout payment succeeded:", { checkoutId, metadata });

        // Check if this is a product order payment
        if (metadata?.checkoutType === "product_order" && metadata?.orderNumber) {
          console.log("🛒 Product order payment:", { checkoutId, orderNumber: metadata.orderNumber });

          // Find pending order by order number
          const { data: pendingOrder, error: findError } = await supabase
            .from("pending_orders")
            .select("*")
            .eq("order_number", metadata.orderNumber)
            .single();

          if (findError || !pendingOrder) {
            console.error("❌ Pending order not found:", findError);
            throw new Error(`No pending order found for order number ${metadata.orderNumber}`);
          }

          console.log("✅ Found pending order:", pendingOrder.order_number);

          // Check if order already created (prevent duplicates)
          const { data: existingOrder } = await supabase
            .from("orders")
            .select("id")
            .eq("order_number", metadata.orderNumber)
            .single();

          if (existingOrder) {
            console.log("⚠️  Order already exists, skipping creation");
            return new Response(JSON.stringify({ success: true, message: "Order already processed" }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }

          // Create the actual order
          console.log("📝 Creating order in database...");
          const { data: orderData, error: orderError } = await supabase
            .from("orders")
            .insert([{
              store_id: pendingOrder.store_id,
              customer_name: pendingOrder.customer_name,
              phone: pendingOrder.phone,
              items: pendingOrder.items,
              total: pendingOrder.total,
              payment_status: "paid",
              payment_reference: checkoutId,
              order_number: pendingOrder.order_number,
              status: "pending",
              estimated_time: 0,
            }])
            .select()
            .single();

          if (orderError) {
            console.error("❌ Failed to create order:", orderError);
            throw orderError;
          }

          console.log(`✅ Created order ${orderData.order_number} for checkout ${checkoutId}`);

          // Mark pending order as completed
          await supabase
            .from("pending_orders")
            .update({ status: "completed" })
            .eq("id", pendingOrder.id);

          console.log("✅ Marked pending order as completed");
        }
        // Check if this is a subscription upgrade payment
        else if (metadata?.checkoutType === "subscription_upgrade" && metadata?.storeId) {
          const storeId = metadata.storeId;
          const planType = metadata.upgradeTo;

          console.log("💎 Subscription upgrade:", { storeId, planType });

          // Calculate expiration date (30 days from now)
          const now = new Date();
          const expiresAt = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

          // Update store plan
          const { error } = await supabase
            .from("tenants")
            .update({
              plan: planType,
              plan_started_at: now.toISOString(),
              plan_expires_at: expiresAt.toISOString(),
              payment_reference: checkoutId,
            })
            .eq("id", storeId);

          if (error) {
            console.error("❌ Failed to upgrade store:", error);
            throw error;
          }

          console.log(`✅ Upgraded store ${storeId} to ${planType} plan`);
        }
        break;
      }

      case "payment.succeeded": {
        // One-time payment succeeded (SDK popup payments)
        const { metadata } = event.payload;

        if (metadata?.storeId && metadata?.upgradeTo) {
          const storeId = metadata.storeId;
          const planType = metadata.upgradeTo;

          console.log("💎 Subscription payment (SDK):", { storeId, planType });

          const now = new Date();
          const expiresAt = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

          const { error } = await supabase
            .from("tenants")
            .update({
              plan: planType,
              plan_started_at: now.toISOString(),
              plan_expires_at: expiresAt.toISOString(),
              payment_reference: event.payload.id,
            })
            .eq("id", storeId);

          if (error) throw error;
          console.log(`✅ Updated store ${storeId} to ${planType} plan`);
        }
        break;
      }

      default:
        console.log("ℹ️  Unhandled event type:", event.type);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
