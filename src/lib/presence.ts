import { supabase } from "@/integrations/supabase/client";

/**
 * Canal único de presença pra rastrear visitantes "ao vivo" em qualquer anúncio.
 * Cada visitante público chama `trackVisitorPresence(adId, sessionId)` e fica
 * registrado enquanto a página do anúncio estiver aberta.
 * O painel pode ouvir via `subscribeToOnlineVisitors`.
 */

const CHANNEL_NAME = "online-visitors-global";
const HEARTBEAT_EVENT = "visitor-heartbeat";
const OFFLINE_EVENT = "visitor-offline";

// Heartbeat: visitante envia ping enquanto a página do anúncio está aberta.
// O painel mantém online quem enviou heartbeat recente e remove no OFFLINE_EVENT.
const HEARTBEAT_MS = 3000;
const STALE_MS = 20000;

export interface PresenceMeta {
  adId: string;
  sessionId: string;
  online_at: string;
  screenKind?: string;
}

/**
 * Liga a presença do visitante usando Realtime.
 * Regra: enquanto a página do anúncio estiver aberta, aparece online; ao fechar
 * ou sair da página, envia offline. Trocar de aba não derruba mais o visitante.
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
    void enqueue(async () => {
      if (stopped || !subscribed) return;
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
    sendHeartbeat();
  }, HEARTBEAT_MS);

  const syncVisibility = () => {
    sendHeartbeat();
  };

  const markActive = () => {
    sendHeartbeat();
  };

  const setScreen = (kind: string) => {
    const next = kind || "main";
    if (next === currentScreen && announcedOnline) return;
    currentScreen = next;
    sendHeartbeat();
    // Reenvia logo em seguida pra cobrir casos de race no broadcast
    // (ex.: voltar pelo botão do navegador). Sem isso o painel às vezes
    // ficava travado mostrando a tela anterior.
    setTimeout(() => sendHeartbeat(), 150);
    setTimeout(() => sendHeartbeat(), 600);
  };

  const onVisibility = () => syncVisibility();
  const onPageHide = () => sendOffline();

  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", onPageHide);
  window.addEventListener("beforeunload", onPageHide);
  // Ao voltar pra aba, reforça o online imediatamente.
  window.addEventListener("focus", syncVisibility);
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
      if (announcedOnline) {
        try {
          await channel.send({
            type: "broadcast",
            event: OFFLINE_EVENT,
            payload: { adId, sessionId },
          });
        } catch {
          // ignore final offline send failure
        } finally {
          announcedOnline = false;
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
  onLeave?: (sessionId: string) => void,
): () => void {
  const channel = supabase.channel(CHANNEL_NAME, {
    config: { presence: { key: `dashboard-${crypto.randomUUID()}` } },
  });

  const sessions = new Map<string, PresenceMeta>();

  const emit = () => {
    const map = new Map<string, PresenceMeta>();
    const cutoff = Date.now() - STALE_MS;
    const removed: string[] = [];
    for (const [sessionId, meta] of sessions) {
      const ts = meta.online_at ? Date.parse(meta.online_at) : 0;
      if (!ts || ts < cutoff) {
        sessions.delete(sessionId);
        removed.push(sessionId);
        continue;
      }
      map.set(sessionId, meta);
    }
    onChange(map);
    if (onLeave) {
      for (const sid of removed) onLeave(sid);
    }
  };

  channel
    .on("broadcast", { event: HEARTBEAT_EVENT }, ({ payload }) => {
      const meta = payload as PresenceMeta | null;
      if (!meta?.sessionId) return;
      const current = sessions.get(meta.sessionId);
      const cutoff = Date.now() - STALE_MS;
      const currentTs = current?.online_at ? Date.parse(current.online_at) : 0;
      const wasOnline = !!currentTs && currentTs >= cutoff;
      sessions.set(meta.sessionId, meta);
      emit();
      if (!wasOnline && onJoin) {
        onJoin(meta.sessionId, meta);
      }
    })
    .on("broadcast", { event: OFFLINE_EVENT }, ({ payload }) => {
      const meta = payload as Partial<PresenceMeta> | null;
      if (!meta?.sessionId) return;
      const had = sessions.has(meta.sessionId);
      sessions.delete(meta.sessionId);
      emit();
      if (had && onLeave) onLeave(meta.sessionId);
    })
    .subscribe();

  const sweep = setInterval(emit, HEARTBEAT_MS);

  return () => {
    clearInterval(sweep);
    sessions.clear();
    void channel.unsubscribe();
  };
}