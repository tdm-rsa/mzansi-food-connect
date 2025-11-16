// Yoco Webhook Handler for Subscription Payments
// Handles: payment.succeeded, subscription.created, subscription.cancelled

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const YOCO_SECRET_KEY = Deno.env.get("YOCO_SECRET_KEY") || "";

serve(async (req) => {
  try {
    // Verify Yoco signature
    const signature = req.headers.get("x-yoco-signature");
    const body = await req.text();

    // Yoco uses HMAC SHA256
    const encoder = new TextEncoder();
    const keyData = encoder.encode(YOCO_SECRET_KEY);
    const bodyData = encoder.encode(body);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, bodyData);
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    if (signature !== expectedSignature) {
      console.error("Invalid signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
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

          // Update user's plan
          const { error } = await supabase
            .from("tenants")
            .update({
              plan: planType,
              plan_started_at: new Date().toISOString(),
              plan_expires_at: null, // Subscriptions don't expire
              payment_reference: event.payload.id,
            })
            .eq("id", storeId);

          if (error) {
            console.error("Failed to update plan:", error);
            throw error;
          }

          console.log(`✅ Updated store ${storeId} to ${planType} plan`);
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
