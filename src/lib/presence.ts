import { supabase } from "@/integrations/supabase/client";

/**
 * Canal único de presença pra rastrear visitantes "ao vivo" em qualquer anúncio.
 * Cada visitante público chama `trackVisitorPresence(adId, sessionId)` e fica
 * registrado APENAS enquanto a aba estiver visível (visibilitychange).
 * O painel pode ouvir via `subscribeToOnlineVisitors`.
 */

const CHANNEL_NAME = "online-visitors-global";

// Heartbeat: visitante manda track() a cada HEARTBEAT_MS enquanto a aba tá visível.
// Painel marca como offline qualquer presença cujo `online_at` seja mais antigo
// que STALE_MS. Isso garante detecção mesmo se o WebSocket não mandar leave.
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
  let tracked = false;
  let lastTrackedScreen = "";

  const channel = supabase.channel(CHANNEL_NAME, {
    config: { presence: { key: presenceKey } },
  });

  let queue = Promise.resolve();
  const enqueue = (job: () => Promise<void>) => {
    queue = queue.catch(() => undefined).then(job);
    return queue;
  };

  const trackPresence = (force = false) => {
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
    // Evita spam: só re-track se ainda não tracked OU se a tela mudou.
    if (!force && tracked && lastTrackedScreen === currentScreen) return;
    void enqueue(async () => {
      if (stopped || !subscribed) return;
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      await channel.track({
        adId,
        sessionId,
        online_at: new Date().toISOString(),
        screenKind: currentScreen,
      } satisfies PresenceMeta);
      tracked = true;
      lastTrackedScreen = currentScreen;
    });
  };

  const untrackPresence = () => {
    void enqueue(async () => {
      if (!subscribed || !tracked) return;
      try {
        await channel.untrack();
      } catch {
        // ignore untrack errors during teardown / rapid tab switches
      } finally {
        tracked = false;
        lastTrackedScreen = "";
      }
    });
  };

  channel.subscribe((status) => {
    if (stopped) return;
    if (status === "SUBSCRIBED") {
      subscribed = true;
      trackPresence(true);
      return;
    }

    if (status === "CLOSED" || status === "TIMED_OUT" || status === "CHANNEL_ERROR") {
      subscribed = false;
      tracked = false;
      lastTrackedScreen = "";
    }
  });

  // Garante o estado correto sempre que a visibilidade mudar.
  const syncVisibility = () => {
    if (document.visibilityState === "visible") {
      trackPresence();
    } else {
      untrackPresence();
    }
  };

  // markActive existe pra compatibilidade com o PreviewFrame, mas agora é
  // basicamente um no-op: só re-track se por algum motivo perdemos o tracked
  // (ex: WebSocket caiu e voltou). Não faz spam de track().
  const markActive = () => {
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
    if (!tracked) trackPresence();
  };

  const setScreen = (kind: string) => {
    const next = kind || "main";
    if (next === currentScreen && tracked) return;
    currentScreen = next;
    trackPresence();
  };

  const onVisibility = () => syncVisibility();
  const onPageHide = () => untrackPresence();

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
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pagehide", onPageHide);
    window.removeEventListener("beforeunload", onPageHide);
    window.removeEventListener("focus", syncVisibility);
    window.removeEventListener("pageshow", syncVisibility);
    void enqueue(async () => {
      if (tracked) {
        try {
          await channel.untrack();
        } catch {
          // ignore final untrack failure
        } finally {
          tracked = false;
        }
      }

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

  const emit = () => {
    const state = channel.presenceState<PresenceMeta>();
    const map = new Map<string, PresenceMeta>();
    for (const key of Object.keys(state)) {
      const metas = state[key];
      if (!metas?.length) continue;
      for (const meta of metas) {
        if (!meta?.sessionId) continue;
        const current = map.get(meta.sessionId);
        if (!current || (meta.online_at ?? "") > (current.online_at ?? "")) {
          map.set(meta.sessionId, meta);
        }
      }
    }
    onChange(map);
  };

  channel
    .on("presence", { event: "sync" }, emit)
    .on("presence", { event: "join" }, ({ newPresences }) => {
      emit();
      if (!onJoin) return;
      for (const p of newPresences as unknown as PresenceMeta[]) {
        if (p?.sessionId) onJoin(p.sessionId, p);
      }
    })
    .on("presence", { event: "leave" }, emit)
    .subscribe();

  return () => {
    void channel.unsubscribe();
  };
}