// Edge function: valida e-mail via formato + lista de domínios descartáveis + DNS MX.
// Pública (sem JWT) — usada pela tela inicial pra bloquear e-mails falsos.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

// Lista enxuta de domínios descartáveis / temporários conhecidos
const DISPOSABLE_DOMAINS = new Set<string>([
  "mailinator.com", "yopmail.com", "tempmail.com", "tempmail.net", "10minutemail.com",
  "guerrillamail.com", "guerrillamail.info", "guerrillamail.biz", "sharklasers.com",
  "trashmail.com", "trashmail.net", "throwawaymail.com", "fakeinbox.com",
  "getnada.com", "nada.email", "maildrop.cc", "mintemail.com", "dispostable.com",
  "mohmal.com", "mytemp.email", "tempr.email", "spam4.me", "tempinbox.com",
  "emailondeck.com", "mailnesia.com", "mailcatch.com", "tmpmail.org", "tmpmail.net",
  "mailtemp.info", "fakemail.net", "anonbox.net", "burnermail.io", "moakt.com",
  "harakirimail.com", "inboxbear.com", "spambox.us", "mvrht.net",
  "tempail.com", "temp-mail.org", "temp-mail.io", "temp-mail.com",
  "mail-temp.com", "minutemail.com", "emltmp.com", "eml.pp.ua",
  "1secmail.com", "1secmail.net", "1secmail.org",
  "incognitomail.com", "yopmail.fr", "yopmail.net", "cool.fr.nf",
  "jetable.fr.nf", "nospam.ze.tc", "spambog.com", "spamgourmet.com",
  "tempemail.net", "throwaway.email", "wegwerfemail.de",
]);

type Result = {
  valid: boolean;
  reason?: "format" | "disposable" | "mx";
  message?: string;
};

async function checkMx(domain: string): Promise<boolean> {
  try {
    // Tenta MX primeiro
    const mx = await Deno.resolveDns(domain, "MX");
    if (Array.isArray(mx) && mx.length > 0) return true;
  } catch {
    // sem MX → tenta A/AAAA (RFC 5321 §5.1: A é fallback válido pra entrega)
  }
  try {
    const a = await Deno.resolveDns(domain, "A");
    if (Array.isArray(a) && a.length > 0) return true;
  } catch { /* ignore */ }
  try {
    const aaaa = await Deno.resolveDns(domain, "AAAA");
    if (Array.isArray(aaaa) && aaaa.length > 0) return true;
  } catch { /* ignore */ }
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const raw = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!raw || raw.length > 254) {
      const out: Result = { valid: false, reason: "format", message: "Informe um e-mail válido." };
      return new Response(JSON.stringify(out), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!EMAIL_RE.test(raw)) {
      const out: Result = { valid: false, reason: "format", message: "Informe um e-mail válido." };
      return new Response(JSON.stringify(out), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const domain = raw.split("@")[1];
    if (!domain || domain.includes("..") || domain.startsWith(".") || domain.endsWith(".")) {
      const out: Result = { valid: false, reason: "format", message: "Informe um e-mail válido." };
      return new Response(JSON.stringify(out), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (DISPOSABLE_DOMAINS.has(domain)) {
      const out: Result = {
        valid: false,
        reason: "disposable",
        message: "Use um e-mail pessoal válido.",
      };
      return new Response(JSON.stringify(out), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const hasMx = await checkMx(domain);
    if (!hasMx) {
      const out: Result = {
        valid: false,
        reason: "mx",
        message: "Este e-mail não existe. Verifique e tente novamente.",
      };
      return new Response(JSON.stringify(out), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Nível 3: ZeroBounce SMTP — só pra confirmar caixa real
    const zb = await checkZeroBounce(raw);
    if (zb.blocked) {
      const out: Result = {
        valid: false,
        reason: "smtp",
        message: zb.message || "Este e-mail não existe. Verifique e tente novamente.",
      };
      return new Response(JSON.stringify(out), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const out: Result = { valid: true };
    return new Response(JSON.stringify(out), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[validate-email] erro:", err);
    // Em caso de erro inesperado, NÃO bloqueia o usuário (fail-open)
    return new Response(JSON.stringify({ valid: true, fallback: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});