import { supabase } from "@/integrations/supabase/client";

/**
 * Canal único de presença pra rastrear visitantes "ao vivo" em qualquer anúncio.
 * Cada visitante público chama `trackVisitorPresence(adId, sessionId)` e fica
 * registrado APENAS enquanto a aba estiver visível (visibilitychange).
 * O painel pode ouvir via `subscribeToOnlineVisitors`.
 */

const CHANNEL_NAME = "online-visitors-global";
const HEARTBEAT_EVENT = "visitor-heartbeat";
const OFFLINE_EVENT = "visitor-offline";

// Heartbeat: visitante envia um ping a cada HEARTBEAT_MS enquanto a aba tá visível.
// O painel mantém online só quem enviou heartbeat recente e remove no OFFLINE_EVENT.
const HEARTBEAT_MS = 2000;
const STALE_MS = 5000;

export interface PresenceMeta {
  adId: string;
  sessionId: string;
  online_at: string;
  screenKind?: string;
}

/**
 * Liga a presença do visitante usando Supabase Realtime — regra simples:
 *   aba VISÍVEL  ⇒ track()  (online no painel)
 *   aba OCULTA   ⇒ untrack() (offline IMEDIATO no painel)
 *
 * Sem heartbeats, sem track em mousemove/scroll. O único trigger de track é:
 *   1) primeira inscrição (já visível)
 *   2) visibilitychange → visible
 *   3) mudança de tela (setScreen) — re-track só se a screenKind mudou
 *
 * Isso elimina o "pisca offline/online" e o delay: o painel recebe leave/join
 * pela presença nativa do Realtime no mesmo instante em que a aba muda.
 */
export function trackVisitorPresence(
  adId: string,
  sessionId: string,
): { stop: () => void; setScreen: (kind: string) => void; markActive: () => void } {
  if (typeof window === "undefined") {
    return { stop: () => {}, setScreen: () => {}, markActive: () => {} };
  }

  // Key única por CONEXÃO (não por sessionId). Garante que sair e voltar
  // sempre dispara um novo "join" no painel, mesmo que o session_id (cookie)
  // do visitante seja o mesmo.
  const presenceKey = `visitor-${sessionId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  let currentScreen = "main";
  let stopped = false;
  let subscribed = false;
  let announcedOnline = false;

  const channel = supabase.channel(CHANNEL_NAME, {
    config: { presence: { key: presenceKey } },
  });

  let queue = Promise.resolve();
  const enqueue = (job: () => Promise<void>) => {
    queue = queue.catch(() => undefined).then(job);
    return queue;
  };

  const sendHeartbeat = () => {
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
    void enqueue(async () => {
      if (stopped || !subscribed) return;
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      try {
        await channel.send({
          type: "broadcast",
          event: HEARTBEAT_EVENT,
          payload: {
            adId,
            sessionId,
            online_at: new Date().toISOString(),
            screenKind: currentScreen,
          } satisfies PresenceMeta,
        });
        announcedOnline = true;
      } catch {
        // ignore heartbeat send errors during reconnects
      }
    });
  };

  const sendOffline = () => {
    void enqueue(async () => {
      if (!subscribed || !announcedOnline) return;
      try {
        await channel.send({
          type: "broadcast",
          event: OFFLINE_EVENT,
          payload: { adId, sessionId },
        });
      } catch {
        // ignore offline send errors during teardown / rapid tab switches
      } finally {
        announcedOnline = false;
      }
    });
  };

  channel.subscribe((status) => {
    if (stopped) return;
    if (status === "SUBSCRIBED") {
      subscribed = true;
      sendHeartbeat();
      return;
    }

    if (status === "CLOSED" || status === "TIMED_OUT" || status === "CHANNEL_ERROR") {
      subscribed = false;
      announcedOnline = false;
    }
  });

  const heartbeat = setInterval(() => {
    if (stopped) return;
    if (typeof document === "undefined") return;
    if (document.visibilityState === "visible") {
      sendHeartbeat();
    } else if (announcedOnline) {
      sendOffline();
    }
  }, HEARTBEAT_MS);

  const syncVisibility = () => {
    if (document.visibilityState === "visible") {
      sendHeartbeat();
    } else {
      sendOffline();
    }
  };

  const markActive = () => {
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
    sendHeartbeat();
  };

  const setScreen = (kind: string) => {
    const next = kind || "main";
    if (next === currentScreen && announcedOnline) return;
    currentScreen = next;
    sendHeartbeat();
  };

  const onVisibility = () => syncVisibility();
  const onPageHide = () => sendOffline();

  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", onPageHide);
  window.addEventListener("beforeunload", onPageHide);
  // Em alguns navegadores mobile, focus/blur acompanham melhor que visibilitychange.
  window.addEventListener("focus", syncVisibility);
  window.addEventListener("blur", () => {
    // blur sozinho não é suficiente (pode ser focus em outra área da página),
    // mas se a aba ficou oculta nesse momento, o syncVisibility resolve.
    if (document.visibilityState !== "visible") untrackPresence();
  });
  window.addEventListener("pageshow", syncVisibility);

  const stop = () => {
    if (stopped) return;
    stopped = true;
    clearInterval(heartbeat);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pagehide", onPageHide);
    window.removeEventListener("beforeunload", onPageHide);
    window.removeEventListener("focus", syncVisibility);
    window.removeEventListener("pageshow", syncVisibility);
    void enqueue(async () => {
      if (announcedOnline) sendOffline();

      try {
        await channel.unsubscribe();
      } catch {
        // ignore unsubscribe failure
      } finally {
        subscribed = false;
      }
    });
  };

  return { stop, setScreen, markActive };
}

/**
 * Inscreve o painel pra receber atualizações de quem tá online.
 * `onChange(sessionIds)` é chamado sempre que alguém entra/sai.
 * Também dispara `onJoin(sessionId)` quando alguém ENTRA (pra tocar som).
 */
export function subscribeToOnlineVisitors(
  onChange: (online: Map<string, PresenceMeta>) => void,
  onJoin?: (sessionId: string, meta: PresenceMeta) => void,
): () => void {
  const channel = supabase.channel(CHANNEL_NAME, {
    config: { presence: { key: `dashboard-${crypto.randomUUID()}` } },
  });

  const seenJoined = new Set<string>();

  const emit = () => {
    const state = channel.presenceState<PresenceMeta>();
    const map = new Map<string, PresenceMeta>();
    const cutoff = Date.now() - STALE_MS;
    for (const key of Object.keys(state)) {
      const metas = state[key];
      if (!metas?.length) continue;
      for (const meta of metas) {
        if (!meta?.sessionId) continue;
        // Filtra presenças "fantasmas" cujo último heartbeat é mais antigo que STALE_MS.
        const ts = meta.online_at ? Date.parse(meta.online_at) : 0;
        if (!ts || ts < cutoff) continue;
        const current = map.get(meta.sessionId);
        if (!current || (meta.online_at ?? "") > (current.online_at ?? "")) {
          map.set(meta.sessionId, meta);
        }
      }
    }
    // Limpa "joined" pra quem saiu — assim se voltar, dispara onJoin de novo.
    for (const sid of Array.from(seenJoined)) {
      if (!map.has(sid)) seenJoined.delete(sid);
    }
    onChange(map);
  };

  channel
    .on("presence", { event: "sync" }, emit)
    .on("presence", { event: "join" }, ({ newPresences }) => {
      emit();
      if (!onJoin) return;
      for (const p of newPresences as unknown as PresenceMeta[]) {
        if (p?.sessionId && !seenJoined.has(p.sessionId)) {
          seenJoined.add(p.sessionId);
          onJoin(p.sessionId, p);
        }
      }
    })
    .on("presence", { event: "leave" }, emit)
    .subscribe();

  // Re-emite a cada HEARTBEAT_MS pra remover presenças cujo último heartbeat
  // expirou (caso o leave do Realtime não tenha chegado).
  const sweep = setInterval(emit, HEARTBEAT_MS);

  return () => {
    clearInterval(sweep);
    void channel.unsubscribe();
  };
}