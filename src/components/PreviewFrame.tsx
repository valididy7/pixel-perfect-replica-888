import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { attachIframeInteractions } from "@/lib/iframe-enhancements";
import { decompressStoredHtml } from "@/lib/ad-html-storage";
import { AdScreen } from "@/types/screen";

interface PreviewFrameProps {
  html: string;
  mode?: "mobile" | "desktop";
  className?: string;
  /** Quando definido, busca telas filhas no banco e usa pra navegação. */
  adId?: string;
}

export function PreviewFrame({ html, mode = "mobile", className, adId }: PreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState<number>(800);
  const screensRef = useRef<AdScreen[]>([]);
  const historyRef = useRef<string[]>([]);

  // Carrega telas filhas
  useEffect(() => {
    if (!adId) {
      console.info("[PreviewFrame] adId ausente — telas vinculadas desativadas");
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("ad_screens")
        .select("*")
        .eq("ad_id", adId);
      if (cancelled) return;
      if (error) {
        console.error("[PreviewFrame] erro carregando telas:", error);
        return;
      }
      console.info("[PreviewFrame] telas carregadas:", data?.length, data?.map((s: AdScreen) => s.kind));
      if (data) screensRef.current = data as AdScreen[];
    })();
    return () => { cancelled = true; };
  }, [adId]);

  useEffect(() => {
    if (!iframeRef.current) return;
    const iframe = iframeRef.current;

    let injected = html || "<html><body></body></html>";
    if (mode === "mobile" && !/<meta[^>]+viewport/i.test(injected)) {
      injected = injected.replace(
        /<head[^>]*>/i,
        (m) => `${m}\n<meta name="viewport" content="width=device-width, initial-scale=1">`,
      );
    }

    const renderHtml = (src: string) => {
      const blob = new Blob([src], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      iframe.src = url;
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    };

    renderHtml(injected);
    let baseHtml = injected;

    let detach: (() => void) | null = null;
    let resizeObs: ResizeObserver | null = null;

    const measure = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;
      const h = Math.max(doc.documentElement.scrollHeight, doc.body?.scrollHeight ?? 0);
      if (h && Math.abs(h - height) > 4) setHeight(h);
    };

    const wrapWithBackBar = (rawHtml: string) => {
      const bar = `<div style="position:sticky;top:0;left:0;right:0;z-index:2147483646;background:#fff;border-bottom:1px solid #e0e0e0;padding:10px 14px;display:flex;align-items:center;gap:10px;font-family:'Open Sans',sans-serif;">
        <button onclick="parent.postMessage({type:'iframe-back'},'*')" style="display:flex;align-items:center;gap:6px;background:transparent;border:0;cursor:pointer;font-size:14px;color:#6E0AD6;font-weight:600;padding:4px 8px;">
          <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#6E0AD6" d="M15.5 6.5c.3.3.3.8 0 1.1L11 12l4.5 4.5c.3.3.3.8 0 1.1s-.8.3-1.1 0l-5-5c-.3-.3-.3-.8 0-1.1l5-5c.3-.3.8-.3 1.1 0z"/></svg>
          Voltar
        </button>
      </div>`;
      if (/<body[^>]*>/i.test(rawHtml)) {
        return rawHtml.replace(/<body[^>]*>/i, (m) => `${m}${bar}`);
      }
      return bar + rawHtml;
    };

    const onLoad = () => {
      const doc = iframe.contentDocument;
      if (doc) {
        if (detach) detach();
        detach = attachIframeInteractions(doc);
        measure();
        const tries = [200, 600, 1200, 2500, 4000];
        tries.forEach((t) => setTimeout(measure, t));
        try {
          if (resizeObs) resizeObs.disconnect();
          resizeObs = new ResizeObserver(() => measure());
          if (doc.body) resizeObs.observe(doc.body);
        } catch { /* ignore */ }
      }
    };
    iframe.addEventListener("load", onLoad);

    const normalizeUrl = (raw: string): string => {
      try {
        const u = new URL(raw);
        return (u.origin + u.pathname.replace(/\/+$/, "")).toLowerCase();
      } catch {
        return raw.toLowerCase();
      }
    };

    const navigateToScreen = (screen: AdScreen) => {
      const screenHtml = decompressStoredHtml(screen.edited_html || screen.original_html || "");
      if (!screenHtml) return;
      const currentSrc = iframe.contentDocument?.documentElement?.outerHTML;
      if (currentSrc) historyRef.current.push(currentSrc);
      renderHtml(wrapWithBackBar(screenHtml));
    };

    const onMessage = (e: MessageEvent) => {
      const data = e.data;
      if (!data || typeof data !== "object") return;

      if (data.type === "iframe-help-action" && typeof data.action === "string") {
        console.info("[PreviewFrame] help-action:", data.action, "telas:", screensRef.current.map((s) => s.kind));
        const screen = screensRef.current.find((s) => s.kind === data.action);
        if (!screen) {
          console.warn("[PreviewFrame] Sem tela com kind=", data.action);
          window.parent.postMessage({ type: "iframe-help-missing", action: data.action }, "*");
          return;
        }
        navigateToScreen(screen);
        return;
      }

      if (data.type === "iframe-link-click" && typeof data.url === "string") {
        const target = normalizeUrl(data.url);
        const match = screensRef.current.find(
          (s) => s.source_url && normalizeUrl(s.source_url) === target,
        );
        if (match) {
          navigateToScreen(match);
        } else {
          console.info("[PreviewFrame] Sem tela vinculada para:", data.url);
        }
        return;
      }

      if (data.type === "iframe-back") {
        const prev = historyRef.current.pop();
        if (prev) renderHtml(prev);
        else renderHtml(baseHtml);
      }
    };
    window.addEventListener("message", onMessage);

    return () => {
      iframe.removeEventListener("load", onLoad);
      window.removeEventListener("message", onMessage);
      if (detach) detach();
      if (resizeObs) resizeObs.disconnect();
      historyRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html, mode]);

  return (
    <iframe
      ref={iframeRef}
      title="Pré-visualização do anúncio"
      className={className || "block w-full bg-white"}
      style={{ height: `${height}px`, border: 0, touchAction: "pan-y" }}
      scrolling="no"
      sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms"
    />
  );
}
