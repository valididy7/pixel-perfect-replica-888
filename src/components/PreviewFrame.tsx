import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  const objectUrlsRef = useRef<string[]>([]);

  const { data: screens } = useQuery({
    queryKey: ["ad_screens", adId],
    enabled: !!adId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_screens")
        .select("*")
        .eq("ad_id", adId!);
      if (error) {
        console.error("[PreviewFrame] erro carregando telas:", error);
        throw error;
      }
      console.info("[PreviewFrame] telas carregadas:", data?.length, data?.map((s) => s.kind));
      return (data ?? []) as AdScreen[];
    },
  });

  // Mantém o ref sincronizado pra closures dos handlers do iframe
  useEffect(() => {
    screensRef.current = screens ?? [];
  }, [screens]);


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
      objectUrlsRef.current.push(url);
      iframe.src = url;
      return url;
    };

    const baseUrl = renderHtml(injected);
    let currentUrl = baseUrl;
    let onChildScreen = false;

    let detach: (() => void) | null = null;
    let resizeObs: ResizeObserver | null = null;

    const measure = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;
      const h = Math.max(doc.documentElement.scrollHeight, doc.body?.scrollHeight ?? 0);
      if (h && Math.abs(h - height) > 4) setHeight(h);
    };

    const onLoad = () => {
      const doc = iframe.contentDocument;
      try {
        currentUrl = iframe.contentWindow?.location.href || currentUrl;
        onChildScreen = currentUrl !== baseUrl;
      } catch {
        // ignore
      }
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
      currentUrl = renderHtml(screenHtml);
      onChildScreen = true;
    };

    const goBackToMain = () => {
      try {
        if (iframe.contentWindow && currentUrl !== baseUrl) {
          iframe.contentWindow.history.back();
          return;
        }
      } catch {
        // ignore
      }
      currentUrl = renderHtml(injected);
      onChildScreen = false;
    };

    const onMessage = (e: MessageEvent) => {
      const data = e.data;
      if (!data || typeof data !== "object") return;

      if (data.type === "iframe-help-action" && typeof data.action === "string") {
        console.info("[PreviewFrame] help-action:", data.action, "telas:", screensRef.current.map((s) => s.kind));
        const screen = screensRef.current.find((s) => s.kind === data.action);
        if (!screen) {
          console.warn("[PreviewFrame] Nenhuma tela vinculada com kind=", data.action);
          return;
        }
        navigateToScreen(screen);
        return;
      }

      if (data.type === "iframe-link-click" && typeof data.url === "string") {
        // Se já estamos numa tela filha, qualquer link volta pra principal
        if (onChildScreen) {
          goBackToMain();
          return;
        }
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

    };
    window.addEventListener("message", onMessage);

    return () => {
      iframe.removeEventListener("load", onLoad);
      window.removeEventListener("message", onMessage);
      if (detach) detach();
      if (resizeObs) resizeObs.disconnect();
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current = [];
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
