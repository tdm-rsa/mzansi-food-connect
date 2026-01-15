// Complete Test Order for Platinum Stores
// This simulates a successful payment without calling Yoco

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      orderNumber,
      storeId,
      storeName,
      storeSlug,
      customerName,
      customerPhone,
      items,
      total,
      orderType,
      deliveryAddress,
      deliveryFee
    } = await req.json();

    console.log("🧪 Test payment for order:", orderNumber);
    console.log("📦 Payload received:", {
      orderNumber,
      storeId,
      storeName,
      storeSlug,
      customerName,
      customerPhone,
      itemsCount: items?.length,
      total,
      orderType,
      deliveryAddress,
      deliveryFee
    });

    // Validate required fields
    if (!orderNumber || !storeId || !customerName || !customerPhone || !items || !total) {
      console.error("❌ Missing required fields");
      throw new Error("Missing required fields: orderNumber, storeId, customerName, customerPhone, items, or total");
    }

    // Initialize Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create the order directly (skip webhook)
    const orderData = {
      store_id: storeId,
      customer_name: customerName,
      phone: customerPhone,
      items: items,
      total: total,
      payment_reference: `test_${Date.now()}`,
      payment_status: 'paid',          // Align with live payment webhook behaviour
      order_number: orderNumber,
      status: 'pending',               // Valid order status; processing continues after this
      estimated_time: 0,
      order_type: orderType || 'pickup',
      delivery_address: orderType === 'delivery' ? (deliveryAddress || null) : null,
      delivery_fee: orderType === 'delivery' ? (deliveryFee || 0) : 0,
      delivery_status: orderType === 'delivery' ? 'pending' : null
    };

    console.log("📝 Creating order with data:", orderData);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([orderData])
      .select()
      .single();

    if (orderError) {
      console.error("❌ Failed to create order:", orderError);
      console.error("❌ Order error details:", JSON.stringify(orderError, null, 2));
      throw new Error(`Failed to create order: ${orderError.message || JSON.stringify(orderError)}`);
    }

    console.log("✅ Test order created:", order.id);

    // If it's a delivery order, create Uber delivery
    if (orderType === 'delivery' && deliveryAddress) {
      console.log("🚗 Creating Uber delivery for test order...");

      // Get store details for delivery
      const { data: storeData } = await supabase
        .from("tenants")
        .select("store_address, preparation_time_minutes")
        .eq("id", storeId)
        .single();

      try {
        const deliveryResponse = await supabase.functions.invoke('create-uber-delivery', {
          body: {
            orderId: order.id,
            storeId: storeId,
            storeName: storeName,
            storeAddress: storeData?.store_address || "123 Long Street, Cape Town, 8001",
            storePhone: "+27000000000",
            customerName: customerName,
            customerPhone: customerPhone,
            deliveryAddress: deliveryAddress,
            orderNumber: orderNumber,
            deliveryFee: deliveryFee || 25,
            preparationTime: storeData?.preparation_time_minutes || 30
          }
        });

        if (deliveryResponse.error) {
          console.error("⚠️ Uber delivery creation failed:", deliveryResponse.error);
          // Don't fail the order, just log it
        } else {
          console.log("✅ Uber delivery created for test order");
        }
      } catch (deliveryError) {
        console.error("⚠️ Uber delivery error (non-critical):", deliveryError);
      }
    }

    // Delete pending order
    await supabase
      .from("pending_orders")
      .delete()
      .eq("order_number", orderNumber);

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        orderNumber: orderNumber
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("❌ Test payment error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to complete test payment"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
