// Send WhatsApp Messages via Ultramsg API
// This function securely handles WhatsApp messaging without exposing credentials

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
      phoneNumber,
      message,
      messageType, // 'confirmation', 'ready', 'fetched', 'custom'
      // Optional context for templated messages
      customerName,
      orderNumber,
      storeName,
      estimatedTime,
      totalAmount,
      storeSlug,
      customText
    } = await req.json();

    // Validate inputs
    if (!phoneNumber || (!message && !messageType)) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: phoneNumber and (message or messageType)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Ultramsg credentials from environment
    const instanceId = Deno.env.get("VITE_ULTRAMSG_INSTANCE_ID");
    const token = Deno.env.get("VITE_ULTRAMSG_TOKEN");

    if (!instanceId || !token) {
      console.warn('⚠️ Ultramsg credentials not configured');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'WhatsApp credentials not configured'
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format phone number (remove spaces, dashes)
    const formattedPhone = phoneNumber.replace(/[\s\-]/g, '');

    // Ensure it starts with +27 (Ultramsg requires + prefix)
    let finalPhone = formattedPhone;

    // If it already has +, keep it
    if (finalPhone.startsWith('+27')) {
      // Already correct format
      finalPhone = finalPhone;
    } else if (finalPhone.startsWith('27')) {
      // Add + prefix
      finalPhone = `+${finalPhone}`;
    } else if (finalPhone.startsWith('0')) {
      // Replace 0 with +27
      finalPhone = `+27${finalPhone.slice(1)}`;
    } else {
      // Just add +27
      finalPhone = `+27${finalPhone}`;
    }

    // Build message based on type
    let finalMessage = message;

    if (messageType) {
      const storeUrl = storeSlug ? `https://${storeSlug}.mzansifoodconnect.app` : '';

      switch (messageType) {
        case 'confirmation':
          finalMessage = `Hi ${customerName}! 👋

Your order from *${storeName}* has been confirmed! ✅

📦 Order #${orderNumber}
⏱️ Ready in: ${estimatedTime} minutes
💰 Total: R${totalAmount}

Thank you for your order! We'll notify you when it's ready for pickup.

${storeUrl ? `\n🛒 Order again: ${storeUrl}` : ''}`;
          break;

        case 'ready':
          finalMessage = `Hi ${customerName}! 🎉

Great news! Your order from *${storeName}* is ready for pickup! ✅

📦 Order #${orderNumber}
📍 Come collect at ${storeName}

See you soon! 😊

${storeUrl ? `\n🛒 Order again: ${storeUrl}` : ''}`;
          break;

        case 'fetched':
          finalMessage = `Thank you for collecting your order, ${customerName}! 🙏

We hope you enjoy your meal from *${storeName}*! 🍽️

📦 Order #${orderNumber}

We'd love to see you again soon! ❤️

${storeUrl ? `\n🛒 Order again: ${storeUrl}` : ''}`;
          break;

        case 'custom':
          finalMessage = `Hi ${customerName}! 👋

${customText}

- ${storeName}

${storeUrl ? `\n🛒 Visit us: ${storeUrl}` : ''}`;
          break;

        default:
          return new Response(
            JSON.stringify({ error: "Invalid messageType" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
      }
    }

    // Ultramsg API endpoint
    const apiUrl = `https://api.ultramsg.com/${instanceId}/messages/chat`;

    // Ultramsg expects x-www-form-urlencoded
    const payload = new URLSearchParams({
      token: token,
      to: finalPhone,
      body: finalMessage,
    });

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: payload,
    });

    const data = await response.json();

    if (response.ok && (data.sent === 'true' || data.status === 'success' || data.sent === true)) {
      console.log('✅ WhatsApp message sent successfully to', finalPhone);
      return new Response(
        JSON.stringify({ success: true, data, phoneNumber: finalPhone }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      console.error('❌ Failed to send WhatsApp message:', { status: response.status, data });

      // Even if Ultramsg says failed, return success to not break the flow
      // Log the error but don't prevent order completion
      console.warn('⚠️ WhatsApp send may have failed but continuing order flow');

      return new Response(
        JSON.stringify({
          success: true, // Changed to true to not break order flow
          warning: 'WhatsApp message may not have been delivered',
          error: data.error || data.message || `HTTP ${response.status}`,
          phoneNumber: finalPhone
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to send WhatsApp message"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
