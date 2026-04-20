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
 * Resolve uma URL (possivelmente relativa ou protocol-relative) contra a base.
 * Retorna a string original se a resolução falhar.
 */
function absolutize(value: string, base: URL): string {
  const v = value.trim();
  if (!v) return v;
  if (v.startsWith("data:") || v.startsWith("blob:") || v.startsWith("#") || v.startsWith("mailto:") || v.startsWith("tel:") || v.startsWith("javascript:")) {
    return v;
  }
  try {
    return new URL(v, base).toString();
  } catch {
    return v;
  }
}

/**
 * Reescreve um srcset absolutizando cada URL.
 */
function absolutizeSrcset(srcset: string, base: URL): string {
  return srcset
    .split(",")
    .map((part) => {
      const trimmed = part.trim();
      if (!trimmed) return "";
      const segs = trimmed.split(/\s+/);
      const url = segs.shift() || "";
      const desc = segs.join(" ");
      const abs = absolutize(url, base);
      return desc ? `${abs} ${desc}` : abs;
    })
    .filter(Boolean)
    .join(", ");
}

const TRACKER_PATTERNS = [
  "google-analytics",
  "googletagmanager",
  "gtag/js",
  "doubleclick",
  "facebook.net",
  "connect.facebook",
  "hotjar",
  "clarity.ms",
  "segment.com",
  "mixpanel",
  "amplitude",
  "newrelic",
  "datadog",
  "sentry",
  "tiktok",
  "criteo",
  "taboola",
  "outbrain",
];

function isTrackerUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return TRACKER_PATTERNS.some((p) => lower.includes(p));
}

/**
 * Pós-processa o HTML cru:
 * - PRESERVA <link rel="stylesheet"> e CSS inline (visual)
 * - Remove apenas scripts/iframes de trackers conhecidos
 * - Mantém scripts inline e libs (alguns sites injetam estilos via JS)
 * - Absolutiza href/src/srcset/poster/data-src para URLs absolutas
 * - Injeta <base> como fallback
 */
function cleanHtml(rawHtml: string, sourceUrl: string): string {
  let html = rawHtml;
  let base: URL;
  try {
    base = new URL(sourceUrl);
  } catch {
    return rawHtml;
  }

  // 1. Remove noscript (atrapalha em iframes)
  html = html.replace(/<noscript[\s\S]*?<\/noscript>/gi, "");

  // 2. Remove scripts de trackers (mantém os outros)
  html = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (full, attrs, body) => {
    const srcMatch = /src\s*=\s*["']([^"']+)["']/i.exec(attrs);
    if (srcMatch && isTrackerUrl(srcMatch[1])) return "";
    if (!srcMatch && isTrackerUrl(body)) return "";
    return full;
  });

  // 3. Remove iframes de trackers (mantém vídeos do youtube etc.)
  html = html.replace(/<iframe\b[^>]*src\s*=\s*["']([^"']+)["'][^>]*>[\s\S]*?<\/iframe>/gi, (full, src) => {
    return isTrackerUrl(src) ? "" : full;
  });

  // 4. Remove links a trackers
  html = html.replace(/<link\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi, (full, href) => {
    return isTrackerUrl(href) ? "" : full;
  });

  // 5. Absolutiza atributos de URL
  const urlAttrs = ["href", "src", "data-src", "data-original", "poster", "action"];
  for (const attr of urlAttrs) {
    const re = new RegExp(`(\\s${attr})\\s*=\\s*"([^"]+)"`, "gi");
    html = html.replace(re, (_m, name, val) => `${name}="${absolutize(val, base)}"`);
    const re2 = new RegExp(`(\\s${attr})\\s*=\\s*'([^']+)'`, "gi");
    html = html.replace(re2, (_m, name, val) => `${name}='${absolutize(val, base)}'`);
  }

  // 6. Absolutiza srcset
  html = html.replace(/(\ssrcset)\s*=\s*"([^"]+)"/gi, (_m, name, val) => `${name}="${absolutizeSrcset(val, base)}"`);
  html = html.replace(/(\ssrcset)\s*=\s*'([^']+)'/gi, (_m, name, val) => `${name}='${absolutizeSrcset(val, base)}'`);

  // 7. Absolutiza url(...) dentro de <style> e style="..."
  const rewriteCssUrls = (css: string) =>
    css.replace(/url\(\s*(['"]?)([^)'"]+)\1\s*\)/gi, (_m, q, val) => `url(${q}${absolutize(val, base)}${q})`);
  html = html.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (_m, css) => `<style>${rewriteCssUrls(css)}</style>`);
  html = html.replace(/style\s*=\s*"([^"]+)"/gi, (_m, css) => `style="${rewriteCssUrls(css)}"`);

  // 8. Injeta <base> como fallback
  const baseTag = `<base href="${base.origin}${base.pathname.replace(/[^/]*$/, "")}">`;
  if (/<head[^>]*>/i.test(html)) {
    html = html.replace(/<head([^>]*)>/i, `<head$1>${baseTag}`);
  } else if (/<html[^>]*>/i.test(html)) {
    html = html.replace(/<html([^>]*)>/i, `<html$1><head>${baseTag}</head>`);
  } else {
    html = `<!DOCTYPE html><html><head>${baseTag}</head><body>${html}</body></html>`;
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
      formats: ["rawHtml", "html", "markdown"],
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

    const rawHtml = scrapeResult.rawHtml || scrapeResult.html || "";
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
