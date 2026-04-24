import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, ShieldOff, Plus, Trash2, Loader2, Ban } from "lucide-react";
import { toast } from "sonner";

interface BlockedEmail {
  id: string;
  ad_id: string;
  email: string;
  reason: string;
  created_at: string;
}

interface AdOption {
  id: string;
  title: string;
}

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function BlockedEmailsPanel() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<BlockedEmail[]>([]);
  const [ads, setAds] = useState<AdOption[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newAdId, setNewAdId] = useState<string>("");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const adTitleById = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of ads) m.set(a.id, a.title);
    return m;
  }, [ads]);

  const load = async () => {
    setLoading(true);
    const [{ data: blocked }, { data: adsData }] = await Promise.all([
      supabase
        .from("ad_blocked_emails")
        .select("id, ad_id, email, reason, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("ads").select("id, title").order("created_at", { ascending: false }),
    ]);
    setRows((blocked ?? []) as BlockedEmail[]);
    const adList = (adsData ?? []) as AdOption[];
    setAds(adList);
    if (!newAdId && adList.length > 0) setNewAdId(adList[0].id);
    setLoading(false);
  };

  useEffect(() => {
    if (!open) return;
    void load();
    const ch = supabase
      .channel("blocked-emails")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ad_blocked_emails" },
        () => void load(),
      )
      .subscribe();
    return () => {
      void ch.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleAdd = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!email || !EMAIL_RE.test(email)) {
      toast.error("Informe um e-mail válido");
      return;
    }
    if (!newAdId) {
      toast.error("Selecione um anúncio");
      return;
    }
    setAdding(true);
    const { error } = await supabase.from("ad_blocked_emails").insert({
      ad_id: newAdId,
      email,
      reason: "manual",
    });
    setAdding(false);
    if (error) {
      if (/duplicate|unique/i.test(error.message)) {
        toast.info("Esse e-mail já está banido nesse anúncio");
      } else {
        toast.error(error.message);
      }
      return;
    }
    setNewEmail("");
    toast.success("E-mail banido");
  };

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    const { error } = await supabase.from("ad_blocked_emails").delete().eq("id", id);
    setRemovingId(null);
    if (error) return toast.error(error.message);
    toast.success("Desbanido");
  };

  return (
    <section className="mt-6 hidden rounded-xl border border-border bg-card shadow-card xs:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-5 py-4 text-left transition hover:bg-muted/40"
      >
        <div className="flex items-center gap-2">
          <Ban className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">E-mails banidos</h2>
          <Badge variant="secondary" className="text-[10px]">
            {rows.length}
          </Badge>
          <span className="ml-1 text-xs text-muted-foreground">
            visitantes desses e-mails recebem "conta não existe" automaticamente
          </span>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="border-t border-border px-5 py-4">
          {/* Adicionar manualmente */}
          <div className="mb-4 rounded-lg border border-dashed border-border bg-muted/20 p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Banir um e-mail manualmente
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="h-9 flex-1 text-sm"
                disabled={adding}
              />
              <select
                value={newAdId}
                onChange={(e) => setNewAdId(e.target.value)}
                disabled={adding || ads.length === 0}
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              >
                {ads.length === 0 ? (
                  <option value="">Sem anúncios</option>
                ) : (
                  ads.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title}
                    </option>
                  ))
                )}
              </select>
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={adding || !newEmail || !newAdId}
                className="h-9"
              >
                {adding ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Plus className="mr-1 h-3 w-3" />
                )}
                Banir
              </Button>
            </div>
          </div>

          {/* Lista */}
          {loading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Carregando...
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <ShieldOff className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Nenhum e-mail banido ainda. Quando você rejeita um e-mail no painel, ele entra
                aqui automaticamente.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono-tabular text-sm">{row.email}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {adTitleById.get(row.ad_id) ?? "Anúncio desconhecido"}
                      {" · "}
                      {row.reason === "auto_reject" ? "Rejeitado no painel" : "Banido manualmente"}
                      {" · "}
                      {new Date(row.created_at).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemove(row.id)}
                    disabled={removingId === row.id}
                    className="h-8 text-xs text-muted-foreground hover:text-destructive"
                  >
                    {removingId === row.id ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="mr-1 h-3 w-3" />
                    )}
                    Desbanir
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}