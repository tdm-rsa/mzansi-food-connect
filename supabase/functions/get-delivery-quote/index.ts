// Get Delivery Quote from Uber Direct API
// This function gets real-time delivery quote based on pickup and delivery addresses

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
      pickupAddress,
      deliveryAddress,
      pickupLat,
      pickupLng,
      deliveryLat,
      deliveryLng
    } = await req.json();

    // Validate inputs
    if (!deliveryAddress) {
      return new Response(
        JSON.stringify({ error: "Delivery address is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Uber Direct API credentials from environment
    const uberClientId = Deno.env.get("UBER_DIRECT_CLIENT_ID");
    const uberClientSecret = Deno.env.get("UBER_DIRECT_CLIENT_SECRET");
    const uberCustomerId = Deno.env.get("UBER_DIRECT_CUSTOMER_ID");

    if (!uberClientId || !uberClientSecret || !uberCustomerId) {
      console.error("❌ Uber Direct credentials not configured");
      return new Response(
        JSON.stringify({
          error: "Delivery service not configured",
          fallbackFee: 25 // Return default fee as fallback
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Get OAuth token
    const tokenResponse = await fetch("https://login.uber.com/oauth/v2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: uberClientId,
        client_secret: uberClientSecret,
        grant_type: "client_credentials",
        scope: "eats.deliveries"
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Uber OAuth error:", errorText);
      throw new Error("Failed to authenticate with Uber Direct");
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Step 2: Create delivery quote request
    // Note: If coordinates not provided, Uber will geocode the addresses
    const quoteRequest = {
      pickup_address: pickupAddress || "Store Pickup Location",
      dropoff_address: deliveryAddress,
      ...(pickupLat && pickupLng && {
        pickup_latitude: pickupLat,
        pickup_longitude: pickupLng
      }),
      ...(deliveryLat && deliveryLng && {
        dropoff_latitude: deliveryLat,
        dropoff_longitude: deliveryLng
      })
    };

    const quoteResponse = await fetch(
      `https://api.uber.com/v1/customers/${uberCustomerId}/delivery_quotes`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(quoteRequest)
      }
    );

    if (!quoteResponse.ok) {
      const errorData = await quoteResponse.text();
      console.error("Uber quote error:", errorData);

      // Return fallback fee instead of throwing error
      return new Response(
        JSON.stringify({
          success: true,
          fallbackFee: 25,
          message: "Using estimated delivery fee"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const quoteData = await quoteResponse.json();

    console.log("✅ Uber delivery quote received:", quoteData);

    // Extract delivery fee (in cents, convert to Rand)
    const deliveryFee = quoteData.fee ? (quoteData.fee / 100) : 25;
    const estimatedDuration = quoteData.duration || 30; // minutes

    return new Response(
      JSON.stringify({
        success: true,
        deliveryFee: deliveryFee,
        estimatedDuration: estimatedDuration,
        quoteId: quoteData.id,
        currency: quoteData.currency || "ZAR"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Error getting delivery quote:", error);

    // Return fallback fee on error
    return new Response(
      JSON.stringify({
        success: true,
        fallbackFee: 25,
        message: "Using estimated delivery fee"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
