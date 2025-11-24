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
    const { email, password, storeName, plan } = await req.json();

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

    // Create user with auto-confirm using Admin API
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
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

    // Calculate plan expiration (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Create tenant record
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .insert([{
        id: userId,
        store_name: storeName,
        email: email,
        plan: plan,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
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
