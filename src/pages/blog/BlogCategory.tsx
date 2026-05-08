import { useEffect } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { POSTS } from "@/data/blog-posts";
import { BlogLayout } from "@/components/blog/BlogLayout";
import { PostCard } from "@/components/blog/PostCard";
import { ArrowLeft } from "lucide-react";

const SLUG_TO_CAT: Record<string, string> = {
  Seguranca: "Segurança",
  Mercado: "Mercado",
  Privacidade: "Privacidade",
  Dicas: "Dicas",
  Senhas: "Senhas",
};

export default function BlogCategory() {
  const { slug } = useParams<{ slug: string }>();
  const category = slug ? SLUG_TO_CAT[slug] : undefined;

  useEffect(() => {
    if (category) document.title = `${category} — Portal Seguro`;
  }, [category]);

  if (!category) return <Navigate to="/" replace />;

  const list = POSTS.filter((p) => p.category === category);

  return (
    <BlogLayout>
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-4">
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Categoria: {category}</h1>
          <p className="mt-2 text-slate-600">
            {list.length} {list.length === 1 ? "artigo publicado" : "artigos publicados"} nessa categoria.
          </p>
        </div>
      </section>
      <main className="mx-auto max-w-5xl px-4 py-10">
        {list.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => <PostCard key={p.slug} post={p} />)}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Nenhum artigo nessa categoria ainda.</p>
        )}
      </main>
    </BlogLayout>
  );
}
