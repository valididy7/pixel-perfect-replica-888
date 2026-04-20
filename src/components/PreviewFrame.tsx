import { useEffect, useRef } from "react";
import { attachIframeInteractions } from "@/lib/iframe-enhancements";

interface PreviewFrameProps {
  html: string;
  mode?: "mobile" | "desktop";
  className?: string;
}

export function PreviewFrame({ html, mode = "mobile", className }: PreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const blobUrlRef = useRef<string | null>(null);

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

    const blob = new Blob([injected], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    blobUrlRef.current = url;
    iframe.src = url;

    let detach: (() => void) | null = null;
    const onLoad = () => {
      const doc = iframe.contentDocument;
      if (doc) {
        detach = attachIframeInteractions(doc);
      }
    };
    iframe.addEventListener("load", onLoad);

    return () => {
      iframe.removeEventListener("load", onLoad);
      if (detach) detach();
      URL.revokeObjectURL(url);
    };
  }, [html, mode]);

  return (
    <iframe
      ref={iframeRef}
      title="Pré-visualização do anúncio"
      className={className || "h-full w-full bg-white"}
      style={{ touchAction: "pan-y", border: 0 }}
      scrolling="yes"
      sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms"
    />
  );
}
