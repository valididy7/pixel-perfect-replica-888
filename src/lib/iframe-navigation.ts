import { supabase } from "@/integrations/supabase/client";
import { attachIframeInteractions } from "./iframe-enhancements";

const historyStack: string[] = [];

/**
 * Faz scrape de uma URL via edge function e injeta o HTML resultante no iframe,
 * mantendo um stack de histórico pra permitir voltar.
 */
export async function navigateIframeTo(
  iframe: HTMLIFrameElement,
  url: string,
  currentHtml: string,
): Promise<void> {
  // Empilha o HTML atual antes de navegar
  historyStack.push(currentHtml);

  showLoader(iframe);

  try {
    const { data, error } = await supabase.functions.invoke("scrape-url", {
      body: { url },
    });
    if (error) throw error;
    const html: string = data?.html || "";
    if (!html) throw new Error("HTML vazio retornado");

    renderHtml(iframe, withBackButton(html));
  } catch (e) {
    console.error("[navigateIframeTo] erro:", e);
    showError(iframe, String(e));
  }
}

export function popIframeHistory(iframe: HTMLIFrameElement): boolean {
  const prev = historyStack.pop();
  if (prev == null) return false;
  renderHtml(iframe, prev);
  return true;
}

function renderHtml(iframe: HTMLIFrameElement, html: string) {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const onLoad = () => {
    const doc = iframe.contentDocument;
    if (doc) attachIframeInteractions(doc);
    iframe.removeEventListener("load", onLoad);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  iframe.addEventListener("load", onLoad);
  iframe.src = url;
}

function showLoader(iframe: HTMLIFrameElement) {
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>
    body{margin:0;font-family:'Open Sans',-apple-system,BlinkMacSystemFont,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fff;color:#1a1a1a;}
    .l{display:flex;flex-direction:column;align-items:center;gap:16px;}
    .s{width:36px;height:36px;border:3px solid #eee;border-top-color:#6E0AD6;border-radius:50%;animation:r 1s linear infinite;}
    @keyframes r{to{transform:rotate(360deg)}}
    p{margin:0;font-size:14px;color:#666;}
  </style></head><body><div class="l"><div class="s"></div><p>Carregando...</p></div></body></html>`;
  renderHtml(iframe, html);
}

function showError(iframe: HTMLIFrameElement, msg: string) {
  const safe = msg.replace(/</g, "&lt;");
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>
    body{margin:0;font-family:sans-serif;padding:24px;color:#1a1a1a;}
    h2{color:#c00;margin:0 0 8px;}
    button{margin-top:16px;padding:10px 16px;background:#6E0AD6;color:#fff;border:0;border-radius:8px;cursor:pointer;}
  </style></head><body><h2>Não foi possível carregar</h2><p>${safe}</p><button onclick="parent.postMessage({type:'iframe-back'},'*')">Voltar</button></body></html>`;
  renderHtml(iframe, html);
}

function withBackButton(html: string): string {
  const bar = `
    <div id="__nav_back__" style="position:sticky;top:0;left:0;right:0;z-index:2147483646;background:#fff;border-bottom:1px solid #e0e0e0;padding:10px 14px;display:flex;align-items:center;gap:10px;font-family:'Open Sans',-apple-system,sans-serif;">
      <button onclick="parent.postMessage({type:'iframe-back'},'*')" style="display:flex;align-items:center;gap:6px;background:transparent;border:0;cursor:pointer;font-size:14px;color:#6E0AD6;font-weight:600;padding:4px 8px;">
        <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#6E0AD6" d="M15.5303 6.46967c.2929.29289.2929.76777 0 1.06066L11.0607 12l4.4696 4.4697c.2929.2929.2929.7677 0 1.0606-.2929.2929-.7677.2929-1.0606 0l-5-5c-.2929-.2929-.2929-.7677 0-1.0606l5-5c.2929-.29289.7677-.29289 1.0606 0z"/></svg>
        Voltar
      </button>
    </div>
  `;
  if (/<body[^>]*>/i.test(html)) {
    return html.replace(/<body[^>]*>/i, (m) => `${m}${bar}`);
  }
  return bar + html;
}
