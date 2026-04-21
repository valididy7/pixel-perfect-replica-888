import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Ad } from "@/types/ad";
import { decompressStoredHtml } from "@/lib/ad-html-storage";
import { PreviewFrame } from "@/components/PreviewFrame";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

type PublicAdProps = {
  defaultSlug?: string;
};

const formatTitleFromSlug = (value?: string) => {
  if (!value) return "Minha conta OLX";

  const normalized = value
    .replace(/-[a-z0-9]{6,}$/i, "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return normalized || "Minha conta OLX";
};

export default function PublicAd({ defaultSlug }: PublicAdProps) {
  const { slug: routeSlug } = useParams<{ slug: string }>();
  const slug = routeSlug ?? defaultSlug;

  const { data: ad, isLoading } = useQuery({
    queryKey: ["public-ad", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .eq("slug", slug!)
        .eq("status", "active")
        .maybeSingle();
      if (error) throw error;
      return data as Ad | null;
    },
    enabled: !!slug,
  });

  useEffect(() => {
    if (!slug) return;
    document.title = formatTitleFromSlug(slug);
  }, [slug]);

  useEffect(() => {
    if (!ad || !slug) return;
    document.title = ad.title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta && ad.price) meta.setAttribute("content", `${ad.title} — ${ad.price}`);
    // Incrementa view count (não bloqueia render)
    supabase.rpc("increment_ad_view_count", { ad_slug: slug }).then(() => {});
  }, [ad, slug]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
          <Sparkles className="h-6 w-6 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Anúncio não encontrado</h1>
        <p className="text-sm text-muted-foreground">Esse link não existe ou foi removido.</p>
        <Button asChild><Link to="/">Ir para o início</Link></Button>
      </div>
    );
  }

  const html = decompressStoredHtml(ad.edited_html || ad.original_html);

  return (
    <div className="h-screen w-screen bg-white">
      <PreviewFrame html={html} mode="mobile" className="h-full w-full bg-white" adId={ad.id} />
    </div>
  );
}
