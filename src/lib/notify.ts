/**
 * Som curto + notificação do navegador quando entram tentativas novas no painel.
 * Tudo feito sem dependência: o "ding" é gerado via WebAudio e a notificação
 * usa a Notification API nativa.
 *
 * Uso típico no Dashboard:
 *   const notify = useAttemptNotifier();
 *   useEffect(() => { notify(pendingCount, "Nova tentativa pendente"); }, [pendingCount]);
 */
import { useCallback, useEffect, useRef } from "react";

const SOUND_ENABLED_KEY = "panel_sound_enabled";

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(SOUND_ENABLED_KEY) !== "0";
}

export function setSoundEnabled(on: boolean) {
  try {
    localStorage.setItem(SOUND_ENABLED_KEY, on ? "1" : "0");
  } catch {
    // ignore
  }
}

/** Toca um "ding" curto (~280ms) sem precisar de arquivo de áudio. */
export function playDing() {
  if (typeof window === "undefined") return;
  if (!isSoundEnabled()) return;
  try {
    const Ctx =
      (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    // Dois tons rápidos: lá6 -> mi7
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    osc.start(now);
    osc.stop(now + 0.3);
    osc.onended = () => {
      try {
        ctx.close();
      } catch {
        // ignore
      }
    };
  } catch {
    // ignore audio errors silently
  }
}

/**
 * Toca uma sequência custom de tons. Cada step = (freq Hz, duração s).
 * Volume baixinho pra não assustar. Usa WebAudio puro, sem dependência.
 */
function playTones(steps: Array<{ freq: number; dur: number }>, type: OscillatorType = "sine") {
  if (typeof window === "undefined") return;
  if (!isSoundEnabled()) return;
  try {
    const Ctx =
      (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    let t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    gain.gain.setValueAtTime(0.0001, t);
    let total = 0;
    for (const s of steps) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, s.freq), t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.14, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + s.dur);
      t += s.dur;
      total += s.dur;
    }
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + total + 0.05);
    osc.onended = () => {
      try { ctx.close(); } catch { /* ignore */ }
    };
  } catch {
    // ignore
  }
}

/** Som de visitante ENTROU online — sobe (dó5 → sol5), curtinho e alegre. */
export function playVisitorOnline() {
  playTones([
    { freq: 523, dur: 0.10 },
    { freq: 784, dur: 0.16 },
  ], "triangle");
}

/** Som de visitante SAIU offline — desce (sol5 → dó5), curtinho e seco. */
export function playVisitorOffline() {
  playTones([
    { freq: 660, dur: 0.10 },
    { freq: 330, dur: 0.18 },
  ], "triangle");
}

/** Pede permissão (uma vez) pra exibir notificações do sistema. */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  try {
    const res = await Notification.requestPermission();
    return res === "granted";
  } catch {
    return false;
  }
}

export function showSystemNotification(title: string, body?: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  // Só notifica se a aba NÃO estiver visível (senão é redundante).
  if (document.visibilityState === "visible") return;
  try {
    const n = new Notification(title, {
      body,
      icon: "/k7m2-icon-192.png",
      tag: "k7m2-attempt",
      renotify: true,
    } as NotificationOptions & { renotify?: boolean });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    // ignore
  }
}

/**
 * Hook utilitário: dispara `playDing()` + notificação do sistema quando o
 * `count` informado AUMENTA. Ignora a primeira leitura (mount) pra evitar
 * tocar som quando o painel só carrega o histórico.
 */
export function useCountIncreaseNotifier() {
  const lastRef = useRef<Map<string, number>>(new Map());

  return useCallback((bucket: string, current: number, opts: { title: string; body?: string }) => {
    const last = lastRef.current.get(bucket);
    lastRef.current.set(bucket, current);
    if (last === undefined) return; // primeira leitura — só guarda baseline
    if (current > last) {
      playDing();
      showSystemNotification(opts.title, opts.body);
    }
  }, []);
}

/**
 * Atualiza o `document.title` com `(N)` quando há pendências.
 * Chamar em useEffect com `pendingCount` como dependência.
 */
export function useTitleBadge(pendingCount: number, baseTitle = "Painel Valididy") {
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.title = pendingCount > 0 ? `(${pendingCount}) ${baseTitle}` : baseTitle;
  }, [pendingCount, baseTitle]);
}