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
}

/**
 * Liga a presença do visitante. Retorna função de cleanup.
 * Só fica "online" enquanto document.visibilityState === "visible".
 */
export function trackVisitorPresence(adId: string, sessionId: string): () => void {
  if (typeof window === "undefined") return () => {};

  const channel = supabase.channel(CHANNEL_NAME, {
    config: { presence: { key: sessionId } },
  });

  let isTracking = false;

  const startTracking = async () => {
    if (isTracking) return;
    isTracking = true;
    await channel.track({
      adId,
      sessionId,
      online_at: new Date().toISOString(),
    } satisfies PresenceMeta);
  };

  const stopTracking = async () => {
    if (!isTracking) return;
    isTracking = false;
    await channel.untrack();
  };

  channel.subscribe((status) => {
    if (status === "SUBSCRIBED" && document.visibilityState === "visible") {
      void startTracking();
    }
  });

  const onVisibility = () => {
    if (document.visibilityState === "visible") void startTracking();
    else void stopTracking();
  };
  const onPageHide = () => void stopTracking();

  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", onPageHide);
  window.addEventListener("beforeunload", onPageHide);

  return () => {
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pagehide", onPageHide);
    window.removeEventListener("beforeunload", onPageHide);
    void stopTracking().finally(() => {
      supabase.removeChannel(channel);
    });
  };
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