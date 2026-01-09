// Notify Vendor When Customer Sends Message
// Triggered by database webhook when notification or general_question is inserted

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const payload = await req.json();

    console.log("📬 New message webhook received:", payload.type);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const record = payload.record;
    const table = payload.table;

    console.log("📋 Table:", table);
    console.log("📝 Record:", JSON.stringify(record, null, 2));

    // Get store/tenant info to get vendor WhatsApp number
    const { data: storeData, error: storeError } = await supabase
      .from("tenants")
      .select("vendor_whatsapp_number, name")
      .eq("id", record.store_id)
      .single();

    if (storeError || !storeData) {
      console.log("⚠️ Store not found or error:", storeError);
      return new Response(JSON.stringify({ success: true, message: "Store not found" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!storeData.vendor_whatsapp_number) {
      console.log("⚠️ No vendor WhatsApp number configured");
      return new Response(JSON.stringify({ success: true, message: "No WhatsApp number" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`📱 Sending vendor notification to ${storeData.vendor_whatsapp_number}`);

    // Build message based on table type
    let message = "";

    if (table === "notifications") {
      // Product question
      message = `🔔 *New Customer Message!*\n\nYou have a new product question from *${record.customer_name}*\n\n📞 Phone: ${record.customer_phone}\n💬 Message: ${record.message}\n\n👉 Go to your dashboard to reply!\n\n- ${storeData.name}`;
    } else if (table === "general_questions") {
      // General question
      message = `🔔 *New Customer Question!*\n\nYou have a new general inquiry from *${record.customer_name}*\n\n📞 Phone: ${record.customer_phone}\n💬 Question: ${record.question}\n\n👉 Go to your dashboard to answer!\n\n- ${storeData.name}`;
    } else {
      console.log("⚠️ Unknown table type:", table);
      return new Response(JSON.stringify({ success: true, message: "Unknown table" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Send WhatsApp notification
    const whatsappResponse = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`
      },
      body: JSON.stringify({
        phoneNumber: storeData.vendor_whatsapp_number,
        message: message
      })
    });

    if (whatsappResponse.ok) {
      console.log("✅ Vendor notification sent successfully");
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      const errorData = await whatsappResponse.text();
      console.log("⚠️ Vendor notification may have failed:", errorData);

      // Return success anyway to not break the flow
      return new Response(JSON.stringify({ success: true, warning: "WhatsApp may have failed" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

  } catch (error) {
    console.error("❌ Error in notify-vendor-message:", error);

    // Return success to not break customer flow
    return new Response(JSON.stringify({
      success: true,
      error: error.message
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
});
