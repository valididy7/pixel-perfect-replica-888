import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, ExternalLink, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Mostra o link público do anúncio do usuário logado, com botões
 * pra copiar, abrir e editar o slug. Cada usuário tem o próprio
 * link automático (= username); se quiser, pode trocar por outro
 * único — colisão é bloqueada pela UNIQUE constraint do banco.
 */
export function MyLinkCard() {
  const { user } = useAuth();
  const [adId, setAdId] = useState<string | null>(null);
  const [slug, setSlug] = useState<string>("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("ads")
        .select("id, slug")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (cancelled || !data) return;
      setAdId(data.id);
      setSlug(data.slug);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  if (!adId) return null;

  const url = `${window.location.origin}/ad/${slug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Não consegui copiar");
    }
  };

  const handleSave = async () => {
    const next = draft.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    if (!next) return toast.error("Slug inválido");
    if (next === slug) { setEditing(false); return; }
    setSaving(true);
    const { error } = await supabase.from("ads").update({ slug: next }).eq("id", adId);
    setSaving(false);
    if (error) {
      if (/duplicate|unique/i.test(error.message)) {
        toast.error("Esse link já está em uso. Escolhe outro.");
      } else {
        toast.error(error.message);
      }
      return;
    }
    setSlug(next);
    setEditing(false);
    toast.success("Link atualizado!");
  };

  return (
    <section className="mb-4 rounded-xl border border-primary/30 bg-primary/5 p-3 shadow-card xs:mb-6 xs:p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-primary xs:text-xs">
          Meu link
        </span>
        {!editing && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[11px]"
            onClick={() => { setDraft(slug); setEditing(true); }}
          >
            <Pencil className="mr-1 h-3 w-3" /> Editar
          </Button>
        )}
      </div>

      {editing ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">{window.location.origin}/ad/</span>
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="meu-link"
            className="h-8 max-w-[200px] text-xs"
            disabled={saving}
          />
          <Button size="sm" className="h-8" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Salvar"}
          </Button>
          <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditing(false)} disabled={saving}>
            Cancelar
          </Button>
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <code className="flex-1 min-w-0 truncate rounded-md bg-background/80 px-2 py-1.5 font-mono text-xs text-foreground">
            {url}
          </code>
          <Button variant="secondary" size="sm" className="h-8" onClick={handleCopy}>
            {copied ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
            {copied ? "Copiado" : "Copiar"}
          </Button>
          <Button variant="ghost" size="sm" className="h-8" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-1 h-3.5 w-3.5" /> Abrir
            </a>
          </Button>
        </div>
      )}
    </section>
  );
}
