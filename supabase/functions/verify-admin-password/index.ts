const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => null);
    const password = typeof body?.password === "string" ? body.password : "";
    const expected = Deno.env.get("ADMIN_PANEL_PASSWORD") || "";

    if (!expected) {
      return new Response(JSON.stringify({ ok: false, error: "Senha mestre não configurada." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Comparação em tempo constante simples
    let mismatch = password.length === expected.length ? 0 : 1;
    const len = Math.max(password.length, expected.length);
    for (let i = 0; i < len; i++) {
      mismatch |= (password.charCodeAt(i) || 0) ^ (expected.charCodeAt(i) || 0);
    }

    if (mismatch !== 0) {
      // Pequeno delay anti brute-force
      await new Promise((r) => setTimeout(r, 600));
      return new Response(JSON.stringify({ ok: false }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Token simples (apenas pra marcar a sessão local). Não substitui auth.
    const token = crypto.randomUUID();
    return new Response(JSON.stringify({ ok: true, token }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[verify-admin-password]", err);
    return new Response(JSON.stringify({ ok: false, error: "Erro inesperado." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});