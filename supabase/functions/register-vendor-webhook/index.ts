// Register Vendor Webhook with Yoco
// Called when vendor saves their Yoco keys in dashboard

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
      yocoSecretKey
    } = await req.json();

    console.log("🔗 Registering webhook for store:", storeId);

    // Validate inputs
    if (!storeId || !yocoSecretKey) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: storeId, yocoSecretKey" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Ensure it's a LIVE key
    if (!yocoSecretKey.startsWith('sk_live_')) {
      return new Response(
        JSON.stringify({ error: "Only LIVE Yoco keys can register webhooks. Test keys are not supported." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get store info to verify ownership
    const { data: storeData, error: storeError } = await supabase
      .from("tenants")
      .select("name, yoco_webhook_id")
      .eq("id", storeId)
      .single();

    if (storeError || !storeData) {
      throw new Error("Store not found");
    }

    // If they already have a webhook registered, delete it first
    if (storeData.yoco_webhook_id) {
      console.log("🗑️ Deleting existing webhook:", storeData.yoco_webhook_id);

      try {
        await fetch(`https://payments.yoco.com/api/webhooks/${storeData.yoco_webhook_id}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${yocoSecretKey}`,
          }
        });
        console.log("✅ Deleted old webhook");
      } catch (deleteError) {
        console.warn("⚠️ Could not delete old webhook:", deleteError);
        // Continue anyway - they might have changed keys
      }
    }

    // Register new webhook with Yoco
    const webhookUrl = `${supabaseUrl}/functions/v1/yoco-webhook`;

    console.log("📡 Registering webhook at:", webhookUrl);

    const registerResponse = await fetch("https://payments.yoco.com/api/webhooks", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${yocoSecretKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: `${storeData.name}-orders`,
        url: webhookUrl
      })
    });

    if (!registerResponse.ok) {
      const errorData = await registerResponse.text();
      console.error("❌ Yoco webhook registration failed:", errorData);
      throw new Error(`Yoco webhook registration failed: ${errorData}`);
    }

    const webhookData = await registerResponse.json();

    console.log("✅ Webhook registered:", {
      id: webhookData.id,
      url: webhookData.url,
      mode: webhookData.mode
    });

    // Save webhook secret to database
    const { error: updateError } = await supabase
      .from("tenants")
      .update({
        yoco_webhook_secret: webhookData.secret,
        yoco_webhook_id: webhookData.id
      })
      .eq("id", storeId);

    if (updateError) {
      console.error("❌ Failed to save webhook secret:", updateError);
      throw new Error("Failed to save webhook secret to database");
    }

    console.log("✅✅✅ Webhook fully configured for store:", storeId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Webhook registered successfully",
        webhookId: webhookData.id,
        mode: webhookData.mode
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("❌ Error registering webhook:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to register webhook"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
