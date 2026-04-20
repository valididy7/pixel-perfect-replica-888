import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CloneUrlDialog } from "@/components/CloneUrlDialog";
import { Eye, ExternalLink, LogOut, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { Ad } from "@/types/ad";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [cloneOpen, setCloneOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: ads, isLoading, refetch } = useQuery({
    queryKey: ["ads", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as Ad[];
    },
    enabled: !!user,
  });

  useEffect(() => {
    document.title = "Dashboard — CloneAd";
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("ads").delete().eq("id", deleteId);
    setDeleteId(null);
    if (error) return toast.error(error.message);
    toast.success("Anúncio removido");
    refetch();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">CloneAd</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Seus anúncios</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Cole uma URL pra clonar. Edite. Publique seu próprio link.
            </p>
          </div>
          <Button onClick={() => setCloneOpen(true)} size="lg" className="bg-gradient-primary hover:opacity-90 shadow-glow">
            <Plus className="mr-2 h-4 w-4" /> Clonar anúncio
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 animate-pulse rounded-xl border border-border bg-card/50" />
            ))}
          </div>
        ) : ads && ads.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in">
            {ads.map((ad) => (
              <article
                key={ad.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition hover:border-primary/40 hover:shadow-glow"
              >
                <div className="relative aspect-video overflow-hidden bg-muted">
                  {ad.thumbnail_url ? (
                    <img
                      src={ad.thumbnail_url}
                      alt={ad.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <Sparkles className="h-8 w-8 opacity-30" />
                    </div>
                  )}
                  <div className="absolute right-2 top-2">
                    <StatusBadge status={ad.status} />
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h2 className="line-clamp-2 font-semibold leading-tight">{ad.title}</h2>
                  {ad.price && (
                    <p className="mt-2 text-lg font-bold text-gradient font-mono-tabular">{ad.price}</p>
                  )}
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {ad.view_count}
                    </span>
                    <span className="truncate font-mono">/{ad.slug}</span>
                  </div>
                  <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
                    <Button size="sm" variant="secondary" onClick={() => navigate(`/editor/${ad.id}`)} className="flex-1">
                      <Pencil className="mr-1.5 h-3.5 w-3.5" /> Editar
                    </Button>
                    {ad.status === "active" && (
                      <Button size="sm" variant="ghost" asChild>
                        <a href={`/ad/${ad.slug}`} target="_blank" rel="noopener noreferrer" aria-label="Abrir página pública">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setDeleteId(ad.id)} aria-label="Excluir anúncio">
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState onClone={() => setCloneOpen(true)} />
        )}
      </main>

      <CloneUrlDialog open={cloneOpen} onOpenChange={setCloneOpen} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir anúncio?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação é permanente. O HTML clonado será apagado.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatusBadge({ status }: { status: Ad["status"] }) {
  const map = {
    draft: { label: "Rascunho", className: "bg-muted text-muted-foreground" },
    active: { label: "Publicado", className: "bg-success text-success-foreground" },
    archived: { label: "Arquivado", className: "bg-secondary text-secondary-foreground" },
  } as const;
  const cfg = map[status];
  return <Badge className={cfg.className + " border-0 shadow-card"}>{cfg.label}</Badge>;
}

function EmptyState({ onClone }: { onClone: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-border bg-card/30 p-12 text-center animate-fade-in">
      <div className="absolute inset-0 bg-gradient-glow opacity-50" />
      <div className="relative">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
          <Sparkles className="h-7 w-7 text-primary-foreground" />
        </div>
        <h3 className="mt-6 text-xl font-semibold">Nenhum anúncio ainda</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Cole a URL de um anúncio existente (OLX, Mercado Livre, etc.) e clone com um clique.
        </p>
        <Button onClick={onClone} size="lg" className="mt-6 bg-gradient-primary hover:opacity-90 shadow-glow">
          <Plus className="mr-2 h-4 w-4" /> Clonar primeiro anúncio
        </Button>
      </div>
    </div>
  );
}
