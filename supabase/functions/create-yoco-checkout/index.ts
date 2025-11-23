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

    // Get store's Yoco keys (or use platform keys)
    const { data: store } = await supabase
      .from("tenants")
      .select("yoco_secret_key")
      .eq("id", storeId)
      .single();

    const yocoSecretKey = store?.yoco_secret_key || Deno.env.get("VITE_YOCO_SECRET_KEY");

    if (!yocoSecretKey) {
      throw new Error("Yoco secret key not configured");
    }

    // Create pending order first
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
      console.error("Failed to create pending order:", pendingError);
      throw pendingError;
    }

    // Create Yoco checkout session
    const totalInCents = Math.round(total * 100);
    const appUrl = Deno.env.get("APP_URL") || "https://app.mzansifoodconnect.app";

    const checkoutResponse = await fetch("https://payments.yoco.com/api/checkouts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${yocoSecretKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: totalInCents,
        currency: "ZAR",
        successUrl: `${appUrl}/payment-success?orderNumber=${orderNumber}&slug=${storeSlug}`,
        cancelUrl: `${appUrl}/store/${storeSlug}`,
        failureUrl: `${appUrl}/payment-failed?orderNumber=${orderNumber}&slug=${storeSlug}`,
        metadata: {
          storeId: storeId,
          storeName: storeName,
          storeSlug: storeSlug,
          customerName: customerName,
          customerPhone: customerPhone,
          orderNumber: orderNumber,
          checkoutType: "product_order"
        }
      })
    });

    if (!checkoutResponse.ok) {
      const errorData = await checkoutResponse.text();
      console.error("Yoco API error:", errorData);
      throw new Error(`Yoco checkout creation failed: ${errorData}`);
    }

    const checkoutData = await checkoutResponse.json();

    console.log("✅ Checkout session created:", checkoutData.id);

    // Update pending order with checkout ID
    await supabase
      .from("pending_orders")
      .update({ payment_reference: checkoutData.id })
      .eq("order_number", orderNumber);

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
    console.error("Error creating checkout:", error);
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
