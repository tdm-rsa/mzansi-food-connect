// Register Yoco Webhook
// Run this script once to register the webhook endpoint with Yoco

const YOCO_SECRET_KEY = process.env.VITE_YOCO_SECRET_KEY;
const WEBHOOK_URL = "https://iuuckvthpmttrsutmvga.supabase.co/functions/v1/yoco-webhook";

if (!YOCO_SECRET_KEY) {
  console.error("❌ VITE_YOCO_SECRET_KEY environment variable not set");
  process.exit(1);
}

async function registerWebhook() {
  try {
    console.log("🔄 Registering webhook with Yoco...");
    console.log("Webhook URL:", WEBHOOK_URL);

    const response = await fetch("https://payments.yoco.com/api/webhooks", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${YOCO_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "mzansi-food-connect-orders",
        url: WEBHOOK_URL
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Failed to register webhook:", errorText);
      process.exit(1);
    }

    const data = await response.json();
    console.log("\n✅ Webhook registered successfully!");
    console.log("\n📋 Webhook Details:");
    console.log("ID:", data.id);
    console.log("Name:", data.name);
    console.log("URL:", data.url);
    console.log("Mode:", data.mode);
    console.log("\n🔐 IMPORTANT - Save this webhook secret:");
    console.log(data.secret);
    console.log("\n⚠️  You need to add this secret to your Supabase environment variables:");
    console.log("Variable name: YOCO_WEBHOOK_SECRET");
    console.log("Variable value:", data.secret);
    console.log("\nGo to: Supabase Dashboard → Settings → Edge Functions → Add new secret");

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

registerWebhook();
