import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Link as LinkIcon, Sparkles } from "lucide-react";
import { adminPath } from "@/lib/admin-route";

export function CloneUrlDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"input" | "scraping" | "saving">("input");

  const handleClone = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmedUrl = url.trim();
    try {
      new URL(trimmedUrl);
    } catch {
      return toast.error("URL inválida");
    }

    setLoading(true);
    setStep("scraping");

    try {
      const { data, error } = await supabase.functions.invoke("clone-url-ad", {
        body: { url: trimmedUrl },
      });

      if (error) throw new Error(error.message || "Falha ao chamar a função");
      if (data?.error) throw new Error(data.error);
      if (!data?.ad?.id) throw new Error("Resposta inválida da função");

      toast.success("Anúncio clonado!");
      onOpenChange(false);
      setUrl("");
      navigate(adminPath(`/editor/${data.ad.id}`));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(msg);
    } finally {
      setLoading(false);
      setStep("input");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <DialogTitle>Clonar anúncio</DialogTitle>
          <DialogDescription>
            Cole o link de um anúncio (OLX, Mercado Livre, etc.). Vamos baixar a página e abrir no editor.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleClone} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ad-url">URL do anúncio</Label>
            <div className="relative">
              <LinkIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="ad-url"
                type="url"
                required
                disabled={loading}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.olx.com.br/..."
                className="pl-9 font-mono text-sm"
              />
            </div>
          </div>

          {loading && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                {step === "scraping" && "Baixando e processando a página..."}
                {step === "saving" && "Salvando no seu dashboard..."}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-gradient-primary hover:opacity-90 shadow-glow">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Clonar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
