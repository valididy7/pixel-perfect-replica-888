import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type AdRow = {
  id: string;
  slug: string;
  title: string;
  thumbnail_url: string | null;
  price: string | null;
  updated_at: string;
};

/**
 * Rota pública "/" → lista todos os anúncios ativos.
 * O painel admin vive numa rota secreta separada.
 */
const Index = () => {
  const [ads, setAds] = useState<AdRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("ads")
        .select("id, slug, title, thumbnail_url, price, updated_at")
        .eq("status", "active")
        .order("updated_at", { ascending: false });
      if (cancelled) return;
      if (error) console.error("[Index] erro ao listar anúncios:", error);
      setAds(data || []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <h1 className="text-2xl font-semibold">Anúncios ativos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Clique em um anúncio para abrir.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-8">
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : ads.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum anúncio ativo no momento.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ads.map((ad) => (
              <li key={ad.id}>
                <Link
                  to={`/ad/${ad.slug}`}
                  className="group block rounded-lg border border-border bg-card overflow-hidden hover:border-primary transition-colors"
                >
                  <div className="aspect-video bg-muted overflow-hidden">
                    {ad.thumbnail_url ? (
                      <img
                        src={ad.thumbnail_url}
                        alt={ad.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                        sem imagem
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h2 className="text-sm font-medium line-clamp-2">{ad.title}</h2>
                    {ad.price && (
                      <p className="text-sm text-primary font-semibold mt-1">{ad.price}</p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
};

export default Index;
