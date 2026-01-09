// Create Yoco Checkout Session
// This function creates a secure checkout session and returns the redirect URL

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
      storeSlug,
      customerName,
      customerPhone,
      items,
      total,
      orderNumber
    } = await req.json();

    console.log("📝 Checkout request:", { storeId, storeName, storeSlug, orderNumber, total });

    // Validate inputs
    if (!storeId || !customerName || !customerPhone || !items || !total) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // CRITICAL: ALL stores (Pro and Premium) MUST use platform Yoco keys for product orders
    // This ensures our webhook receives payment notifications and orders are created
    const yocoSecretKey = Deno.env.get("VITE_YOCO_SECRET_KEY");

    if (!yocoSecretKey) {
      console.error("❌ VITE_YOCO_SECRET_KEY not configured");
      throw new Error("Yoco secret key not configured");
    }

    console.log("✅ Using platform Yoco key");

    // Create pending order first
    console.log("📝 Creating pending order...");
    const { error: pendingError } = await supabase
      .from("pending_orders")
      .insert([{
        store_id: storeId,
        customer_name: customerName,
        phone: customerPhone,
        items: items,
        total: total,
        payment_reference: "", // Will be updated by webhook
        order_number: orderNumber,
        status: 'pending',
      }]);

    if (pendingError) {
      console.error("❌ Failed to create pending order:", pendingError);
      throw pendingError;
    }

    console.log("✅ Pending order created:", orderNumber);

    // Create Yoco checkout session
    const totalInCents = Math.round(total * 100);
    
    // Determine the correct base URL for redirects
    // Check if store has a subdomain configured
    const { data: storeData } = await supabase
      .from("tenants")
      .select("subdomain")
      .eq("id", storeId)
      .single();

    let baseUrl;
    if (storeData?.subdomain) {
      // Use subdomain URL
      baseUrl = `https://${storeData.subdomain}.mzansifoodconnect.app`;
      console.log("🌐 Using subdomain URL:", baseUrl);
    } else {
      // Use path-based URL
      baseUrl = Deno.env.get("APP_URL") || "https://app.mzansifoodconnect.app";
      console.log("🌐 Using main domain URL:", baseUrl);
    }

    console.log("💰 Amount in cents:", totalInCents);

    // CRITICAL: Include webhook URL so Yoco knows where to send payment notifications
    const webhookUrl = `${supabaseUrl}/functions/v1/yoco-webhook`;
    console.log("🔗 Webhook URL:", webhookUrl);

    const checkoutPayload = {
      amount: totalInCents,
      currency: "ZAR",
      successUrl: storeData?.subdomain
        ? `${baseUrl}/payment-success?orderNumber=${orderNumber}`
        : `${baseUrl}/payment-success?orderNumber=${orderNumber}&slug=${storeSlug}`,
      cancelUrl: storeData?.subdomain
        ? `${baseUrl}/`
        : `${baseUrl}/store/${storeSlug}`,
      failureUrl: storeData?.subdomain
        ? `${baseUrl}/payment-failed?orderNumber=${orderNumber}`
        : `${baseUrl}/payment-failed?orderNumber=${orderNumber}&slug=${storeSlug}`,
      webhookUrl: webhookUrl,
      metadata: {
        storeId: storeId,
        storeName: storeName,
        storeSlug: storeSlug,
        customerName: customerName,
        customerPhone: customerPhone,
        orderNumber: orderNumber,
        checkoutType: "product_order"
      }
    };

    console.log("🔄 Creating Yoco checkout session...", {
      amount: checkoutPayload.amount,
      successUrl: checkoutPayload.successUrl,
      metadata: checkoutPayload.metadata
    });

    const checkoutResponse = await fetch("https://payments.yoco.com/api/checkouts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${yocoSecretKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(checkoutPayload)
    });

    if (!checkoutResponse.ok) {
      const errorData = await checkoutResponse.text();
      console.error("❌ Yoco API error:", errorData);
      throw new Error(`Yoco checkout creation failed: ${errorData}`);
    }

    const checkoutData = await checkoutResponse.json();

    console.log("✅ Checkout session created:", {
      checkoutId: checkoutData.id,
      redirectUrl: checkoutData.redirectUrl
    });

    // Update pending order with checkout ID
    await supabase
      .from("pending_orders")
      .update({ payment_reference: checkoutData.id })
      .eq("order_number", orderNumber);

    console.log("✅ Updated pending order with checkout ID");

    return new Response(
      JSON.stringify({
        success: true,
        checkoutId: checkoutData.id,
        redirectUrl: checkoutData.redirectUrl,
        orderNumber: orderNumber
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("❌ Error creating checkout:", error);
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
