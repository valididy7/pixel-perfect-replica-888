import { useEffect, useRef, useState } from "react";
import { attachIframeInteractions } from "@/lib/iframe-enhancements";
import { navigateIframeTo, popIframeHistory } from "@/lib/iframe-navigation";

interface PreviewFrameProps {
  html: string;
  mode?: "mobile" | "desktop";
  className?: string;
}

const HELP_ACTION_URLS: Record<string, string> = {
  reactivate: "https://conta.olx.com.br/reativacao-conta",
};

export function PreviewFrame({ html, mode = "mobile", className }: PreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const currentHtmlRef = useRef<string>("");
  const [height, setHeight] = useState<number>(800);

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
    currentHtmlRef.current = injected;

    const blob = new Blob([injected], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    iframe.src = url;

    let detach: (() => void) | null = null;
    let resizeObs: ResizeObserver | null = null;

    const measure = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;
      const h = Math.max(
        doc.documentElement.scrollHeight,
        doc.body?.scrollHeight ?? 0,
      );
      if (h && Math.abs(h - height) > 4) setHeight(h);
    };

    const onLoad = () => {
      const doc = iframe.contentDocument;
      if (doc) {
        detach = attachIframeInteractions(doc);
        measure();
        const tries = [200, 600, 1200, 2500, 4000];
        tries.forEach((t) => setTimeout(measure, t));
        try {
          resizeObs = new ResizeObserver(() => measure());
          if (doc.body) resizeObs.observe(doc.body);
        } catch {
          // ignore
        }
      }
    };
    iframe.addEventListener("load", onLoad);

    const onMessage = (e: MessageEvent) => {
      const data = e.data;
      if (!data || typeof data !== "object") return;
      if (data.type === "iframe-help-action" && typeof data.action === "string") {
        const url = HELP_ACTION_URLS[data.action];
        if (url) {
          navigateIframeTo(iframe, url, currentHtmlRef.current);
        } else {
          console.warn("[PreviewFrame] sem URL pra ação:", data.action);
        }
      }
      if (data.type === "iframe-back") {
        popIframeHistory(iframe);
      }
    };
    window.addEventListener("message", onMessage);

    return () => {
      iframe.removeEventListener("load", onLoad);
      window.removeEventListener("message", onMessage);
      if (detach) detach();
      if (resizeObs) resizeObs.disconnect();
      URL.revokeObjectURL(url);
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
