// Complete Signup After Payment
// Creates user account with auto-confirmation and tenant record

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
    const { email, password, storeName, plan, referralCode } = await req.json();

    // Validate inputs
    if (!email || !password || !storeName || !plan) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase Admin client (service role)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log(`Creating account for ${email} with plan ${plan}...`);

    // Create user WITHOUT auto-confirm - requires email verification
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Require email confirmation
      user_metadata: {
        store_name: storeName,
        plan: plan,
        payment_completed: true
      }
    });

    if (userError) {
      console.error('User creation error:', userError);
      throw new Error(`Failed to create user: ${userError.message}`);
    }

    if (!userData.user) {
      throw new Error('No user data returned');
    }

    const userId = userData.user.id;
    console.log(`✅ User created: ${userId}`);

    // Generate email confirmation link
    const productionUrl = Deno.env.get("PRODUCTION_URL") || "https://app.mzansifoodconnect.app";
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: email,
      options: {
        redirectTo: `${productionUrl}/app`
      }
    });

    if (linkError) {
      console.error('Failed to generate confirmation link:', linkError);
    }

    const confirmationLink = linkData?.properties?.action_link || `${productionUrl}/app`;
    console.log(`✅ Confirmation link generated`);

    // Calculate plan expiration
    // Trial = forever (null), Paid plans = 30 days from now
    const expiresAt = plan === 'trial' ? null : (() => {
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date;
    })();

    // Generate slug from store name
    const slug = storeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);

    // Create tenant record with correct column names
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .insert([{
        owner_id: userId,
        name: storeName,
        business_name: storeName,
        slug: slug,
        owner_email: email,
        contact_email: email,
        plan: plan,
        plan_expires_at: expiresAt ? expiresAt.toISOString() : null,
        plan_started_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (tenantError) {
      console.error('Tenant creation error:', tenantError);
      // If tenant creation fails, delete the user
      await supabase.auth.admin.deleteUser(userId);
      throw new Error(`Failed to create store: ${tenantError.message}`);
    }

    console.log(`✅ Tenant created for ${storeName}`);

    // Create affiliate referral if referralCode provided (only for Pro/Premium, not trial)
    if (referralCode && plan !== 'trial') {
      try {
        console.log(`Looking up affiliate with code: ${referralCode}`);

        // Find affiliate by referral code
        const { data: affiliate, error: affiliateError } = await supabase
          .from('affiliates')
          .select('id')
          .eq('referral_code', referralCode)
          .eq('status', 'active')
          .single();

        if (affiliateError || !affiliate) {
          console.error(`⚠️ Affiliate not found for code ${referralCode}:`, affiliateError);
        } else {
          // Create referral record
          const { error: referralError } = await supabase
            .from('referrals')
            .insert([{
              affiliate_id: affiliate.id,
              store_id: tenantData.id,
              plan: plan,
              status: 'active', // Set to active since they just paid
              first_payment_date: new Date().toISOString(),
              commission_rate: 30.00, // 30%
              commission_duration_months: 12
            }]);

          if (referralError) {
            console.error(`⚠️ Failed to create referral record:`, referralError);
          } else {
            console.log(`✅ Referral record created for affiliate ${affiliate.id}`);
          }
        }
      } catch (referralError) {
        console.error('Error processing referral:', referralError);
        // Don't fail signup if referral tracking fails
      }
    }

    // Send welcome email via Resend
    try {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");

      if (resendApiKey) {
        const planName = plan.charAt(0).toUpperCase() + plan.slice(1);
        const planPrice = plan === 'trial' ? 'Free' : (plan === 'pro' ? 'R159' : 'R215');
        const isTrial = plan === 'trial';

        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: "Mzansi Food Connect <noreply@mzansifoodconnect.app>",
            to: email,
            subject: isTrial ? `Welcome to Mzansi Food Connect! 🎉` : `Welcome to Mzansi Food Connect ${planName} Plan! 🎉`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                  .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                  .highlight { background: #fff; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
                  .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                  .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1 style="margin: 0;">🎉 Welcome to Mzansi Food Connect!</h1>
                    <p style="margin: 10px 0 0 0; font-size: 18px;">Your ${planName} account is ready</p>
                  </div>
                  <div class="content">
                    <h2>Hi ${storeName}! 👋</h2>
                    <p>${isTrial ? 'Welcome to your <strong>Free Trial</strong> (Training Ground)! Perfect for learning the platform.' : `Your payment of <strong>${planPrice}/month</strong> has been successfully processed.`} Welcome to the Mzansi Food Connect family!</p>

                    <div class="highlight">
                      <h3 style="margin-top: 0;">✅ Your Account Details</h3>
                      <p><strong>Store Name:</strong> ${storeName}</p>
                      <p><strong>Email:</strong> ${email}</p>
                      <p><strong>Plan:</strong> ${planName} ${isTrial ? '(Free Forever)' : `(${planPrice}/month)`}</p>
                      <p><strong>Status:</strong> ${isTrial ? 'Active Forever - Training Mode' : 'Active for 30 days'}</p>
                    </div>

                    <h3>🚀 Confirm Your Email</h3>
                    <p>Please click the button below to confirm your email address and activate your account:</p>

                    <div style="text-align: center;">
                      <a href="${confirmationLink}" class="button">Confirm Email & Sign In</a>
                    </div>

                    <p style="font-size: 12px; color: #666; margin-top: 10px; text-align: center;">
                      This link will expire in 24 hours. If it expires, you can request a new one from the login page.
                    </p>

                    <h3>📋 Next Steps:</h3>
                    <ul>
                      <li>Add your products and menu items</li>
                      <li>Customize your store design</li>
                      <li>Set up your delivery options</li>
                      <li>Share your store link with customers</li>
                    </ul>

                    <div class="highlight">
                      <h3 style="margin-top: 0;">💡 Need Help?</h3>
                      <p>Contact our support team at <a href="mailto:support@mzansifoodconnect.app">support@mzansifoodconnect.app</a></p>
                    </div>

                    <p>Thank you for choosing Mzansi Food Connect. We're excited to help you grow your business! 🌟</p>
                  </div>
                  <div class="footer">
                    <p>Mzansi Food Connect - Empowering South African Food Businesses</p>
                    <p>${isTrial ? 'Trial plan never expires - Upgrade anytime!' : `Your plan will renew in 30 days for ${planPrice}`}</p>
                  </div>
                </div>
              </body>
              </html>
            `
          })
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.text();
          console.error("Failed to send welcome email:", errorData);
          // Don't fail the whole signup if email fails
        } else {
          console.log(`✅ Welcome email sent to ${email}`);
        }
      } else {
        console.log("⚠️ RESEND_API_KEY not configured, skipping welcome email");
      }
    } catch (emailError) {
      console.error("Error sending welcome email:", emailError);
      // Don't fail the whole signup if email fails
    }

    // Send admin notification email
    try {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      const adminEmail = Deno.env.get("ADMIN_EMAIL") || 'nqubeko377@gmail.com';
      const adminPhone = Deno.env.get("ADMIN_PHONE");

      if (resendApiKey) {
        const planName = plan.charAt(0).toUpperCase() + plan.slice(1);
        const planPrice = plan === 'trial' ? 'Free' : (plan === 'pro' ? 'R159/month' : 'R215/month');
        const signupTime = new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' });
        const planEmoji = plan === 'trial' ? '🆓' : (plan === 'pro' ? '🚀' : '👑');

        // Send admin email
        const adminEmailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: "Mzansi Food Connect <noreply@mzansifoodconnect.app>",
            to: adminEmail,
            subject: `${planEmoji} New ${planName} Signup - ${storeName}`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: ${plan === 'premium' ? 'linear-gradient(135deg, #ffd700 0%, #ff6b35 100%)' : plan === 'pro' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                  .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                  .highlight { background: #fff; padding: 20px; border-left: 4px solid ${plan === 'premium' ? '#ffd700' : plan === 'pro' ? '#667eea' : '#10b981'}; margin: 20px 0; }
                  .stats { display: flex; gap: 20px; margin: 20px 0; }
                  .stat { background: #fff; padding: 15px; border-radius: 8px; text-align: center; flex: 1; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1 style="margin: 0;">${planEmoji} New ${planName} Signup!</h1>
                    <p style="margin: 10px 0 0 0; font-size: 18px;">${storeName}</p>
                  </div>
                  <div class="content">
                    <div class="highlight">
                      <h3 style="margin-top: 0;">New Store Details</h3>
                      <p><strong>Store Name:</strong> ${storeName}</p>
                      <p><strong>Email:</strong> ${email}</p>
                      <p><strong>Plan:</strong> ${planName} (${planPrice})</p>
                      <p><strong>Signup Time:</strong> ${signupTime}</p>
                      ${referralCode ? `<p><strong>Referral Code Used:</strong> ${referralCode}</p>` : ''}
                    </div>

                    <div style="text-align: center; margin-top: 30px;">
                      <a href="https://app.mzansifoodconnect.app/admin" style="display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 6px;">View in Admin Dashboard</a>
                    </div>

                    <p style="margin-top: 30px; color: #6b7280; font-size: 0.9rem; text-align: center;">
                      This is an automated notification from Mzansi Food Connect.
                    </p>
                  </div>
                </div>
              </body>
              </html>
            `
          })
        });

        if (!adminEmailResponse.ok) {
          console.error("Failed to send admin email:", await adminEmailResponse.text());
        } else {
          console.log(`✅ Admin notification email sent for ${storeName}`);
        }
      }

      // Send admin WhatsApp notification via Ultramsg
      const instanceId = Deno.env.get("VITE_ULTRAMSG_INSTANCE_ID");
      const token = Deno.env.get("VITE_ULTRAMSG_TOKEN");

      if (instanceId && token && adminPhone) {
        const planName = plan.charAt(0).toUpperCase() + plan.slice(1);
        const planPrice = plan === 'trial' ? 'Free' : (plan === 'pro' ? 'R159/month' : 'R215/month');
        const planEmoji = plan === 'trial' ? '🆓' : (plan === 'pro' ? '🚀' : '👑');
        const signupTime = new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' });

        const whatsappMessage = `${planEmoji} *NEW ${planName.toUpperCase()} SIGNUP*

📍 *Store:* ${storeName}
📧 *Email:* ${email}
💰 *Plan:* ${planName} (${planPrice})
🕐 *Time:* ${signupTime}
${referralCode ? `🔗 *Referral:* ${referralCode}` : ''}

🎉 Congrats! Your platform is growing!`;

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
          console.log(`✅ Admin WhatsApp notification sent for ${storeName}`);
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

    } catch (adminNotifError) {
      console.error("Error sending admin notification:", adminNotifError);
      // Don't fail signup if admin notification fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId: userId,
        message: 'Account created successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Error completing signup:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to complete signup"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
