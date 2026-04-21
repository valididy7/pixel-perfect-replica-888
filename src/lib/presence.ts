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
 * Liga a presença do visitante usando o padrão nativo do Supabase Realtime:
 * - track() quando a aba está visível
 * - untrack() quando a aba some (visibilitychange)
 * O Realtime já mantém o WebSocket aberto, faz heartbeat interno e reconecta
 * sozinho. Sem heartbeats manuais, sem listeners redundantes — isso evita o
 * "pisca offline/online" que acontecia antes.
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

  let isSubscribed = false;
  let currentScreen = "main";

  const doTrack = async () => {
    if (!isSubscribed) return;
    await channel.track({
      adId,
      sessionId,
      online_at: new Date().toISOString(),
      screenKind: currentScreen,
    } satisfies PresenceMeta);
  };

  const setScreen = (kind: string) => {
    currentScreen = kind || "main";
    void doTrack();
  };

  channel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      isSubscribed = true;
      // Só anuncia presença se a aba está visível agora.
      if (typeof document === "undefined" || document.visibilityState === "visible") {
        void doTrack();
      }
    }
  });

  // Sinal principal: visibilitychange (instantâneo, sem delay).
  // Aba visível → track na hora. Aba escondida → untrack na hora.
  const onVisibility = () => {
    if (!isSubscribed) return;
    if (document.visibilityState === "visible") {
      void doTrack();
    } else {
      void channel.untrack();
    }
  };

  // Camada extra de "vivo": qualquer toque/movimento/scroll/tecla reativa
  // a presença INSTANTANEAMENTE. Cobre o caso do navegador não disparar
  // visibilitychange direito (ex: tela bloqueia/desbloqueia rápido, swipe
  // entre abas no mobile, modal do sistema sobrepondo).
  const onActivity = () => {
    if (!isSubscribed) return;
    if (document.visibilityState !== "visible") return;
    void doTrack();
  };

  document.addEventListener("visibilitychange", onVisibility);
  // passive: true → não bloqueia scroll/touch, performance máxima.
  window.addEventListener("focus", onActivity);
  window.addEventListener("pageshow", onActivity);
  document.addEventListener("touchstart", onActivity, { passive: true });
  document.addEventListener("pointerdown", onActivity, { passive: true });
  document.addEventListener("mousemove", onActivity, { passive: true });
  document.addEventListener("scroll", onActivity, { passive: true });
  document.addEventListener("keydown", onActivity);

  const stop = () => {
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("focus", onActivity);
    window.removeEventListener("pageshow", onActivity);
    document.removeEventListener("touchstart", onActivity);
    document.removeEventListener("pointerdown", onActivity);
    document.removeEventListener("mousemove", onActivity);
    document.removeEventListener("scroll", onActivity);
    document.removeEventListener("keydown", onActivity);
    if (isSubscribed) {
      void channel.untrack().finally(() => {
        supabase.removeChannel(channel);
      });
    } else {
      supabase.removeChannel(channel);
    }
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