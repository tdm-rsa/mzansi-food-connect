// Create Uber Direct Delivery
// This function creates an actual delivery request with Uber Direct when order is confirmed

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
      orderId,
      storeId,
      storeName,
      storeAddress,
      storePhone,
      customerName,
      customerPhone,
      deliveryAddress,
      orderNumber,
      deliveryFee,
      preparationTime // minutes
    } = await req.json();

    // Validate inputs
    if (!orderId || !storeId || !deliveryAddress || !orderNumber) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Uber Direct API credentials
    const uberClientId = (Deno.env.get("UBER_DIRECT_CLIENT_ID") || Deno.env.get("UBER_DIRECT_ID") || "").trim();
    const uberClientSecret = (Deno.env.get("UBER_DIRECT_CLIENT_SECRET") || "").trim();
    const uberCustomerId = (Deno.env.get("UBER_DIRECT_CUSTOMER_ID") || "").trim();
    const enableMockMode = Deno.env.get("UBER_MOCK_MODE") === "true";

    // Check if credentials are missing or empty
    const hasValidCredentials = uberClientId && uberClientSecret && uberCustomerId;

    if (!hasValidCredentials) {
      console.error("❌ Uber Direct credentials not configured");

      // Check if mock mode is enabled for testing
      if (enableMockMode) {
        console.log("⚠️ Using MOCK delivery mode for testing (no real Uber delivery)");

        // Create mock tracking URL
        const mockDeliveryId = `mock_${Date.now()}`;
        const mockTrackingUrl = `https://www.ubereats.com/orders/${mockDeliveryId}`;

        // Update order with mock delivery data
        await supabase
          .from("orders")
          .update({
            uber_delivery_id: mockDeliveryId,
            delivery_tracking_url: mockTrackingUrl,
            delivery_status: "scheduled",
            notes: "MOCK MODE - Test delivery (no real courier)"
          })
          .eq("id", orderId);

        console.log("✅ Mock delivery created:", mockDeliveryId);

        // Send WhatsApp notification with mock tracking link (mirror live flow)
        if (customerPhone) {
          try {
            const whatsappMessage = `🚗 *Your order #${orderNumber} is on the way!*\\n\\nTrack your delivery in real-time:\\n${mockTrackingUrl}\\n\\nEstimated arrival: ${Math.round((preparationTime || 30) + 20)} mins\\n\\nFrom: ${storeName}\\n\\n_Powered by MzansiFoodConnect_`;

            console.log(`📱 Sending WhatsApp notification (mock) to ${customerPhone}`);

            const whatsappResponse = await supabase.functions.invoke('send-whatsapp', {
              body: {
                phoneNumber: customerPhone,
                message: whatsappMessage
              }
            });

            if (whatsappResponse.error) {
              console.error("⚠️ WhatsApp send failed (mock):", whatsappResponse.error);
              const encodedMessage = encodeURIComponent(whatsappMessage);
              const whatsappPhone = customerPhone.replace(/[\s+]/g, '');
              const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodedMessage}`;

              await supabase
                .from("orders")
                .update({
                  notes: `WhatsApp send failed (mock). Manual link: ${whatsappUrl}\nTracking: ${mockTrackingUrl}`
                })
                .eq("id", orderId);
            } else {
              console.log("✅ WhatsApp notification sent successfully (mock)");

              await supabase
                .from("orders")
                .update({
                  notes: `Tracking notification sent via WhatsApp (mock) to ${customerPhone}\nTracking URL: ${mockTrackingUrl}`
                })
                .eq("id", orderId);
            }
          } catch (whatsappError) {
            console.error("⚠️ WhatsApp notification failed in mock mode (non-critical):", whatsappError);
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            deliveryId: mockDeliveryId,
            trackingUrl: mockTrackingUrl,
            status: "pending",
            mockMode: true,
            message: "Mock delivery created for testing"
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Mark order as pending manual delivery
      await supabase
        .from("orders")
        .update({
          delivery_status: "pending_manual",
          notes: "Uber Direct not configured - arrange delivery manually"
        })
        .eq("id", orderId);

      return new Response(
        JSON.stringify({
          success: false,
          error: "Delivery service not configured",
          manualDeliveryRequired: true
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Get OAuth token
    console.log("🔑 Attempting Uber OAuth with client_id:", uberClientId?.substring(0, 8) + "...");

    const tokenResponse = await fetch("https://auth.uber.com/oauth/v2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: uberClientId.trim(),
        client_secret: uberClientSecret.trim(),
        grant_type: "client_credentials",
        scope: "direct.organizations"
      })
    });

    console.log("📡 OAuth response status:", tokenResponse.status);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("❌ Uber OAuth error (status " + tokenResponse.status + "):", errorText);
      throw new Error("Failed to authenticate with Uber Direct: " + errorText);
    }

    console.log("✅ OAuth successful, creating delivery...");

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Step 2: Calculate pickup time (current time + preparation time)
    const pickupTime = new Date();
    pickupTime.setMinutes(pickupTime.getMinutes() + (preparationTime || 30));

    // Step 3: Create delivery request
    const deliveryRequest = {
      pickup: {
        name: storeName || "Restaurant",
        address: storeAddress || "Store Location",
        phone_number: storePhone || "+27000000000",
        notes: `Order #${orderNumber}`,
        ready_dt: pickupTime.toISOString()
      },
      dropoff: {
        name: customerName || "Customer",
        address: deliveryAddress,
        phone_number: customerPhone || "+27000000000",
        notes: `Order #${orderNumber} - Please handle with care`
      },
      manifest: {
        description: `Food delivery - Order #${orderNumber}`,
        total_value: Math.round((deliveryFee || 25) * 100) // in cents
      },
      external_id: `order_${orderId}`, // For tracking
      test_mode: Deno.env.get("UBER_DIRECT_TEST_MODE") === "true"
    };

    console.log("📦 Creating Uber delivery:", deliveryRequest);

    const deliveryResponse = await fetch(
      `https://api.uber.com/v1/customers/${uberCustomerId}/deliveries`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(deliveryRequest)
      }
    );

    if (!deliveryResponse.ok) {
      const errorData = await deliveryResponse.text();
      console.error("Uber delivery creation error:", errorData);

      // Update order with error status
      await supabase
        .from("orders")
        .update({
          delivery_status: "failed",
          notes: `Delivery creation failed: ${errorData}`
        })
        .eq("id", orderId);

      throw new Error(`Uber delivery creation failed: ${errorData}`);
    }

    const deliveryData = await deliveryResponse.json();

    console.log("✅ Uber delivery created:", deliveryData);

    // Capture tracking URL with multiple fallbacks (API fields can differ)
    const trackingUrl =
      deliveryData.tracking_url ||
      deliveryData.trackingUrl ||
      deliveryData.tracking_link ||
      deliveryData.tracking?.url ||
      deliveryData.tracking?.href ||
      deliveryData.tracking?.tracking_url ||
      null;

    // Step 4: Update order with Uber delivery information
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        uber_delivery_id: deliveryData.id,
        delivery_tracking_url: trackingUrl,
        delivery_status: "scheduled",
        driver_name: null, // Will be updated when driver accepts
        driver_phone: null
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Failed to update order with delivery info:", updateError);
    }

    // Step 5: Send WhatsApp notification to customer with tracking link
    if (trackingUrl && customerPhone) {
      try {
        const whatsappMessage = `🚗 *Your order #${orderNumber} is on the way!*\n\nTrack your delivery in real-time:\n${trackingUrl}\n\nEstimated arrival: ${Math.round((preparationTime || 30) + 20)} mins\n\nFrom: ${storeName}\n\n_Powered by MzansiFoodConnect_`;

        console.log(`📱 Sending WhatsApp notification to ${customerPhone}`);

        // Send WhatsApp message via Ultramsg
        const whatsappResponse = await supabase.functions.invoke('send-whatsapp', {
          body: {
            phoneNumber: customerPhone,
            message: whatsappMessage
          }
        });

        if (whatsappResponse.error) {
          console.error("⚠️ WhatsApp send failed:", whatsappResponse.error);
          // Store wa.me link as fallback
          const encodedMessage = encodeURIComponent(whatsappMessage);
          const whatsappPhone = customerPhone.replace(/[\s+]/g, '');
          const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodedMessage}`;

          await supabase
            .from("orders")
            .update({
              notes: `WhatsApp send failed. Manual link: ${whatsappUrl}\nTracking: ${trackingUrl}`
            })
            .eq("id", orderId);
        } else {
          console.log("✅ WhatsApp notification sent successfully");

          // Store confirmation in notes
          await supabase
            .from("orders")
            .update({
              notes: `Tracking notification sent via WhatsApp to ${customerPhone}\nTracking URL: ${trackingUrl}`
            })
            .eq("id", orderId);
        }

      } catch (whatsappError) {
        console.error("⚠️ WhatsApp notification failed (non-critical):", whatsappError);
        // Don't fail the delivery if WhatsApp fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        deliveryId: deliveryData.id,
        trackingUrl: trackingUrl,
        status: deliveryData.status,
        estimatedPickupTime: deliveryData.pickup?.eta,
        estimatedDeliveryTime: deliveryData.dropoff?.eta
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Error creating Uber delivery:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to create delivery"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
