// Create Yoco Checkout Session for Subscription Upgrades
// This function creates a secure checkout session for Pro/Premium plan upgrades

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      storeId,
      storeName,
      targetPlan,
      userEmail,
      currentPlan,
      amount
    } = await req.json();

    // Validate inputs
    if (!storeId || !targetPlan || !amount) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get platform Yoco secret key
    const yocoSecretKey = Deno.env.get("VITE_YOCO_SECRET_KEY");

    if (!yocoSecretKey) {
      throw new Error("Yoco secret key not configured");
    }

    // Create Yoco checkout session
    const totalInCents = Math.round(amount * 100);
    const appUrl = Deno.env.get("APP_URL") || "https://app.mzansifoodconnect.app";

    // Check if this is a new signup (storeId starts with "new-signup-")
    const isNewSignup = storeId.startsWith("new-signup-");

    // CRITICAL: Include webhook URL so Yoco knows where to send payment notifications
    const webhookUrl = `${supabaseUrl}/functions/v1/yoco-webhook`;
    console.log("🔗 Webhook URL:", webhookUrl);

    const checkoutResponse = await fetch("https://payments.yoco.com/api/checkouts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${yocoSecretKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: totalInCents,
        currency: "ZAR",
        successUrl: isNewSignup
          ? `${appUrl}/upgrade-success?signup=true&plan=${targetPlan}&email=${encodeURIComponent(userEmail)}&store=${encodeURIComponent(storeName)}`
          : `${appUrl}/upgrade-success?storeId=${storeId}&plan=${targetPlan}`,
        cancelUrl: `${appUrl}/app`,
        failureUrl: isNewSignup
          ? `${appUrl}/upgrade-failed?signup=true`
          : `${appUrl}/upgrade-failed?storeId=${storeId}&plan=${targetPlan}`,
        webhookUrl: webhookUrl,
        metadata: {
          storeId: storeId,
          storeName: storeName,
          upgradeTo: targetPlan,
          upgradeFrom: currentPlan,
          userEmail: userEmail,
          checkoutType: "subscription_upgrade"
        }
      })
    });

    if (!checkoutResponse.ok) {
      const errorData = await checkoutResponse.text();
      console.error("Yoco API error:", errorData);
      throw new Error(`Yoco checkout creation failed: ${errorData}`);
    }

    const checkoutData = await checkoutResponse.json();

    console.log("✅ Subscription checkout session created:", checkoutData.id);

    return new Response(
      JSON.stringify({
        success: true,
        checkoutId: checkoutData.id,
        redirectUrl: checkoutData.redirectUrl
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Error creating subscription checkout:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to create checkout session"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
