import { supabase } from "@/integrations/supabase/client";

/**
 * Canal único de presença pra rastrear visitantes "ao vivo" em qualquer anúncio.
 * Cada visitante público chama `trackVisitorPresence(adId, sessionId)` e fica
 * registrado APENAS enquanto a aba estiver visível (visibilitychange).
 * O painel pode ouvir via `subscribeToOnlineVisitors`.
 */

const CHANNEL_NAME = "online-visitors-global";

export interface PresenceMeta {
  adId: string;
  sessionId: string;
  online_at: string;
  screenKind?: string;
}

/**
 * Liga a presença do visitante. Mantém o estado online/offline confiável usando
 * MÚLTIPLOS sinais do navegador (visibility, focus, blur, pageshow, online/offline)
 * + heartbeat periódico de re-track. Garante que ao voltar do bfcache (botão
 * "voltar"), trocar de aba ou reconectar a internet, o painel reflita o estado real.
 * Retorna `stop()` pra cleanup e `setScreen(kind)` pra atualizar a tela atual.
 */
export function trackVisitorPresence(
  adId: string,
  sessionId: string,
): { stop: () => void; setScreen: (kind: string) => void } {
  if (typeof window === "undefined") {
    return { stop: () => {}, setScreen: () => {} };
  }

  // Key única por CONEXÃO (não por sessionId). Garante que sair e voltar
  // sempre dispara um novo "join" no painel, mesmo que o session_id (cookie)
  // do visitante seja o mesmo.
  const presenceKey = `visitor-${sessionId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const channel = supabase.channel(CHANNEL_NAME, {
    config: { presence: { key: presenceKey } },
  });

  let isTracking = false;
  let isSubscribed = false;
  let currentScreen = "main";
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  /** Considera "ativo" se a aba está visível OU em foco (cobre todos os edge cases). */
  const isActive = (): boolean => {
    if (typeof document === "undefined") return false;
    if (document.visibilityState === "visible") return true;
    if (document.hasFocus && document.hasFocus()) return true;
    return false;
  };

  const doTrack = async () => {
    if (!isSubscribed) return;
    await channel.track({
      adId,
      sessionId,
      online_at: new Date().toISOString(),
      screenKind: currentScreen,
    } satisfies PresenceMeta);
  };

  const startTracking = async () => {
    if (isTracking) return;
    isTracking = true;
    await doTrack();
  };

  const stopTracking = async () => {
    if (!isTracking) return;
    isTracking = false;
    if (!isSubscribed) return;
    await channel.untrack();
  };

  const setScreen = (kind: string) => {
    currentScreen = kind || "main";
    if (!isTracking) return;
    void doTrack();
  };

  /** Sincroniza o estado real do navegador com a presença. Idempotente. */
  const syncState = () => {
    if (isActive()) {
      void startTracking();
    } else {
      void stopTracking();
    }
  };

  channel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      isSubscribed = true;
      syncState();
    }
  });

  const onVisibility = () => syncState();
  const onFocus = () => syncState();
  const onBlur = () => syncState();
  // pageshow dispara ao voltar do bfcache (botão "voltar"). Sempre re-sincroniza.
  const onPageShow = () => syncState();
  // pagehide marca offline imediato (vai pro bfcache ou fecha a aba).
  const onPageHide = () => void stopTracking();
  const onOnline = () => syncState();
  const onOffline = () => void stopTracking();

  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("focus", onFocus);
  window.addEventListener("blur", onBlur);
  window.addEventListener("pageshow", onPageShow);
  window.addEventListener("pagehide", onPageHide);
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);

  // Heartbeat: a cada 20s, se está ativo, re-anuncia a presença.
  // Garante recuperação automática se o canal cair e reconectar silenciosamente.
  heartbeat = setInterval(() => {
    if (isActive() && isSubscribed) {
      void doTrack();
    }
  }, 20000);

  const stop = () => {
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("focus", onFocus);
    window.removeEventListener("blur", onBlur);
    window.removeEventListener("pageshow", onPageShow);
    window.removeEventListener("pagehide", onPageHide);
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
    if (heartbeat) clearInterval(heartbeat);
    heartbeat = null;
    void stopTracking().finally(() => {
      supabase.removeChannel(channel);
    });
  };

  return { stop, setScreen };
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
      // Pega a meta mais recente desse session_id
      const latest = metas.reduce((acc, m) =>
        (m.online_at ?? "") > (acc.online_at ?? "") ? m : acc,
      );
      if (latest?.sessionId) map.set(latest.sessionId, latest);
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
    supabase.removeChannel(channel);
  };
}