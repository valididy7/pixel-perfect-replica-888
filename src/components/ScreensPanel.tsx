import { FormEvent, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdScreen, ScreenKind, SCREEN_KIND_LABELS } from "@/types/screen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, ExternalLink, Trash2, Edit3 } from "lucide-react";
import { toast } from "sonner";

interface ScreensPanelProps {
  adId: string;
}

export function ScreensPanel({ adId }: ScreensPanelProps) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState("");
  const [kind, setKind] = useState<ScreenKind>("reactivate");
  const [cloning, setCloning] = useState(false);

  const { data: screens = [], isLoading } = useQuery({
    queryKey: ["ad_screens", adId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_screens")
        .select("*")
        .eq("ad_id", adId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as AdScreen[];
    },
  });

  const handleClone = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    try { new URL(trimmed); } catch { return toast.error("URL inválida"); }

    setCloning(true);
    try {
      const { data, error } = await supabase.functions.invoke("clone-url-screen", {
        body: { url: trimmed, ad_id: adId, kind },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      toast.success("Tela clonada!");
      setUrl("");
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["ad_screens", adId] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao clonar");
    } finally {
      setCloning(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover essa tela?")) return;
    const { error } = await supabase.from("ad_screens").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Tela removida");
    qc.invalidateQueries({ queryKey: ["ad_screens", adId] });
  };

  const handleKindChange = async (id: string, newKind: string) => {
    const { error } = await supabase.from("ad_screens").update({ kind: newKind }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Tipo atualizado");
    qc.invalidateQueries({ queryKey: ["ad_screens", adId] });
  };

  const usedKinds = new Set(screens.map((s) => s.kind));

  return (
    <div className="mt-8 rounded-lg border border-border bg-background/50 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Telas vinculadas</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Clone outras URLs e elas viram telas editáveis. Os botões do modal "Preciso de ajuda" navegam pra elas dentro do iframe.
          </p>
        </div>
        {!showForm && (
          <Button size="sm" variant="secondary" onClick={() => setShowForm(true)}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar
          </Button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleClone} className="mt-4 space-y-3 rounded-md border border-border bg-card/50 p-3">
          <div className="space-y-1">
            <Label htmlFor="screen-kind" className="text-xs">Tipo</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as ScreenKind)}>
              <SelectTrigger id="screen-kind"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["reactivate", "forgot-password", "passwordless", "register", "custom"] as ScreenKind[]).map((k) => (
                  <SelectItem key={k} value={k} disabled={k !== "custom" && usedKinds.has(k)}>
                    {SCREEN_KIND_LABELS[k]}{k !== "custom" && usedKinds.has(k) ? " (já existe)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="screen-url" className="text-xs">URL</Label>
            <Input
              id="screen-url"
              type="url"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              disabled={cloning}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)} disabled={cloning}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={cloning}>
              {cloning && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
              Clonar
            </Button>
          </div>
        </form>
      )}

      <div className="mt-4 space-y-2">
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        {!isLoading && screens.length === 0 && !showForm && (
          <p className="text-xs text-muted-foreground italic">Nenhuma tela vinculada ainda.</p>
        )}
        {screens.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-2 rounded-md border border-border bg-card/30 p-2.5">
            <div className="min-w-0 flex-1">
              <Select value={s.kind} onValueChange={(v) => handleKindChange(s.id, v)}>
                <SelectTrigger className="h-7 w-auto gap-1 border-0 bg-primary/10 px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide text-primary hover:bg-primary/20 focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["reactivate", "forgot-password", "passwordless", "register", "custom"] as ScreenKind[]).map((k) => (
                    <SelectItem key={k} value={k} disabled={k !== "custom" && k !== s.kind && usedKinds.has(k)}>
                      {SCREEN_KIND_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 truncate text-xs text-muted-foreground" title={s.source_url || ""}>
                {s.source_url}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button asChild size="sm" variant="ghost" className="h-7 w-7 p-0" aria-label="Editar tela">
                <Link to={`/editor/${adId}/screen/${s.id}`}>
                  <Edit3 className="h-3.5 w-3.5" />
                </Link>
              </Button>
              {s.source_url && (
                <Button asChild size="sm" variant="ghost" className="h-7 w-7 p-0" aria-label="Abrir URL original">
                  <a href={s.source_url} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              )}
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(s.id)} aria-label="Remover">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
