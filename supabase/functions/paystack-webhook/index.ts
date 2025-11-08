// Paystack Webhook Handler for Subscription Payments
// Handles: subscription.create, charge.success, subscription.disable

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY") || "";

serve(async (req) => {
  try {
    // Verify Paystack signature
    const signature = req.headers.get("x-paystack-signature");
    const body = await req.text();

    const hash = await crypto.subtle.digest(
      "SHA-512",
      new TextEncoder().encode(PAYSTACK_SECRET_KEY + body)
    );
    const expectedSignature = Array.from(new Uint8Array(hash))
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
    console.log("Webhook event:", event.event);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle different event types
    switch (event.event) {
      case "charge.success": {
        // One-time or subscription payment succeeded
        const { customer, metadata, plan } = event.data;
        const userEmail = customer.email;
        const planType = metadata?.plan || (plan?.name?.toLowerCase().includes("premium") ? "premium" : "pro");

        console.log("Payment success:", { userEmail, planType });

        // Update user's plan
        const { error } = await supabase
          .from("stores")
          .update({
            plan: planType,
            plan_start_date: new Date().toISOString(),
          })
          .eq("owner_email", userEmail);

        if (error) {
          console.error("Failed to update plan:", error);
          throw error;
        }

        console.log(`✅ Updated ${userEmail} to ${planType} plan`);
        break;
      }

      case "subscription.create": {
        // Subscription created
        const { customer, plan } = event.data;
        const userEmail = customer.email;
        const planType = plan.name.toLowerCase().includes("premium") ? "premium" : "pro";

        const { error } = await supabase
          .from("stores")
          .update({
            plan: planType,
            plan_start_date: new Date().toISOString(),
          })
          .eq("owner_email", userEmail);

        if (error) throw error;
        console.log(`✅ Subscription created for ${userEmail}: ${planType}`);
        break;
      }

      case "subscription.disable": {
        // Subscription cancelled - downgrade to trial
        const { customer } = event.data;
        const userEmail = customer.email;

        const { error } = await supabase
          .from("stores")
          .update({ plan: "trial" })
          .eq("owner_email", userEmail);

        if (error) throw error;
        console.log(`✅ Subscription cancelled for ${userEmail}, downgraded to trial`);
        break;
      }

      default:
        console.log("Unhandled event type:", event.event);
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
