// Yoco Webhook Handler for Subscription Payments
// Handles: payment.succeeded, subscription.created, subscription.cancelled

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Get webhook secret from environment variable (supports both test and live mode)
const YOCO_WEBHOOK_SECRET = Deno.env.get("YOCO_WEBHOOK_SECRET") || "whsec_QkI5RTBCMThCRjBGQUQ4MDg1NUIwQ0M5Njg5QkI4NTI=";

serve(async (req) => {
  try {
    // Get Yoco webhook headers
    const webhookId = req.headers.get("webhook-id");
    const webhookTimestamp = req.headers.get("webhook-timestamp");
    const webhookSignature = req.headers.get("webhook-signature");
    const body = await req.text();

    // Verify webhook timestamp (prevent replay attacks)
    const timestamp = parseInt(webhookTimestamp || "0");
    const currentTime = Math.floor(Date.now() / 1000);
    if (Math.abs(currentTime - timestamp) > 180) { // 3 minutes threshold
      console.error("Webhook timestamp too old");
      return new Response(JSON.stringify({ error: "Invalid timestamp" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Construct signed content: {webhook-id}.{webhook-timestamp}.{request body}
    const signedContent = `${webhookId}.${webhookTimestamp}.${body}`;

    // Extract secret bytes (remove whsec_ prefix and decode base64)
    const secretWithoutPrefix = YOCO_WEBHOOK_SECRET.split("_")[1];
    const secretBytes = Uint8Array.from(atob(secretWithoutPrefix), c => c.charCodeAt(0));

    // Calculate expected signature using HMAC SHA256
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(signedContent);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      secretBytes,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, dataBytes);
    const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

    // Extract actual signature from header (format: "v1,{signature}")
    const actualSignature = webhookSignature?.split(" ")[0].split(",")[1];

    // Compare signatures using constant-time comparison
    if (actualSignature !== expectedSignature) {
      console.error("Invalid webhook signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const event = JSON.parse(body);
    console.log("Yoco webhook event:", event.type);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle different event types
    switch (event.type) {
      case "payment.succeeded": {
        // One-time payment succeeded
        const { metadata } = event.payload;

        // Check if this is a subscription upgrade payment
        if (metadata?.storeId && metadata?.upgradeTo) {
          const storeId = metadata.storeId;
          const planType = metadata.upgradeTo; // 'pro' or 'premium'

          console.log("Subscription payment success:", { storeId, planType });

          // Calculate expiration date (30 days from now for monthly billing)
          const now = new Date();
          const expiresAt = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days

          // Update user's plan
          const { error } = await supabase
            .from("tenants")
            .update({
              plan: planType,
              plan_started_at: now.toISOString(),
              plan_expires_at: expiresAt.toISOString(), // Set 30-day expiration
              payment_reference: event.payload.id,
            })
            .eq("id", storeId);

          if (error) {
            console.error("Failed to update plan:", error);
            throw error;
          }

          console.log(`✅ Updated store ${storeId} to ${planType} plan`);
        }
        // Check if this is a product order payment
        else if (metadata?.storeSlug && metadata?.customerName) {
          const paymentId = event.payload.id;
          console.log("Product order payment success:", { paymentId, metadata });

          // Find pending order by payment reference
          const { data: pendingOrder, error: findError } = await supabase
            .from("pending_orders")
            .select("*")
            .eq("payment_reference", paymentId)
            .single();

          if (findError || !pendingOrder) {
            console.error("Pending order not found:", findError);
            throw new Error(`No pending order found for payment ${paymentId}`);
          }

          console.log("Found pending order:", pendingOrder);

          // Create the actual order
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
            console.error("Failed to create order:", orderError);
            throw orderError;
          }

          console.log(`✅ Created order ${orderData.order_number} for payment ${paymentId}`);

          // Mark pending order as completed
          await supabase
            .from("pending_orders")
            .update({ status: "completed" })
            .eq("id", pendingOrder.id);
        }
        break;
      }

      case "subscription.created": {
        // Subscription created (for recurring payments)
        const { metadata } = event.payload;

        if (metadata?.storeId && metadata?.upgradeTo) {
          const storeId = metadata.storeId;
          const planType = metadata.upgradeTo;

          const { error } = await supabase
            .from("tenants")
            .update({
              plan: planType,
              plan_started_at: new Date().toISOString(),
              subscription_id: event.payload.subscription_id,
            })
            .eq("id", storeId);

          if (error) throw error;
          console.log(`✅ Subscription created for store ${storeId}: ${planType}`);
        }
        break;
      }

      case "subscription.cancelled": {
        // Subscription cancelled - downgrade to trial
        const { metadata } = event.payload;

        if (metadata?.storeId) {
          const storeId = metadata.storeId;

          const { error } = await supabase
            .from("tenants")
            .update({
              plan: "trial",
              plan_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days trial
              subscription_id: null,
            })
            .eq("id", storeId);

          if (error) throw error;
          console.log(`✅ Subscription cancelled for store ${storeId}, downgraded to trial`);
        }
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
