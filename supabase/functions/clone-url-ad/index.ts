// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FIRECRAWL_V2 = "https://api.firecrawl.dev/v2";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function randomSuffix(len = 6): string {
  return Math.random().toString(36).slice(2, 2 + len);
}

/**
 * Pós-processa o HTML cru: remove scripts/iframes de tracking, banners de cookies,
 * mantém estrutura visual e injeta uma <base> tag para resolver assets relativos.
 */
function cleanHtml(rawHtml: string, sourceUrl: string): string {
  let html = rawHtml;

  // Remove script tags inteiros
  html = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  // Remove noscript
  html = html.replace(/<noscript[\s\S]*?<\/noscript>/gi, "");
  // Remove iframes (geralmente ads / trackers)
  html = html.replace(/<iframe[\s\S]*?<\/iframe>/gi, "");
  // Remove event handlers inline (onclick, onload, etc)
  html = html.replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "");
  html = html.replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "");
  // Remove links de preconnect a trackers comuns
  html = html.replace(
    /<link[^>]+(google-analytics|googletagmanager|facebook|hotjar|clarity)[^>]*>/gi,
    "",
  );

  // Tenta injetar uma <base> tag para resolver URLs relativas
  try {
    const u = new URL(sourceUrl);
    const base = `<base href="${u.origin}${u.pathname.replace(/[^/]*$/, "")}">`;
    if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/<head([^>]*)>/i, `<head$1>${base}`);
    } else if (/<html[^>]*>/i.test(html)) {
      html = html.replace(/<html([^>]*)>/i, `<html$1><head>${base}</head>`);
    } else {
      html = `<!DOCTYPE html><html><head>${base}</head><body>${html}</body></html>`;
    }
  } catch {
    // ignore
  }

  return html;
}

interface FirecrawlResult {
  html?: string;
  rawHtml?: string;
  markdown?: string;
  metadata?: {
    title?: string;
    description?: string;
    ogImage?: string;
    sourceURL?: string;
  };
  data?: any;
}

async function scrapeWithFirecrawl(
  url: string,
  apiKey: string,
): Promise<FirecrawlResult> {
  const res = await fetch(`${FIRECRAWL_V2}/scrape`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: ["html", "markdown"],
      onlyMainContent: false,
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    const msg = json?.error || json?.message || `Firecrawl ${res.status}`;
    throw new Error(msg);
  }

  // Firecrawl v2 pode retornar o payload em `data` ou no nível raiz
  return (json?.data ?? json) as FirecrawlResult;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    // 1. Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing Authorization header" }, 401);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
      Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY",
    )!;
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");

    if (!FIRECRAWL_API_KEY) {
      return jsonResponse(
        { error: "FIRECRAWL_API_KEY is not configured" },
        500,
      );
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await userClient.auth
      .getUser();
    if (userError || !userData.user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    const user = userData.user;

    // 2. Validate input
    let body: { url?: string };
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const sourceUrl = body.url?.trim();
    if (!sourceUrl || !isValidUrl(sourceUrl)) {
      return jsonResponse({ error: "URL inválida" }, 400);
    }

    // 3. Scrape
    let scrapeResult: FirecrawlResult;
    try {
      scrapeResult = await scrapeWithFirecrawl(sourceUrl, FIRECRAWL_API_KEY);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro no scrape";
      console.error("Firecrawl error:", msg);
      return jsonResponse(
        { error: `Falha ao raspar a URL: ${msg}` },
        502,
      );
    }

    const rawHtml = scrapeResult.html || scrapeResult.rawHtml || "";
    if (!rawHtml) {
      return jsonResponse(
        { error: "Não foi possível extrair o HTML da página" },
        422,
      );
    }

    const cleanedHtml = cleanHtml(rawHtml, sourceUrl);
    const meta = scrapeResult.metadata ?? {};
    const title = (meta.title || "Anúncio clonado").slice(0, 200);
    const thumbnail = meta.ogImage || null;

    // 4. Slug único
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const baseSlug = slugify(title) || "anuncio";
    let slug = `${baseSlug}-${randomSuffix()}`;

    for (let i = 0; i < 3; i++) {
      const { data: existing } = await adminClient
        .from("ads")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!existing) break;
      slug = `${baseSlug}-${randomSuffix()}`;
    }

    // 5. Insert
    const { data: ad, error: insertError } = await adminClient
      .from("ads")
      .insert({
        owner_id: user.id,
        title,
        slug,
        status: "draft",
        source_url: sourceUrl,
        original_html: cleanedHtml,
        edited_html: cleanedHtml,
        thumbnail_url: thumbnail,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return jsonResponse({ error: insertError.message }, 500);
    }

    return jsonResponse({ ad });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Unhandled error:", msg);
    return jsonResponse({ error: msg }, 500);
  }
});
