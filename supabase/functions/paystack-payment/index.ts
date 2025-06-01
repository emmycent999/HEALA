
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { plan, email } = await req.json();
    
    const paystackSecretKey = Deno.env.get("Paystack Live Secret Key");
    if (!paystackSecretKey) {
      throw new Error("Paystack secret key not configured");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get auth user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    
    if (!user) throw new Error("User not authenticated");

    // Plan pricing
    const planPrices = {
      basic: 500000, // 5000 NGN in kobo
      premium: 1000000, // 10000 NGN in kobo
      enterprise: 2000000 // 20000 NGN in kobo
    };

    const amount = planPrices[plan as keyof typeof planPrices] || planPrices.basic;

    // Initialize Paystack transaction
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${paystackSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount,
        currency: "NGN",
        plan: plan,
        callback_url: `${req.headers.get("origin")}/payment-success`,
        metadata: {
          user_id: user.id,
          plan: plan
        }
      })
    });

    const data = await response.json();

    if (data.status) {
      // Save subscription record
      await supabaseClient.from("subscriptions").upsert({
        user_id: user.id,
        plan_name: plan,
        amount: amount / 100, // Convert from kobo to naira
        status: 'pending',
        paystack_subscription_code: data.data.reference
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          authorization_url: data.data.authorization_url,
          reference: data.data.reference 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      throw new Error(data.message || "Payment initialization failed");
    }

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
