import { Link } from "react-router-dom";
import { BlogPost } from "@/data/blog-posts";

export function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link
      to={`/post/${post.slug}`}
      className="block rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-slate-300"
    >
      <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-slate-600">
        {post.category}
      </span>
      <h3 className="mt-3 text-base font-semibold text-slate-900">{post.title}</h3>
      <p className="mt-2 text-sm text-slate-600">{post.excerpt}</p>
      <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
        <span>{post.date}</span>
        <span>{post.readTime} de leitura</span>
      </div>
    </Link>
  );
}
