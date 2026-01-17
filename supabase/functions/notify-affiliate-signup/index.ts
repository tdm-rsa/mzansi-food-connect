// Notify Admin of New Affiliate Signup
// Sends email and WhatsApp notification when a new affiliate joins

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
    const { fullName, email, phone, bankName, referralCode } = await req.json();

    // Validate inputs
    if (!fullName || !email || !referralCode) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const adminEmail = Deno.env.get("ADMIN_EMAIL") || 'nqubeko377@gmail.com';
    const adminPhone = Deno.env.get("ADMIN_PHONE");
    const signupTime = new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' });

    // Send admin email notification
    if (resendApiKey) {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "Mzansi Food Connect <noreply@mzansifoodconnect.app>",
          to: adminEmail,
          subject: `💼 New Affiliate Signup - ${fullName}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .highlight { background: #fff; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0;">💼 New Affiliate!</h1>
                  <p style="margin: 10px 0 0 0; font-size: 18px;">${fullName} joined the program</p>
                </div>
                <div class="content">
                  <div class="highlight">
                    <h3 style="margin-top: 0;">Affiliate Details</h3>
                    <p><strong>Name:</strong> ${fullName}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                    <p><strong>Bank:</strong> ${bankName || 'Not provided'}</p>
                    <p><strong>Referral Code:</strong> ${referralCode}</p>
                    <p><strong>Signup Time:</strong> ${signupTime}</p>
                  </div>

                  <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; color: #065f46;">
                      <strong>🎯 Referral Link:</strong><br/>
                      <code style="background: #d1fae5; padding: 5px 10px; border-radius: 4px; display: inline-block; margin-top: 8px;">
                        https://mzansifoodconnect.app/signup?ref=${referralCode}
                      </code>
                    </p>
                  </div>

                  <div style="text-align: center; margin-top: 30px;">
                    <a href="https://app.mzansifoodconnect.app/admin" style="display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 6px;">View in Admin Dashboard</a>
                  </div>

                  <p style="margin-top: 30px; color: #6b7280; font-size: 0.9rem; text-align: center;">
                    This is an automated notification from Mzansi Food Connect Affiliate Program.
                  </p>
                </div>
              </div>
            </body>
            </html>
          `
        })
      });

      if (!emailResponse.ok) {
        console.error("Failed to send admin email:", await emailResponse.text());
      } else {
        console.log(`✅ Admin email sent for new affiliate: ${fullName}`);
      }
    }

    // Send admin WhatsApp notification via Ultramsg
    const instanceId = Deno.env.get("VITE_ULTRAMSG_INSTANCE_ID");
    const token = Deno.env.get("VITE_ULTRAMSG_TOKEN");

    if (instanceId && token && adminPhone) {
      const whatsappMessage = `💼 *NEW AFFILIATE SIGNUP*

👤 *Name:* ${fullName}
📧 *Email:* ${email}
📱 *Phone:* ${phone || 'Not provided'}
🏦 *Bank:* ${bankName || 'Not provided'}
🔗 *Code:* ${referralCode}
🕐 *Time:* ${signupTime}

🎉 Your affiliate network is growing!`;

      const apiUrl = `https://api.ultramsg.com/${instanceId}/messages/chat`;
      const payload = new URLSearchParams({
        token: token,
        to: adminPhone,
        body: whatsappMessage,
      });

      const waResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: payload,
      });

      if (waResponse.ok) {
        console.log(`✅ Admin WhatsApp sent for new affiliate: ${fullName}`);
      } else {
        console.error("Failed to send admin WhatsApp:", await waResponse.text());
      }
    } else {
      if (!adminPhone) {
        console.log("⚠️ ADMIN_PHONE not configured, skipping WhatsApp notification");
      } else {
        console.log("⚠️ Ultramsg credentials not configured, skipping WhatsApp notification");
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Admin notified successfully' }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error notifying admin:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to notify admin" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
