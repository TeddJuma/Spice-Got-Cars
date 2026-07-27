import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://deno.land/x/resend@0.0.0/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("OK", { headers: corsHeaders });
  }

  try {
    const { make, model, year, askingPrice, sellerName, sellerPhone, submissionId } = await req.json();

    const data = await resend.emails.send({
      from: "Spice Got Cars <noreply@spicegotcars.co.ke>",
      to: [Deno.env.get("OWNER_EMAIL") || "spicegotcars@gmail.com"],
      subject: `New Sell Submission: ${year} ${make} ${model}`,
      html: `
        <h2>New Car Sell Submission</h2>
        <p><strong>Vehicle:</strong> ${year} ${make} ${model}</p>
        <p><strong>Asking Price:</strong> KES ${askingPrice.toLocaleString()}</p>
        <p><strong>Seller:</strong> ${sellerName}</p>
        <p><strong>Phone:</strong> ${sellerPhone}</p>
        <p><strong>Submission ID:</strong> ${submissionId}</p>
        <p><a href="${Deno.env.get("SITE_URL") || "http://localhost:8081"}/admin">Go to Admin Dashboard</a></p>
      `,
    });

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
