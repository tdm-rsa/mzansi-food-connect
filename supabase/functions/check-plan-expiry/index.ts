// Daily Cron Job: Check plan expiry and send reminder emails
// Runs every day at 9 AM to check for plans expiring soon

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
    const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));

    console.log("🔍 Checking plan expiries...", now.toISOString());

    // Get all stores with expiring plans
    const { data: stores, error } = await supabase
      .from("tenants")
      .select("id, name, owner_id, plan, plan_expires_at, slug")
      .not("plan_expires_at", "is", null)
      .in("plan", ["pro", "premium"]);

    if (error) throw error;

    console.log(`Found ${stores?.length || 0} stores with expiring plans`);

    const emailsSent = {
      sevenDay: 0,
      threeDay: 0,
      expired: 0,
      graceDay1: 0,
      graceDay2: 0,
      graceDay3: 0
    };

    for (const store of stores || []) {
      const expiresAt = new Date(store.plan_expires_at);
      const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Get user email
      const { data: userData } = await supabase.auth.admin.getUserById(store.owner_id);
      if (!userData?.user?.email) continue;

      const userEmail = userData.user.email;
      const planPrice = store.plan === "pro" ? 135 : 185;
      const planName = store.plan.charAt(0).toUpperCase() + store.plan.slice(1);
      const renewalUrl = `https://app.mzansifoodconnect.app`;

      // Check if email already sent today for this store
      const today = now.toISOString().split('T')[0];
      const { data: existingEmail } = await supabase
        .from("expiry_emails_sent")
        .select("id")
        .eq("store_id", store.id)
        .gte("sent_at", `${today}T00:00:00`)
        .single();

      if (existingEmail) {
        console.log(`Already sent email for ${store.name} today`);
        continue;
      }

      let emailType = null;
      let subject = "";
      let html = "";

      // 7 days before expiry
      if (daysUntilExpiry === 7) {
        emailType = "7_day_reminder";
        subject = `Your ${planName} plan renews in 7 days - ${store.name}`;
        html = get7DayEmail(planName, planPrice, store.name, renewalUrl);
        emailsSent.sevenDay++;
      }
      // 3 days before expiry
      else if (daysUntilExpiry === 3) {
        emailType = "3_day_reminder";
        subject = `⚠️ ${planName} plan expires in 3 days - Action Required`;
        html = get3DayEmail(planName, planPrice, store.name, renewalUrl);
        emailsSent.threeDay++;
      }
      // Expired (day 0)
      else if (daysUntilExpiry === 0) {
        emailType = "expired";
        subject = `❌ Your ${planName} plan has expired - Renew to restore access`;
        html = getExpiredEmail(planName, planPrice, store.name, renewalUrl);
        emailsSent.expired++;
      }
      // Grace period (days -1, -2, -3)
      else if (daysUntilExpiry === -1) {
        emailType = "grace_day_1";
        subject = `⏰ Final Warning: ${planName} access ends in 2 days`;
        html = getGracePeriodEmail(1, planName, store.name, renewalUrl);
        emailsSent.graceDay1++;
      }
      else if (daysUntilExpiry === -2) {
        emailType = "grace_day_2";
        subject = `🚨 Last Chance: ${planName} access ends tomorrow`;
        html = getGracePeriodEmail(2, planName, store.name, renewalUrl);
        emailsSent.graceDay2++;
      }
      else if (daysUntilExpiry === -3) {
        emailType = "grace_day_3_final";
        subject = `❌ FINAL NOTICE: ${planName} access ends today`;
        html = getGracePeriodEmail(3, planName, store.name, renewalUrl);
        emailsSent.graceDay3++;
      }

      if (emailType && subject && html) {
        // Send email via your email service (e.g., SendGrid, Resend, etc.)
        // For now, we'll log it and save to database
        console.log(`📧 Sending ${emailType} to ${userEmail} for ${store.name}`);

        // TODO: Integrate with your email provider here
        // Example with Resend:
        /*
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: "Mzansi Food Connect <noreply@mzansifoodconnect.app>",
            to: userEmail,
            subject: subject,
            html: html
          })
        });
        */

        // Log email sent
        await supabase
          .from("expiry_emails_sent")
          .insert({
            store_id: store.id,
            email_type: emailType,
            sent_to: userEmail,
            sent_at: now.toISOString()
          });
      }
    }

    console.log("✅ Expiry check complete:", emailsSent);

    return new Response(
      JSON.stringify({
        success: true,
        checked: stores?.length || 0,
        emailsSent
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error checking expiries:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
});

// Email template functions
function get7DayEmail(planName: string, planPrice: number, storeName: string, renewalUrl: string) {
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1>📅 Renewal Reminder</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2>Hi there,</h2>
          <p>Your <strong>${planName} plan</strong> for <strong>${storeName}</strong> renews in <strong>7 days</strong>.</p>
          <p><strong>Renewal Details:</strong></p>
          <ul>
            <li>Plan: ${planName}</li>
            <li>Price: R${planPrice}/month</li>
            <li>Renews: In 7 days</li>
          </ul>
          <a href="${renewalUrl}" style="display: inline-block; background: #ff6b35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0;">Manage Subscription →</a>
        </div>
      </div>
    </body>
    </html>
  `;
}

function get3DayEmail(planName: string, planPrice: number, storeName: string, renewalUrl: string) {
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1>⚠️ Urgent: Plan Expires Soon</h1>
        </div>
        <div style="background: #fff3e0; padding: 30px; border-radius: 0 0 8px 8px; border: 2px solid #ff9800;">
          <h2>Action Required</h2>
          <p>Your <strong>${planName} plan</strong> for <strong>${storeName}</strong> expires in <strong>3 days</strong>!</p>
          <div style="background: #fff; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0;">
            <p><strong>⏰ What happens if you don't renew:</strong></p>
            <ul>
              <li>Your online store will stop accepting orders</li>
              <li>Customers won't be able to view your menu</li>
              <li>You'll lose access to analytics</li>
            </ul>
          </div>
          <a href="${renewalUrl}" style="display: inline-block; background: #ff6b35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0;">Renew Now (R${planPrice}) →</a>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getExpiredEmail(planName: string, planPrice: number, storeName: string, renewalUrl: string) {
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #d32f2f 0%, #c62828 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1>❌ Plan Expired</h1>
        </div>
        <div style="background: #ffebee; padding: 30px; border-radius: 0 0 8px 8px; border: 2px solid #d32f2f;">
          <h2>Your ${planName} plan has expired</h2>
          <p>Your <strong>${storeName}</strong> store is currently in grace period (3 days).</p>
          <div style="background: #fff; border-left: 4px solid #d32f2f; padding: 15px; margin: 20px 0;">
            <p><strong>🚫 Current restrictions:</strong></p>
            <ul>
              <li>Warning banner on dashboard</li>
              <li>3 days to renew before full shutdown</li>
            </ul>
          </div>
          <a href="${renewalUrl}" style="display: inline-block; background: #d32f2f; color: white; padding: 14px 35px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0;">Renew Now & Restore Access →</a>
          <p style="margin-top: 30px; background: #fff; padding: 15px; border-radius: 6px;">
            💡 <strong>Your data is safe!</strong> Renew anytime to restore access.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getGracePeriodEmail(day: number, planName: string, storeName: string, renewalUrl: string) {
  const daysLeft = 3 - day;
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #e65100 0%, #d84315 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1>⏰ Grace Period Active</h1>
        </div>
        <div style="background: #ffe0b2; padding: 30px; border-radius: 0 0 8px 8px; border: 2px solid #e65100;">
          <h2>Your ${planName} plan expired</h2>
          <div style="background: #fff; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h3 style="margin: 0; color: #e65100; font-size: 32px;">${daysLeft}</h3>
            <p style="margin: 5px 0 0 0;">Days until full shutdown</p>
          </div>
          <p><strong>What happens after grace period:</strong></p>
          <ul>
            <li>❌ Complete dashboard access blocked</li>
            <li>❌ Store hidden from customers</li>
            <li>❌ No new orders accepted</li>
          </ul>
          <a href="${renewalUrl}" style="display: inline-block; background: #e65100; color: white; padding: 14px 35px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0;">Renew Now to Avoid Shutdown →</a>
        </div>
      </div>
    </body>
    </html>
  `;
}
