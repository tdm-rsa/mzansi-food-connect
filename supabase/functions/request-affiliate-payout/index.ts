// Request Affiliate Payout
// Sends email to admin when affiliate requests payout

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
    const { affiliateEmail, amount } = await req.json();

    if (!affiliateEmail || !amount) {
      return new Response(
        JSON.stringify({ error: "Missing affiliateEmail or amount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get affiliate data
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('*')
      .eq('email', affiliateEmail)
      .single();

    if (affiliateError || !affiliate) {
      throw new Error('Affiliate not found');
    }

    // Check if enough balance
    if (amount > affiliate.available_balance) {
      return new Response(
        JSON.stringify({ error: "Insufficient balance" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update requested_payout
    const { error: updateError } = await supabase
      .from('affiliates')
      .update({
        requested_payout: affiliate.requested_payout + amount,
        available_balance: affiliate.available_balance - amount
      })
      .eq('id', affiliate.id);

    if (updateError) throw updateError;

    // Create payout request record
    const adminEmail = Deno.env.get("ADMIN_EMAIL") || 'nqubeko377@gmail.com';
    const { error: payoutError } = await supabase
      .from('commission_payouts')
      .insert([{
        affiliate_id: affiliate.id,
        amount: amount,
        status: 'requested',
        requested_by_affiliate: true,
        admin_email: adminEmail,
        month_for: new Date().toISOString().substring(0, 7) + '-01',
        payment_method: 'eft'
      }]);

    if (payoutError) throw payoutError;

    // Audit log the payout request
    await supabase.rpc('log_platform_audit', {
      p_user_id: null,
      p_user_email: affiliateEmail,
      p_action: 'payout_requested',
      p_resource_type: 'commission_payout',
      p_resource_id: affiliate.id,
      p_details: { amount: amount, bank: affiliate.bank_name }
    });

    // Send email to admin
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    // Show full account number for immediate payment processing
    const accountNumber = affiliate.account_number || 'Not provided';

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
          subject: `💰 Affiliate Payout Request - R${amount.toFixed(2)}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .highlight { background: #fff; padding: 20px; border-left: 4px solid #f59e0b; margin: 20px 0; }
                .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                .amount { font-size: 2.5rem; font-weight: bold; color: #f59e0b; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0;">💰 Payout Request</h1>
                  <p style="margin: 10px 0 0 0; font-size: 18px;">Affiliate Commission Withdrawal</p>
                </div>
                <div class="content">
                  <div class="highlight">
                    <h2 style="margin-top: 0;">Request Details</h2>
                    <p><strong>Affiliate:</strong> ${affiliate.full_name}</p>
                    <p><strong>Email:</strong> ${affiliate.email}</p>
                    <p><strong>Phone:</strong> ${affiliate.phone}</p>
                    <p><strong>Referral Code:</strong> ${affiliate.referral_code}</p>
                  </div>

                  <div style="text-align: center; margin: 30px 0;">
                    <div style="color: #6b7280; font-size: 0.9rem; margin-bottom: 0.5rem;">Requested Amount</div>
                    <div class="amount">R${amount.toFixed(2)}</div>
                  </div>

                  <div class="highlight">
                    <h3 style="margin-top: 0;">🏦 Bank Details</h3>
                    <p><strong>Bank:</strong> ${affiliate.bank_name}</p>
                    <p><strong>Account Number:</strong> ${accountNumber}</p>
                    <p><strong>Account Type:</strong> ${affiliate.account_type}</p>
                    <p><strong>Branch Code:</strong> ${affiliate.branch_code || 'Universal'}</p>
                  </div>

                  <div class="highlight">
                    <h3 style="margin-top: 0;">📊 Affiliate Stats</h3>
                    <p><strong>Total Referrals:</strong> ${affiliate.total_referrals}</p>
                    <p><strong>Active Referrals:</strong> ${affiliate.active_referrals}</p>
                    <p><strong>Total Earned:</strong> R${affiliate.total_earned.toFixed(2)}</p>
                    <p><strong>Total Paid:</strong> R${affiliate.total_paid.toFixed(2)}</p>
                    <p><strong>Available Balance (after this):</strong> R${(affiliate.available_balance - amount).toFixed(2)}</p>
                  </div>

                  <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; color: #92400e;"><strong>⚡ Action Required:</strong></p>
                    <p style="margin: 5px 0 0 0; color: #92400e;">
                      Process EFT payment to the bank details above and mark as paid in your admin dashboard.
                    </p>
                  </div>

                  <div style="text-align: center; margin-top: 30px;">
                    <a href="https://app.mzansifoodconnect.app/admin-dashboard" class="button">Open Admin Dashboard</a>
                  </div>

                  <p style="margin-top: 30px; color: #6b7280; font-size: 0.9rem;">
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
        console.error("Failed to send email:", await emailResponse.text());
      } else {
        console.log("✅ Payout request email sent to admin");
      }
    } else {
      console.warn("⚠️ RESEND_API_KEY not configured");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payout request submitted successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Error processing payout request:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to process payout request"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
