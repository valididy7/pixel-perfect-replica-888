import { useEffect, useMemo, useState } from "react";
import { POSTS } from "@/data/blog-posts";
import { BlogLayout } from "@/components/blog/BlogLayout";
import { PostCard } from "@/components/blog/PostCard";
import { Search } from "lucide-react";

const FILTERS = ["Todos", "Segurança", "Mercado", "Privacidade", "Dicas", "Senhas"] as const;

export default function BlogHome() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Todos");
  const [query, setQuery] = useState("");

  useEffect(() => {
    document.title = "Portal Seguro — Dicas de Segurança Digital e Mercado";
  }, []);

  const filtered = useMemo(() => {
    let list = POSTS;
    if (filter !== "Todos") list = list.filter((p) => p.category === filter);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((p) => p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q));
    return list;
  }, [filter, query]);

  return (
    <BlogLayout>
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Dicas práticas de segurança digital e mercado de vendas
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Conteúdo independente, atualizado semanalmente, para quem quer navegar, comprar e vender online com mais
            tranquilidade.
          </p>
          <div className="mt-6 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="search"
              placeholder="Buscar artigos..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                filter === f
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <h2 className="mb-6 text-lg font-semibold text-slate-900">
          {filtered.length > 0
            ? `${filtered.length} ${filtered.length === 1 ? "publicação" : "publicações"}`
            : "Nenhum artigo encontrado"}
        </h2>

        {filtered.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => <PostCard key={p.slug} post={p} />)}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Tente outra busca ou categoria.</p>
        )}
      </main>
    </BlogLayout>
  );
}
