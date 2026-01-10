// Yoco Webhook Handler for Product Orders and Subscriptions
// Handles: payment.succeeded, checkout.payment.succeeded

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // IMPORTANT: Allow all requests - we verify via webhook signature instead
  // Yoco webhooks don't include Authorization header

  try {
    const body = await req.text();

    // Verify webhook signature (security check)
    const webhookId = req.headers.get("webhook-id");
    const webhookTimestamp = req.headers.get("webhook-timestamp");
    const webhookSignature = req.headers.get("webhook-signature");

    if (webhookId && webhookTimestamp && webhookSignature) {
      console.log("🔒 Verifying webhook signature...");

      // Get webhook secret from environment
      const webhookSecret = Deno.env.get("YOCO_WEBHOOK_SECRET");

      if (webhookSecret) {
        // Construct signed content: id.timestamp.body
        const signedContent = `${webhookId}.${webhookTimestamp}.${body}`;

        // Remove whsec_ prefix and decode secret
        const secretBytes = Uint8Array.from(atob(webhookSecret.split("_")[1]), c => c.charCodeAt(0));

        // Calculate expected signature using HMAC SHA256
        const key = await crypto.subtle.importKey(
          "raw",
          secretBytes,
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"]
        );

        const signatureBytes = await crypto.subtle.sign(
          "HMAC",
          key,
          new TextEncoder().encode(signedContent)
        );

        const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));

        // Extract signature from header (format: "v1,signature")
        const providedSignature = webhookSignature.split(" ")[0].split(",")[1];

        // Compare signatures
        if (expectedSignature !== providedSignature) {
          console.error("❌ Invalid webhook signature!");
          return new Response(JSON.stringify({ error: "Invalid signature" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
          });
        }

        console.log("✅ Webhook signature verified");
      } else {
        console.warn("⚠️ YOCO_WEBHOOK_SECRET not configured - skipping signature verification");
      }
    } else {
      console.warn("⚠️ Webhook signature headers missing - skipping verification");
    }

    // Parse event FIRST to get storeId
    const event = JSON.parse(body);
    console.log("🔔 Webhook received:", event.type);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get payment details and storeId
    const paymentId = event.payload?.id || event.id;
    const metadata = event.payload?.metadata || event.metadata || {};
    const storeId = metadata?.storeId;

    console.log("💳 Payment ID:", paymentId);
    console.log("📋 Metadata:", JSON.stringify(metadata, null, 2));
    console.log("🏪 Store ID:", storeId);

    // If we have signature headers and storeId, verify using vendor's secret
    if (webhookId && webhookTimestamp && webhookSignature && storeId) {
      console.log("🔒 Looking up vendor webhook secret for store:", storeId);

      // Get vendor's webhook secret
      const { data: vendorStore } = await supabase
        .from("tenants")
        .select("yoco_webhook_secret, name")
        .eq("id", storeId)
        .single();

      if (vendorStore?.yoco_webhook_secret) {
        console.log(`🔐 Using vendor webhook secret for ${vendorStore.name}`);

        // Construct signed content
        const signedContent = `${webhookId}.${webhookTimestamp}.${body}`;

        // Remove whsec_ prefix and decode secret
        const secretBytes = Uint8Array.from(atob(vendorStore.yoco_webhook_secret.split("_")[1]), c => c.charCodeAt(0));

        // Calculate expected signature using HMAC SHA256
        const key = await crypto.subtle.importKey(
          "raw",
          secretBytes,
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"]
        );

        const signatureBytes = await crypto.subtle.sign(
          "HMAC",
          key,
          new TextEncoder().encode(signedContent)
        );

        const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));

        // Extract signature from header
        const providedSignature = webhookSignature.split(" ")[0].split(",")[1];

        // Compare signatures
        if (expectedSignature !== providedSignature) {
          console.error("❌ Invalid vendor webhook signature!");
          return new Response(JSON.stringify({ error: "Invalid signature" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
          });
        }

        console.log("✅ Vendor webhook signature verified");
      } else {
        console.log("⚠️ No vendor webhook secret found - vendor may not have registered webhook yet");
      }
    }

    console.log("📦 Full event:", JSON.stringify(event, null, 2));

    // Handle product orders (works for both payment.succeeded and checkout.payment.succeeded)
    // Handles both "product_order" and "customer_order" types
    if ((metadata?.checkoutType === "product_order" || metadata?.checkoutType === "customer_order") && metadata?.orderNumber) {
      console.log("🛒 Order payment detected:", { paymentId, orderNumber: metadata.orderNumber, checkoutType: metadata.checkoutType });

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

      // Send vendor notification via WhatsApp
      try {
        // Get store info to get vendor WhatsApp number
        const { data: storeData } = await supabase
          .from("tenants")
          .select("vendor_whatsapp_number, name")
          .eq("id", pendingOrder.store_id)
          .single();

        if (storeData && storeData.vendor_whatsapp_number) {
          console.log(`📱 Sending vendor notification to ${storeData.vendor_whatsapp_number}`);

          // Send WhatsApp notification to vendor
          const message = `🔔 *New Order Alert!*\n\nYou have a new order from *${pendingOrder.customer_name}*\n\n📦 Order: #${orderData.order_number}\n💰 Total: R${pendingOrder.total}\n\n👉 Go check your dashboard to confirm and prepare the order!\n\n- ${storeData.name}`;

          const whatsappResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-whatsapp`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`
            },
            body: JSON.stringify({
              phoneNumber: storeData.vendor_whatsapp_number,
              message: message
            })
          });

          if (whatsappResponse.ok) {
            console.log("✅ Vendor notification sent successfully");
          } else {
            console.log("⚠️ Vendor notification may have failed");
          }
        } else {
          console.log("⚠️ No vendor WhatsApp number configured for this store");
        }
      } catch (notificationError) {
        console.error("⚠️ Failed to send vendor notification:", notificationError);
        // Don't fail the webhook if notification fails
      }

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
