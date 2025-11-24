// Yoco Webhook Handler for Product Orders and Subscriptions
// Handles: payment.succeeded, checkout.payment.succeeded

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const body = await req.text();
    const event = JSON.parse(body);
    
    console.log("🔔 Webhook received:", event.type);
    console.log("📦 Full event:", JSON.stringify(event, null, 2));

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get payment details - works for both event types
    const paymentId = event.payload?.id || event.id;
    const metadata = event.payload?.metadata || event.metadata || {};
    
    console.log("💳 Payment ID:", paymentId);
    console.log("📋 Metadata:", JSON.stringify(metadata, null, 2));

    // Handle product orders (works for both payment.succeeded and checkout.payment.succeeded)
    if (metadata?.checkoutType === "product_order" && metadata?.orderNumber) {
      console.log("🛒 Product order payment detected:", { paymentId, orderNumber: metadata.orderNumber });

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
          payment_reference: paymentId,
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

      console.log(`✅✅✅ SUCCESSFULLY CREATED ORDER ${orderData.order_number} for payment ${paymentId} ✅✅✅`);

      // Mark pending order as completed
      await supabase
        .from("pending_orders")
        .update({ status: "completed" })
        .eq("id", pendingOrder.id);

      console.log("✅ Marked pending order as completed");
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Order created successfully",
        orderNumber: orderData.order_number 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle subscription upgrades
    if (metadata?.checkoutType === "subscription_upgrade" && metadata?.storeId) {
      const storeId = metadata.storeId;
      const planType = metadata.upgradeTo;

      console.log("💎 Subscription upgrade:", { storeId, planType });

      const now = new Date();
      const expiresAt = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

      const { error } = await supabase
        .from("tenants")
        .update({
          plan: planType,
          plan_started_at: now.toISOString(),
          plan_expires_at: expiresAt.toISOString(),
          payment_reference: paymentId,
        })
        .eq("id", storeId);

      if (error) {
        console.error("❌ Failed to upgrade store:", error);
        throw error;
      }

      console.log(`✅ Upgraded store ${storeId} to ${planType} plan`);
      
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Legacy subscription payments (old SDK flow)
    if (metadata?.storeId && metadata?.upgradeTo) {
      const storeId = metadata.storeId;
      const planType = metadata.upgradeTo;

      console.log("💎 Legacy subscription payment:", { storeId, planType });

      const now = new Date();
      const expiresAt = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

      const { error } = await supabase
        .from("tenants")
        .update({
          plan: planType,
          plan_started_at: now.toISOString(),
          plan_expires_at: expiresAt.toISOString(),
          payment_reference: paymentId,
        })
        .eq("id", storeId);

      if (error) throw error;
      console.log(`✅ Updated store ${storeId} to ${planType} plan`);
      
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("ℹ️  Event received but no action taken - might be a different event type");
    return new Response(JSON.stringify({ success: true, message: "Event received" }), {
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
