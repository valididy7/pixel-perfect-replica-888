import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Mail, Copy } from "lucide-react";
import { toast } from "sonner";

interface EmailRow {
  id: string;
  ad_id: string;
  session_id: string;
  value: string;
  user_agent: string | null;
  created_at: string;
  field_name?: string;
}

interface EmailsReceivedPanelProps {
  /** Se vier, filtra apenas esse anúncio. Sem ele = todos os anúncios do dono (RLS já garante). */
  adId?: string;
  /** Mapa opcional ad_id → título, para mostrar de qual anúncio veio. */
  adTitles?: Record<string, string>;
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
  if (!ua) return "—";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Android/i.test(ua)) return "Android";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Mac OS/i.test(ua)) return "Mac";
  if (/Linux/i.test(ua)) return "Linux";
  return "Web";
}

export function EmailsReceivedPanel({ adId, adTitles }: EmailsReceivedPanelProps) {
  const [rows, setRows] = useState<EmailRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    let q = supabase
      .from("ad_leads")
      .select("id, ad_id, session_id, value, user_agent, created_at")
      .eq("field_name", "email_submitted")
      .order("created_at", { ascending: false })
      .limit(500);
    if (adId) q = q.eq("ad_id", adId);

    q.then(({ data, error }) => {
      if (!mounted) return;
      if (error) console.warn("[EmailsReceivedPanel] load:", error);
      setRows((data ?? []) as EmailRow[]);
      setLoading(false);
    });

    const channelName = adId ? `emails-received-${adId}` : "emails-received-all";
    const filter = adId ? `ad_id=eq.${adId}` : undefined;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        filter
          ? { event: "INSERT", schema: "public", table: "ad_leads", filter }
          : { event: "INSERT", schema: "public", table: "ad_leads" },
        (payload) => {
          const row = payload.new as EmailRow;
          if (row.field_name !== "email_submitted") return;
          setRows((prev) => [row, ...prev]);
          setPulse(true);
          setTimeout(() => setPulse(false), 600);
        },
      )
      .on(
        "postgres_changes",
        filter
          ? { event: "DELETE", schema: "public", table: "ad_leads", filter }
          : { event: "DELETE", schema: "public", table: "ad_leads" },
        (payload) => {
          const old = payload.old as { id: string };
          setRows((prev) => prev.filter((r) => r.id !== old.id));
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [adId]);

  const handleClearAll = async () => {
    if (!confirm("Apagar todos os e-mails recebidos?")) return;
    let q = supabase.from("ad_leads").delete().eq("field_name", "email_submitted");
    if (adId) q = q.eq("ad_id", adId);
    const { error } = await q;
    if (error) return toast.error(error.message);
    setRows([]);
    toast.success("E-mails apagados");
  };

  const handleCopy = async (val: string) => {
    try {
      await navigator.clipboard.writeText(val);
      toast.success("Copiado");
    } catch {
      toast.error("Falhou");
    }
  };

  return (
    <section className="rounded-lg border border-border bg-card/50 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`absolute inline-flex h-full w-full rounded-full bg-primary ${pulse ? "animate-ping opacity-75" : "opacity-0"}`}
            />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
          </span>
          <h3 className="text-sm font-semibold">E-mails recebidos</h3>
          <Badge variant="secondary" className="text-[10px]">
            {rows.length}
          </Badge>
        </div>
        {rows.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClearAll}
            className="h-7 text-xs text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="mr-1 h-3 w-3" />
            Limpar
          </Button>
        )}
      </div>

      <p className="mb-3 text-xs text-muted-foreground">
        E-mails confirmados quando o visitante clica em <strong>Acessar</strong>.
      </p>

      {loading ? (
        <p className="py-6 text-center text-xs text-muted-foreground">Carregando...</p>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Nenhum e-mail recebido ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {rows.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="truncate font-mono-tabular font-medium">{r.value}</div>
                  {!adId && adTitles?.[r.ad_id] && (
                    <div className="truncate text-[10px] text-muted-foreground">{adTitles[r.ad_id]}</div>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 text-[10px] text-muted-foreground">
                <span>{deviceLabel(r.user_agent)}</span>
                <span>•</span>
                <span className="font-mono-tabular">{formatTime(r.created_at)}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(r.value)}
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Copiar"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
