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
// Heartbeat curto + stale curto = offline quase instantâneo quando a pessoa
// fecha/sai da página. O visitante manda ping a cada 2s e o painel considera
// offline depois de ~5s sem receber nada.
const HEARTBEAT_MS = 2000;
const STALE_MS = 5000;

const isManagedPreviewHost = () => {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return (
    host === "localhost" ||
    host.endsWith(".lovableproject.com") ||
    (host.startsWith("id-preview--") && host.endsWith(".lovable.app"))
  );
};

const isPageVisible = () => typeof document === "undefined" || document.visibilityState !== "hidden";

const isCountablePresenceMeta = (meta: Partial<PresenceMeta> | null | undefined) => {
  if (!meta?.sessionId || !meta.adId) return false;
  if (meta.source !== "public-ad") return false;
  if (meta.host === "localhost") return false;
  if (meta.host?.endsWith(".lovableproject.com")) return false;
  if (meta.host?.startsWith("id-preview--") && meta.host.endsWith(".lovable.app")) return false;
  return true;
};

export interface PresenceMeta {
  adId: string;
  sessionId: string;
  connectionId?: string;
  online_at: string;
  screenKind?: string;
  source?: "public-ad";
  host?: string;
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
  if (typeof window === "undefined" || isManagedPreviewHost()) {
    return { stop: () => {}, setScreen: () => {}, markActive: () => {} };
  }

  // Key única por CONEXÃO (não por sessionId). Garante que sair de uma
  // aba/celular não derrube outra conexão do mesmo visitante.
  const presenceKey = `visitor-${sessionId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  let currentScreen = "main";
  let stopped = false;
  let subscribed = false;
  let announcedOnline = false;
  let channel: ReturnType<typeof supabase.channel> | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  const makeMeta = (): PresenceMeta => ({
    adId,
    sessionId,
    connectionId: presenceKey,
    online_at: new Date().toISOString(),
    screenKind: currentScreen,
    source: "public-ad",
    host: window.location.hostname,
  });

  const scheduleReconnect = () => {
    if (stopped) return;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, 1000);
  };

  const sendHeartbeat = () => {
    const ch = channel;
    if (stopped || !subscribed || !ch) return;
    if (!isPageVisible()) return;

    void (async () => {
      const meta = makeMeta();
      try {
        // Presence nativa dá replay/sync pro painel quando ele reconecta ou recarrega.
        await ch.track(meta);
      } catch {
        // ignore track errors during reconnects
      }

      try {
        // Broadcast mantém compatibilidade e reduz latência das atualizações.
        await ch.send({
          type: "broadcast",
          event: HEARTBEAT_EVENT,
          payload: meta,
        });
        announcedOnline = true;
      } catch {
        // ignore heartbeat send errors during reconnects
      }
    })();
  };

  const sendOffline = () => {
    const ch = channel;
    if (!ch || !subscribed || !announcedOnline) return;

    void (async () => {
      try {
        await ch.send({
          type: "broadcast",
          event: OFFLINE_EVENT,
          payload: { adId, sessionId, connectionId: presenceKey },
        });
      } catch {
        // ignore offline send errors during teardown / rapid tab switches
      } finally {
        announcedOnline = false;
      }
    })();
  };

  const connect = () => {
    if (stopped) return;
    if (!isPageVisible()) return;

    if (channel) {
      try {
        void channel.unsubscribe();
      } catch {
        // ignore old channel cleanup
      }
      channel = null;
    }

    subscribed = false;
    const ch = supabase.channel(CHANNEL_NAME, {
      config: { presence: { key: presenceKey } },
    });
    channel = ch;

    ch.subscribe((status) => {
      if (stopped || channel !== ch) return;

      if (status === "SUBSCRIBED") {
        subscribed = true;
        sendHeartbeat();
        setTimeout(sendHeartbeat, 250);
        setTimeout(sendHeartbeat, 1000);
        return;
      }

      if (status === "CLOSED" || status === "TIMED_OUT" || status === "CHANNEL_ERROR") {
        subscribed = false;
        announcedOnline = false;
        if (channel === ch) channel = null;
        try {
          void ch.unsubscribe();
        } catch {
          // ignore
        }
        scheduleReconnect();
      }
    });
  };

  const heartbeat = setInterval(() => {
    if (stopped) return;
    // Não manda heartbeat se a aba não está visível — assim a pessoa
    // some do "ao vivo" enquanto está em outra aba/janela.
    if (!isPageVisible()) return;
    if (!subscribed) {
      scheduleReconnect();
      return;
    }
    sendHeartbeat();
  }, HEARTBEAT_MS);

  const syncPresence = () => {
    if (stopped) return;
    if (!isPageVisible()) {
      sendOffline();
      return;
    }
    if (!subscribed || !channel) connect();
    sendHeartbeat();
    setTimeout(sendHeartbeat, 250);
  };

  const markActive = () => {
    syncPresence();
  };

  const setScreen = (kind: string) => {
    const next = kind || "main";
    if (next === currentScreen && announcedOnline) return;
    currentScreen = next;
    syncPresence();
    // Reenvia logo em seguida pra cobrir casos de race no broadcast/presence
    // (ex.: voltar pelo botão do navegador). Sem isso o painel às vezes
    // ficava travado mostrando a tela anterior.
    setTimeout(sendHeartbeat, 150);
    setTimeout(sendHeartbeat, 600);
  };

  // Tab escondida = offline imediato. Só conta online quando a pessoa
  // realmente está olhando pra tela do anúncio.
  const onVisibility = () => {
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      sendOffline();
    } else {
      syncPresence();
    }
  };
  const onPageHide = () => sendOffline();
  const onBlur = () => sendOffline();
  const onOnline = () => syncPresence();

  connect();

  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", onPageHide);
  window.addEventListener("beforeunload", onPageHide);
  window.addEventListener("blur", onBlur);
  // Ao voltar pra aba/rede, reforça o online imediatamente.
  window.addEventListener("focus", syncPresence);
  window.addEventListener("pageshow", syncPresence);
  window.addEventListener("online", onOnline);

  const stop = () => {
    if (stopped) return;
    stopped = true;
    clearInterval(heartbeat);
    if (reconnectTimer) clearTimeout(reconnectTimer);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pagehide", onPageHide);
    window.removeEventListener("beforeunload", onPageHide);
    window.removeEventListener("blur", onBlur);
    window.removeEventListener("focus", syncPresence);
    window.removeEventListener("pageshow", syncPresence);
    window.removeEventListener("online", onOnline);

    const ch = channel;
    channel = null;
    subscribed = false;

    if (!ch) return;
    void (async () => {
      if (announcedOnline) {
        try {
          await ch.send({
            type: "broadcast",
            event: OFFLINE_EVENT,
            payload: { adId, sessionId, connectionId: presenceKey },
          });
        } catch {
          // ignore final offline send failure
        } finally {
          announcedOnline = false;
        }
      }

      try {
        await ch.untrack();
      } catch {
        // ignore untrack failure
      }

      try {
        await ch.unsubscribe();
      } catch {
        // ignore unsubscribe failure
      }
    })();
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
  const connections = new Map<string, PresenceMeta>();
  let trackedConnectionIds = new Set<string>();
  let sessionsPreviouslyOnline = new Set<string>();
  let stopped = false;
  let channel: ReturnType<typeof supabase.channel> | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let hasSyncedPresence = false;

  const hasOnlineSession = (sessionId: string) => {
    const cutoff = Date.now() - STALE_MS;
    for (const meta of connections.values()) {
      if (meta.sessionId !== sessionId) continue;
      const ts = meta.online_at ? Date.parse(meta.online_at) : 0;
      if (ts >= cutoff) return true;
    }
    return false;
  };

  const emit = () => {
    const map = new Map<string, PresenceMeta>();
    const cutoff = Date.now() - STALE_MS;
    const removed: string[] = [];
    const latestBySession = new Map<string, PresenceMeta>();

    for (const [connectionId, meta] of Array.from(connections.entries())) {
      const ts = meta.online_at ? Date.parse(meta.online_at) : 0;
      if (!ts || ts < cutoff) {
        connections.delete(connectionId);
        trackedConnectionIds.delete(connectionId);
        continue;
      }

      const current = latestBySession.get(meta.sessionId);
      const currentTs = current?.online_at ? Date.parse(current.online_at) : 0;
      if (!current || ts >= currentTs) latestBySession.set(meta.sessionId, meta);
    }

    for (const [sessionId, meta] of latestBySession) {
      map.set(sessionId, meta);
    }

    for (const sessionId of sessionsPreviouslyOnline) {
      if (!map.has(sessionId)) removed.push(sessionId);
    }

    onChange(map);
    sessionsPreviouslyOnline = new Set(map.keys());
    if (onLeave) {
      for (const sid of removed) onLeave(sid);
    }
  };

  const syncFromPresenceState = (ch: ReturnType<typeof supabase.channel>) => {
    const before = new Set(sessionsPreviouslyOnline);
    const nextTracked = new Map<string, PresenceMeta>();
    const rawState = ch.presenceState() as Record<string, unknown[]>;

    for (const [key, presences] of Object.entries(rawState)) {
      if (!Array.isArray(presences)) continue;

      presences.forEach((raw, index) => {
        const meta = raw as Partial<PresenceMeta> | null;
        if (!meta?.sessionId || !meta.adId) return;

        const connectionId = meta.connectionId || key || `presence-${meta.sessionId}-${index}`;
        nextTracked.set(connectionId, {
          adId: meta.adId,
          sessionId: meta.sessionId,
          connectionId,
          online_at: meta.online_at || new Date().toISOString(),
          screenKind: meta.screenKind || "main",
        });
      });
    }

    for (const oldId of trackedConnectionIds) {
      if (!nextTracked.has(oldId)) connections.delete(oldId);
    }

    for (const [connectionId, meta] of nextTracked) {
      connections.set(connectionId, meta);
    }

    trackedConnectionIds = new Set(nextTracked.keys());
    emit();

    if (hasSyncedPresence && onJoin) {
      for (const [sessionId, meta] of Array.from(connections.values()).map((meta) => [meta.sessionId, meta] as const)) {
        if (!before.has(sessionId) && hasOnlineSession(sessionId)) onJoin(sessionId, meta);
      }
    }

    hasSyncedPresence = true;
  };

  const scheduleReconnect = () => {
    if (stopped) return;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, 1000);
  };

  const connect = () => {
    if (stopped) return;

    if (channel) {
      try {
        void channel.unsubscribe();
      } catch {
        // ignore old channel cleanup
      }
      channel = null;
    }

    const channelKey = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const ch = supabase.channel(CHANNEL_NAME, {
      config: { presence: { key: `dashboard-${channelKey}` } },
    });
    channel = ch;

    ch.on("presence", { event: "sync" }, () => {
      if (stopped || channel !== ch) return;
      syncFromPresenceState(ch);
    })
      .on("presence", { event: "join" }, () => {
        if (stopped || channel !== ch) return;
        syncFromPresenceState(ch);
      })
      .on("presence", { event: "leave" }, () => {
        if (stopped || channel !== ch) return;
        syncFromPresenceState(ch);
      })
      .on("broadcast", { event: HEARTBEAT_EVENT }, ({ payload }) => {
        const meta = payload as PresenceMeta | null;
        if (!meta?.sessionId) return;
        const wasOnline = hasOnlineSession(meta.sessionId);
        const connectionId = meta.connectionId || `legacy-${meta.sessionId}`;
        connections.set(connectionId, { ...meta, connectionId });
        emit();
        if (!wasOnline && onJoin) {
          onJoin(meta.sessionId, meta);
        }
      })
      .on("broadcast", { event: OFFLINE_EVENT }, ({ payload }) => {
        const meta = payload as Partial<PresenceMeta> | null;
        if (!meta?.sessionId) return;

        if (meta.connectionId) {
          connections.delete(meta.connectionId);
          trackedConnectionIds.delete(meta.connectionId);
        } else {
          for (const [connectionId, item] of Array.from(connections.entries())) {
            if (item.sessionId === meta.sessionId) {
              connections.delete(connectionId);
              trackedConnectionIds.delete(connectionId);
            }
          }
        }

        emit();
      })
      .subscribe((status) => {
        if (stopped || channel !== ch) return;

        if (status === "SUBSCRIBED") {
          // O sync de presence vai preencher o painel mesmo que heartbeats
          // anteriores tenham sido perdidos durante reload/reconexão.
          setTimeout(() => {
            if (!stopped && channel === ch) syncFromPresenceState(ch);
          }, 300);
          return;
        }

        if (status === "CLOSED" || status === "TIMED_OUT" || status === "CHANNEL_ERROR") {
          try {
            void ch.unsubscribe();
          } catch {
            // ignore
          }
          if (channel === ch) channel = null;
          scheduleReconnect();
        }
      });
  };

  connect();

  // Reconecta ao voltar pra aba/foco ou quando a rede volta — garante que
  // o painel não fique preso mostrando offline depois de suspender o PC,
  // trocar de rede, etc.
  const reconnectNow = () => {
    if (stopped) return;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    connect();
  };

  const onFocus = () => reconnectNow();
  const onOnline = () => reconnectNow();
  if (typeof window !== "undefined") {
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);
  }

  const sweep = setInterval(emit, HEARTBEAT_MS);

  return () => {
    stopped = true;
    clearInterval(sweep);
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (typeof window !== "undefined") {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
    }
    connections.clear();
    trackedConnectionIds.clear();
    if (channel) {
      try {
        void channel.unsubscribe();
      } catch {
        // ignore
      }
      channel = null;
    }
  };
}

