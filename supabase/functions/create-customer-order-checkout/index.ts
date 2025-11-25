// Create Yoco Checkout Session for Customer Orders
// This function creates a secure checkout session for customer orders from store templates

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
      customerName,
      customerPhone,
      cart,
      total,
      orderNumber
    } = await req.json();

    // Validate inputs
    if (!storeId || !customerName || !customerPhone || !cart || !total || !orderNumber) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get store's Yoco keys from database
    const { data: storeData, error: storeError } = await supabase
      .from("tenants")
      .select("yoco_secret_key, yoco_public_key")
      .eq("id", storeId)
      .single();

    if (storeError || !storeData) {
      throw new Error("Store not found");
    }

    // Use store's Yoco key, fallback to platform key if not configured
    let yocoSecretKey = storeData.yoco_secret_key;

    if (!yocoSecretKey) {
      // Fallback to platform key (for trial stores or stores without configured keys)
      yocoSecretKey = Deno.env.get("VITE_YOCO_SECRET_KEY");
    }

    if (!yocoSecretKey) {
      throw new Error("Yoco secret key not configured for this store");
    }

    // Create Yoco checkout session
    const totalInCents = Math.round(total * 100);
    const appUrl = Deno.env.get("APP_URL") || "https://app.mzansifoodconnect.app";

    // Use store slug for better URLs if available
    const { data: slugData } = await supabase
      .from("tenants")
      .select("slug")
      .eq("id", storeId)
      .single();

    const storeSlug = slugData?.slug || storeId;

    const checkoutResponse = await fetch("https://payments.yoco.com/api/checkouts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${yocoSecretKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: totalInCents,
        currency: "ZAR",
        successUrl: `${appUrl}/store/${storeSlug}/order-success?orderNumber=${orderNumber}`,
        cancelUrl: `${appUrl}/store/${storeSlug}`,
        failureUrl: `${appUrl}/store/${storeSlug}/order-failed?orderNumber=${orderNumber}`,
        metadata: {
          storeId: storeId,
          storeName: storeName,
          customerName: customerName,
          customerPhone: customerPhone,
          orderNumber: orderNumber,
          checkoutType: "customer_order",
          cart: JSON.stringify(cart)
        }
      })
    });

    if (!checkoutResponse.ok) {
      const errorData = await checkoutResponse.text();
      console.error("Yoco API error:", errorData);
      throw new Error(`Yoco checkout creation failed: ${errorData}`);
    }

    const checkoutData = await checkoutResponse.json();

    console.log("✅ Customer order checkout session created:", checkoutData.id);

    // Store pending order in database for webhook processing
    await supabase.from("pending_orders").insert([{
      store_id: storeId,
      customer_name: customerName,
      phone: customerPhone,
      items: cart,
      total: total,
      payment_reference: checkoutData.id, // Yoco checkout ID
      order_number: orderNumber,
      status: "pending"
    }]);

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
    console.error("Error creating customer order checkout:", error);
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
