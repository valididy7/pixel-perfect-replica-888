import { useEffect } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { POSTS } from "@/data/blog-posts";
import { BlogLayout } from "@/components/blog/BlogLayout";
import { PostCard } from "@/components/blog/PostCard";
import { ArrowLeft } from "lucide-react";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = POSTS.find((p) => p.slug === slug);

  useEffect(() => {
    if (post) document.title = `${post.title} — Portal Seguro`;
  }, [post]);

  if (!post) return <Navigate to="/" replace />;

  const related = POSTS.filter((p) => p.category === post.category && p.slug !== post.slug).slice(0, 3);

  return (
    <BlogLayout>
      <article className="mx-auto max-w-3xl px-4 py-10">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-6">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar
        </Link>
        <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-slate-600">
          {post.category}
        </span>
        <h1 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">{post.title}</h1>
        <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
          <span>{post.date}</span>
          <span>•</span>
          <span>{post.readTime} de leitura</span>
        </div>
        <div className="mt-8 space-y-5 text-[15px] leading-7 text-slate-700">
          {post.content.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </article>

      {related.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 py-10 border-t border-slate-200">
          <h2 className="mb-6 text-lg font-semibold text-slate-900">Leia também</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => <PostCard key={p.slug} post={p} />)}
          </div>
        </section>
      )}
    </BlogLayout>
  );
}
