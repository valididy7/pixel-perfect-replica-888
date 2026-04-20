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

function absolutize(value: string, base: URL): string {
  const v = value.trim();
  if (!v) return v;
  if (v.startsWith("data:") || v.startsWith("blob:") || v.startsWith("#") ||
      v.startsWith("mailto:") || v.startsWith("tel:") || v.startsWith("javascript:")) {
    return v;
  }
  try { return new URL(v, base).toString(); } catch { return v; }
}

function absolutizeSrcset(srcset: string, base: URL): string {
  return srcset.split(",").map((part) => {
    const trimmed = part.trim();
    if (!trimmed) return "";
    const segs = trimmed.split(/\s+/);
    const url = segs.shift() || "";
    const desc = segs.join(" ");
    const abs = absolutize(url, base);
    return desc ? `${abs} ${desc}` : abs;
  }).filter(Boolean).join(", ");
}

const TRACKER_PATTERNS = [
  "google-analytics", "googletagmanager", "gtag/js", "doubleclick",
  "facebook.net", "connect.facebook", "hotjar", "clarity.ms", "segment.com",
  "mixpanel", "amplitude", "newrelic", "datadog", "sentry", "tiktok",
  "criteo", "taboola", "outbrain",
];
const isTrackerUrl = (url: string) => {
  const l = url.toLowerCase();
  return TRACKER_PATTERNS.some((p) => l.includes(p));
};

function cleanHtml(rawHtml: string, sourceUrl: string): string {
  let html = rawHtml;
  let base: URL;
  try { base = new URL(sourceUrl); } catch { return rawHtml; }

  html = html.replace(/<noscript[\s\S]*?<\/noscript>/gi, "");
  html = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (full, attrs, body) => {
    const m = /src\s*=\s*["']([^"']+)["']/i.exec(attrs);
    if (m && isTrackerUrl(m[1])) return "";
    if (!m && isTrackerUrl(body)) return "";
    return full;
  });
  html = html.replace(/<iframe\b[^>]*src\s*=\s*["']([^"']+)["'][^>]*>[\s\S]*?<\/iframe>/gi,
    (full, src) => isTrackerUrl(src) ? "" : full);
  html = html.replace(/<link\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi,
    (full, href) => isTrackerUrl(href) ? "" : full);

  const urlAttrs = ["href", "src", "data-src", "data-original", "poster", "action"];
  for (const attr of urlAttrs) {
    html = html.replace(new RegExp(`(\\s${attr})\\s*=\\s*"([^"]+)"`, "gi"),
      (_m, name, val) => `${name}="${absolutize(val, base)}"`);
    html = html.replace(new RegExp(`(\\s${attr})\\s*=\\s*'([^']+)'`, "gi"),
      (_m, name, val) => `${name}='${absolutize(val, base)}'`);
  }

  html = html.replace(/(\ssrcset)\s*=\s*"([^"]+)"/gi,
    (_m, name, val) => `${name}="${absolutizeSrcset(val, base)}"`);
  html = html.replace(/(\ssrcset)\s*=\s*'([^']+)'/gi,
    (_m, name, val) => `${name}='${absolutizeSrcset(val, base)}'`);

  const rewriteCssUrls = (css: string) =>
    css.replace(/url\(\s*(['"]?)([^)'"]+)\1\s*\)/gi,
      (_m, q, val) => `url(${q}${absolutize(val, base)}${q})`);
  html = html.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi,
    (_m, css) => `<style>${rewriteCssUrls(css)}</style>`);
  html = html.replace(/style\s*=\s*"([^"]+)"/gi,
    (_m, css) => `style="${rewriteCssUrls(css)}"`);

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

async function inlineStylesheets(html: string, sourceUrl: string): Promise<string> {
  let base: URL;
  try { base = new URL(sourceUrl); } catch { return html; }

  const linkRegex = /<link\b[^>]*\brel\s*=\s*["']stylesheet["'][^>]*>/gi;
  const matches = Array.from(html.matchAll(linkRegex)).slice(0, 8);
  if (matches.length === 0) return html;

  const replacements = await Promise.all(matches.map(async (m) => {
    const tag = m[0];
    const hrefMatch = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i);
    if (!hrefMatch) return { tag, replacement: "" };

    let href: string;
    try { href = new URL(hrefMatch[1], base).toString(); }
    catch { return { tag, replacement: "" }; }

    try {
      const res = await fetch(href, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
          Accept: "text/css,*/*;q=0.1",
          Referer: sourceUrl,
        },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return { tag, replacement: "" };
      let css = await res.text();
      const cssBase = new URL(href);
      css = css.replace(/url\(\s*(['"]?)((?!data:|https?:|\/\/|#)[^)'"]+)\1\s*\)/gi,
        (_full, q, val) => {
          try { return `url(${q}${new URL(val, cssBase).toString()}${q})`; }
          catch { return `url(${q}${val}${q})`; }
        });
      css = css.replace(/@import\s+(?:url\(\s*)?(['"])([^'"]+)\1\s*\)?/gi,
        (_full, q, val) => {
          try { return `@import ${q}${new URL(val, cssBase).toString()}${q}`; }
          catch { return `@import ${q}${val}${q}`; }
        });
      return { tag, replacement: `<style data-inlined-from="${href}">\n${css}\n</style>` };
    } catch { return { tag, replacement: "" }; }
  }));

  let result = html;
  for (const { tag, replacement } of replacements) {
    if (replacement) result = result.replace(tag, replacement);
  }
  return result;
}

interface FirecrawlResult {
  html?: string;
  rawHtml?: string;
  metadata?: { title?: string };
  data?: any;
}

async function scrapeWithFirecrawl(url: string, apiKey: string): Promise<FirecrawlResult> {
  const res = await fetch(`${FIRECRAWL_V2}/scrape`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url, formats: ["rawHtml", "html"], onlyMainContent: false }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || json?.message || `Firecrawl ${res.status}`);
  return (json?.data ?? json) as FirecrawlResult;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Missing Authorization" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) return jsonResponse({ error: "FIRECRAWL_API_KEY not configured" }, 500);

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return jsonResponse({ error: "Unauthorized" }, 401);

    let body: { url?: string; ad_id?: string; kind?: string; title?: string };
    try { body = await req.json(); } catch { return jsonResponse({ error: "Invalid JSON" }, 400); }

    const sourceUrl = body.url?.trim();
    const adId = body.ad_id?.trim();
    const kind = (body.kind?.trim() || "custom").slice(0, 40);
    if (!sourceUrl || !isValidUrl(sourceUrl)) return jsonResponse({ error: "URL inválida" }, 400);
    if (!adId) return jsonResponse({ error: "ad_id é obrigatório" }, 400);

    // Verifica que o usuário é dono do ad pai
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: parentAd } = await adminClient
      .from("ads")
      .select("id, owner_id")
      .eq("id", adId)
      .maybeSingle();
    if (!parentAd || parentAd.owner_id !== userData.user.id) {
      return jsonResponse({ error: "Sem permissão para esse anúncio" }, 403);
    }

    // Scrape
    let scrape: FirecrawlResult;
    try { scrape = await scrapeWithFirecrawl(sourceUrl, FIRECRAWL_API_KEY); }
    catch (err) {
      const msg = err instanceof Error ? err.message : "Erro no scrape";
      return jsonResponse({ error: `Falha ao raspar: ${msg}` }, 502);
    }

    const rawHtml = scrape.rawHtml || scrape.html || "";
    if (!rawHtml) return jsonResponse({ error: "HTML vazio" }, 422);

    let cleaned = cleanHtml(rawHtml, sourceUrl);
    try { cleaned = await inlineStylesheets(cleaned, sourceUrl); } catch (e) { console.warn(e); }

    const screenTitle = body.title?.trim() || scrape.metadata?.title?.slice(0, 200) || "Tela clonada";

    const { data: screen, error: insertError } = await adminClient
      .from("ad_screens")
      .insert({
        ad_id: adId,
        kind,
        title: screenTitle,
        source_url: sourceUrl,
        original_html: cleaned,
        edited_html: cleaned,
      })
      .select()
      .single();

    if (insertError) return jsonResponse({ error: insertError.message }, 500);
    return jsonResponse({ screen });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown";
    console.error("clone-url-screen error:", msg);
    return jsonResponse({ error: msg }, 500);
  }
});
